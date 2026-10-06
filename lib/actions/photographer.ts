"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, getPhotographer } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { notifyPhotosReady } from "@/lib/email";
import { parseBankForm, saveBankAccount } from "@/lib/bank";
import { balanceOf } from "@/lib/format";

const back = (msg: string, event?: string): never =>
  redirect(`/photographer?${event ? `event=${event}&` : ""}msg=${encodeURIComponent(msg)}&t=${Date.now()}`);
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

async function me() {
  const user = await requireRole("photographer");
  const p = await getPhotographer(user);
  if (!p) redirect("/photographer");
  return p;
}

/** Photographers can add themselves to any event that is not closed, then publish their own times. */
export async function joinEvent(fd: FormData) {
  const p = await me();
  const eventId = String(fd.get("event"));
  const d = db();
  const { data: ev } = await d.from("events").select("id, status").eq("id", eventId).maybeSingle();
  if (!ev || ev.status === "closed") return back("That event is not taking photographers.");
  await d.from("event_photographers").upsert({ event_id: ev.id, photographer_id: p.id }, { ignoreDuplicates: true });
  revalidatePath("/photographer"); revalidatePath("/graduation");
  back("You joined the event. Add your available times below.", ev.id);
}

export async function leaveEvent(fd: FormData) {
  const p = await me();
  const eventId = String(fd.get("event"));
  const d = db();
  const { count } = await d.from("slots").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("photographer_id", p.id).eq("status", "booked");
  if (count) return back("You have bookings on this event, so you cannot leave it. Contact Fourmen.", eventId);
  await d.from("slots").delete().eq("event_id", eventId).eq("photographer_id", p.id);
  await d.from("event_photographers").delete().eq("event_id", eventId).eq("photographer_id", p.id);
  revalidatePath("/photographer"); revalidatePath("/graduation");
  back("You left the event.");
}

export async function createSlots(fd: FormData) {
  const p = await me();
  const eventId = String(fd.get("event")), date = String(fd.get("date")), from = String(fd.get("from")), until = String(fd.get("until"));
  const d = db();
  const { data: link } = await d.from("event_photographers").select("event_id").eq("event_id", eventId).eq("photographer_id", p.id).maybeSingle();
  if (!link) return back("You are not assigned to that event.");
  const { data: ev } = await d.from("events").select("slot_minutes").eq("id", eventId).single();
  if (!date || !from || !until || toMin(until) <= toMin(from)) return back("Choose a date and a valid time range.", eventId);
  const rows = [];
  for (let m = toMin(from); m + ev!.slot_minutes <= toMin(until); m += ev!.slot_minutes)
    rows.push({ event_id: eventId, photographer_id: p.id, slot_date: date, start_time: hm(m), end_time: hm(m + ev!.slot_minutes) });
  if (!rows.length) return back("That range is shorter than one slot.", eventId);
  await d.from("slots").upsert(rows, { onConflict: "event_id,photographer_id,slot_date,start_time", ignoreDuplicates: true });
  revalidatePath("/photographer");
  back(`Added up to ${rows.length} slots.`, eventId);
}

export async function setSlotStatus(fd: FormData) {
  const p = await me();
  const id = String(fd.get("id")), status = String(fd.get("status")), event = String(fd.get("event"));
  if (!["open", "blocked"].includes(status)) return;
  // Only the owner's slots, and never one that already has a booking.
  await db().from("slots").update({ status }).eq("id", id).eq("photographer_id", p.id).neq("status", "booked");
  revalidatePath("/photographer");
  back("Slot updated.", event);
}

export async function deleteSlot(fd: FormData) {
  const p = await me();
  const event = String(fd.get("event"));
  await db().from("slots").delete().eq("id", String(fd.get("id"))).eq("photographer_id", p.id).neq("status", "booked");
  revalidatePath("/photographer");
  back("Slot removed.", event);
}

export async function markShootDone(fd: FormData) {
  const p = await me();
  const d = db();
  const { data } = await d.from("bookings").update({ shoot_done: true })
    .eq("id", String(fd.get("id"))).eq("photographer_id", p.id).eq("advance_status", "approved").select("id, package_price, advance_lkr");
  const b = data?.[0];
  // Advance already covered the whole package: nothing to collect, so the photos unlock straight away.
  const nothingDue = !!b && balanceOf(b) <= 0;
  if (b && nothingDue) {
    await d.from("bookings").update({ balance_status: "approved" }).eq("id", b.id).in("balance_status", ["none", "rejected"]);
    await notifyPhotosReady(b.id);
  }
  revalidatePath("/photographer");
  back(!b ? "Advance must be approved first." : nothingDue ? "Shoot marked as done. The package is fully paid, so the client sees the album as soon as you add the link." : "Shoot marked as done. The client can pay the balance from their booking page.", String(fd.get("event")));
}

/** Accepts only a normal https web address, so nothing like "javascript:" can be stored and shown to a client. */
function albumLink(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" && u.hostname.includes(".") ? u.toString() : null;
  } catch { return null; }
}

/** Photographers deliver edited photos as a link to their own cloud album. Clients only see it once paid in full. */
export async function saveAlbumLink(fd: FormData) {
  const p = await me();
  const id = String(fd.get("id")), event = String(fd.get("event") || "");
  const raw = String(fd.get("album_url") || "").trim();
  const note = String(fd.get("album_note") || "").trim().slice(0, 500) || null;
  const url = raw ? albumLink(raw) : null;
  if (raw && !url) return back("That link does not look right. Paste the full share link, starting with https://", event);
  const d = db();
  const { data: b } = await d.from("bookings").update({ album_url: url, album_note: url ? note : null, album_added_at: url ? new Date().toISOString() : null })
    .eq("id", id).eq("photographer_id", p.id).eq("advance_status", "approved").select("id").maybeSingle();
  if (!b) return back("Not your booking, or its advance is not approved yet.", event);
  if (url) await notifyPhotosReady(b.id); // emails the client only once they have paid in full
  revalidatePath("/photographer");
  back(url ? "Album link saved. The client sees it as soon as they have paid in full." : "Album link removed.", event);
}

export async function savePackage(fd: FormData) {
  const p = await me();
  const id = String(fd.get("id") || ""), name = String(fd.get("name")).trim();
  const price = Math.round(Number(fd.get("price")));
  if (!name || !(price >= 0)) return back("Give the package a name and a price.");
  const row = {
    photographer_id: p.id, name, price_lkr: price, description: String(fd.get("description") || "").trim() || null,
    inclusions: String(fd.get("inclusions") || "").split("\n").map((s) => s.trim()).filter(Boolean),
  };
  const d = db();
  if (id) await d.from("packages").update(row).eq("id", id).eq("photographer_id", p.id);
  else await d.from("packages").insert(row);
  revalidatePath("/photographer");
  back("Package saved.");
}

export async function deletePackage(fd: FormData) {
  const p = await me();
  await db().from("packages").delete().eq("id", String(fd.get("id"))).eq("photographer_id", p.id);
  revalidatePath("/photographer");
  back("Package removed.");
}

export async function registerPortfolioImage(path: string) {
  const p = await me();
  if (!path.startsWith(p.id + "/")) return { error: "Invalid file." };
  await db().from("portfolio_images").insert({ photographer_id: p.id, path });
  revalidatePath("/photographer");
  return {};
}

export async function deletePortfolioImage(fd: FormData) {
  const p = await me();
  const d = db();
  const { data: img } = await d.from("portfolio_images").select("id, path").eq("id", String(fd.get("id"))).eq("photographer_id", p.id).maybeSingle();
  if (img) { await d.storage.from("portfolio").remove([img.path]); await d.from("portfolio_images").delete().eq("id", img.id); }
  revalidatePath("/photographer");
  back("Photo removed.");
}

/** Photographers keep their own payout bank details up to date. */
export async function saveBankDetails(fd: FormData) {
  const p = await me();
  const user = await requireRole("photographer");
  const parsed = parseBankForm(fd);
  if ("error" in parsed) return back(parsed.error);
  const r = await saveBankAccount(p.id, parsed.row, user.id, false);
  if ("error" in r) return back(r.error!);
  revalidatePath("/photographer");
  back(r.changed ? "Payout details saved. We have emailed you a confirmation." : "No changes to save.");
}
