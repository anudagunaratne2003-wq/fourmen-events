"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole, envAdminEmails } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { notifyPhotosReady } from "@/lib/email";
import { STATUS, isStatus } from "@/lib/events";
import { lkr, splitPayment, fullyPaid } from "@/lib/format";

const back = (path: string, msg: string): never => redirect(`${path}?msg=${encodeURIComponent(msg)}`);
const isoDate = (v: FormDataEntryValue | null) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : null);

export async function reviewPayment(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id")), kind = String(fd.get("kind")), approve = String(fd.get("decision")) === "approve";
  const note = String(fd.get("note") || "").trim() || null;
  const d = db();
  const { data: b } = await d.from("bookings").select("*").eq("id", id).single();
  if (!b) return back("/admin", "Booking not found.");

  if (kind === "advance" && b.advance_status === "pending") {
    if (approve) await d.from("bookings").update({ advance_status: "approved", review_note: null }).eq("id", id);
    else {
      // Rejected advance: release the slot so someone else can book it.
      await d.from("bookings").update({ advance_status: "rejected", slot_id: null, review_note: note }).eq("id", id);
      if (b.slot_id) await d.from("slots").update({ status: "open" }).eq("id", b.slot_id);
    }
  } else if (kind === "balance" && b.balance_status === "pending") {
    await d.from("bookings").update({ balance_status: approve ? "approved" : "rejected", review_note: approve ? null : note }).eq("id", id);
    if (approve) await notifyPhotosReady(id); // only emails if the photographer has already uploaded files
  } else return back("/admin", "That payment was already reviewed.");

  await d.from("audit_log").insert({ actor_id: admin.id, action: `${kind}_${approve ? "approved" : "rejected"}`, booking_id: id, detail: { note } });
  revalidatePath("/admin");
  back("/admin", `${b.ref}: ${kind} ${approve ? "approved" : "rejected"}.`);
}

export async function saveEvent(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id") || "");
  const row = {
    slug: String(fd.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    university: String(fd.get("university")).trim(), name: String(fd.get("name")).trim(),
    venue: String(fd.get("venue") || "").trim() || null,
    event_dates: String(fd.get("dates") || "").split(/[\s,]+/).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
    advance_lkr: Math.round(Number(fd.get("advance") || 0)), slot_minutes: Math.round(Number(fd.get("slot_minutes") || 45)),
    payment_instructions: String(fd.get("payment") || "").trim() || null,
    ceremony_note: String(fd.get("ceremony") || "").trim() || null,
    status: isStatus(String(fd.get("status"))) ? String(fd.get("status")) : "draft",
    reveal_name_on: isoDate(fd.get("reveal_name_on")),
    reveal_phone_on: isoDate(fd.get("reveal_phone_on")),
  };
  if (!row.slug || !row.university || !row.name) return back("/admin/events", "Slug, university and name are required.");
  // Reject typos instead of silently dropping them (e.g. "2026-11-3" or "14/11/2026").
  const typed = String(fd.get("dates") || "").split(/[\s,]+/).filter(Boolean);
  const bad = typed.filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(Date.parse(s)));
  if (bad.length) return back("/admin/events", `Check the dates: ${bad.join(", ")}. Use YYYY-MM-DD, e.g. 2026-11-14.`);
  row.event_dates = [...new Set(row.event_dates)].sort();
  if (!(row.advance_lkr >= 0)) return back("/admin/events", "The advance must be 0 or more.");
  if (!(row.slot_minutes >= 10 && row.slot_minutes <= 240)) return back("/admin/events", "Slot length must be between 10 and 240 minutes.");

  const d = db();
  const { data: before } = id ? await d.from("events").select("advance_lkr, slot_minutes, slug").eq("id", id).maybeSingle() : { data: null };
  if (id && !before) return back("/admin/events", "Event not found.");
  const { error } = id ? await d.from("events").update(row).eq("id", id) : await d.from("events").insert(row);
  if (error) return back("/admin/events", error.code === "23505" ? "That web address (slug) is already used by another event." : "Could not save the event.");
  revalidatePath("/admin/events"); revalidatePath("/graduation", "layout");

  if (!before) return back("/admin/events", `${row.name} created.`);
  // Say what the change means for bookings and slots that already exist.
  const notes: string[] = [];
  if (before.advance_lkr !== row.advance_lkr) notes.push(`New bookings will pay LKR ${row.advance_lkr.toLocaleString("en-US")} advance; existing bookings keep the amount they agreed to.`);
  if (before.slot_minutes !== row.slot_minutes) notes.push(`New slots will be ${row.slot_minutes} minutes; slots already created keep their times.`);
  if (before.slug !== row.slug) notes.push(`The event page moved to /graduation/${row.slug}; old shared links will stop working.`);
  await d.from("audit_log").insert({ actor_id: admin.id, action: "event_edited", detail: { event_id: id, before, after: { advance_lkr: row.advance_lkr, slot_minutes: row.slot_minutes, slug: row.slug } } });
  back("/admin/events", [`${row.name} updated.`, ...notes].join(" "));
}

export async function setEventPhotographers(fd: FormData) {
  await requireRole("admin");
  const eventId = String(fd.get("event")), ids = fd.getAll("photographer").map(String);
  const d = db();
  await d.from("event_photographers").delete().eq("event_id", eventId);
  if (ids.length) await d.from("event_photographers").insert(ids.map((photographer_id) => ({ event_id: eventId, photographer_id })));
  revalidatePath("/admin/events"); revalidatePath("/graduation");
  back("/admin/events", "Photographers updated.");
}

/** Adds an email to the photographer whitelist. Returns an error message, or null on success. */
async function addPhotographer(row: { email: string; name: string; alias?: string | null; style: string | null; bio: string | null; phone: string | null }) {
  const email = row.email.trim().toLowerCase(), name = row.name.trim();
  if (!email || !name) return "Name and email are required.";
  const d = db();
  const { data: adm } = await d.from("admin_emails").select("email");
  if (envAdminEmails().includes(email) || (adm ?? []).some((a) => a.email.toLowerCase() === email))
    return "That email has admin access. Photographers need their own email.";
  const { data, error } = await d.from("photographers").insert({
    email, display_name: name, alias: row.alias || null, style: row.style, bio: row.bio, contact_phone: row.phone,
  }).select("id").single();
  if (error || !data) return error?.message.includes("alias") ? "That stage name is already used." : "Could not add. Is that email already used?";
  // If this person already has an account, link it now. Their role switches to photographer on their next page load.
  const { data: prof } = await d.from("profiles").select("id").eq("email", email).maybeSingle();
  if (prof) await d.from("photographers").update({ user_id: prof.id }).eq("id", data.id);
  revalidatePath("/admin/photographers");
  return null;
}

const opt = (fd: FormData, k: string) => String(fd.get(k) || "").trim() || null;

export async function createPhotographer(fd: FormData) {
  await requireRole("admin");
  const email = String(fd.get("email") || "").trim().toLowerCase(), name = String(fd.get("name") || "").trim();
  const err = await addPhotographer({ email, name, alias: opt(fd, "alias"), style: opt(fd, "style"), bio: opt(fd, "bio"), phone: opt(fd, "phone") });
  if (err) return back("/admin/photographers", err);
  back("/admin/photographers", `${name} added. Ask them to create an account at /login?mode=signup with ${email} (or sign in if they already have one).`);
}

export async function reviewApplication(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id")), approve = String(fd.get("decision")) === "approve";
  const d = db();
  const { data: a } = await d.from("photographer_applications").select("*").eq("id", id).eq("status", "pending").maybeSingle();
  if (!a) return back("/admin/photographers", "That application was already reviewed.");
  if (approve) {
    const err = await addPhotographer({ email: a.email, name: a.name, style: a.specialties, bio: a.experience, phone: a.phone });
    if (err) return back("/admin/photographers", err);
  }
  await d.from("photographer_applications").update({ status: approve ? "approved" : "declined", reviewed_at: new Date().toISOString(), reviewed_by: admin.id }).eq("id", id);
  revalidatePath("/admin/photographers");
  back("/admin/photographers", approve
    ? `${a.name} approved. Email them at ${a.email} and ask them to create an account at /login?mode=signup with that email.`
    : `${a.name}'s application was declined.`);
}

export async function addAdminEmail(fd: FormData) {
  await requireRole("admin");
  const email = String(fd.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back("/admin/team", "Enter a valid email.");
  const d = db();
  const { data: ph } = await d.from("photographers").select("id").eq("email", email).maybeSingle();
  if (ph) return back("/admin/team", "That email is a photographer. Use a different email for admin access.");
  const { error } = await d.from("admin_emails").insert({ email });
  if (error) return back("/admin/team", error.code === "23505" ? "That email is already an admin." : "Could not add the admin.");
  revalidatePath("/admin/team");
  back("/admin/team", `${email} now has admin access. They sign in (or create an account) at /login with that email.`);
}

export async function removeAdminEmail(fd: FormData) {
  const me = await requireRole("admin");
  const email = String(fd.get("email") || "");
  if (email.toLowerCase() === me.email.toLowerCase()) return back("/admin/team", "You cannot remove your own admin access.");
  await db().from("admin_emails").delete().eq("email", email);
  revalidatePath("/admin/team");
  back("/admin/team", `${email} no longer has admin access.`);
}

export async function togglePhotographer(fd: FormData) {
  await requireRole("admin");
  await db().from("photographers").update({ active: String(fd.get("active")) === "true" }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/photographers"); revalidatePath("/graduation");
  back("/admin/photographers", "Updated.");
}

/** Stage name clients see until the reveal date. */
export async function setPhotographerAlias(fd: FormData) {
  await requireRole("admin");
  const alias = String(fd.get("alias") || "").trim().slice(0, 60) || null;
  const { error } = await db().from("photographers").update({ alias }).eq("id", String(fd.get("id")));
  if (error) return back("/admin/photographers", error.code === "23505" ? "That stage name is already used." : "Could not save the stage name.");
  revalidatePath("/admin/photographers"); revalidatePath("/graduation");
  back("/admin/photographers", "Stage name saved.");
}

/** Per-booking reveal dates. Empty fields fall back to the event's dates. */
export async function setBookingReveal(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id"));
  const row = { reveal_name_on: isoDate(fd.get("reveal_name_on")), reveal_phone_on: isoDate(fd.get("reveal_phone_on")) };
  const { data } = await db().from("bookings").update(row).eq("id", id).select("ref").maybeSingle();
  if (!data) return back("/admin", "Booking not found.");
  await db().from("audit_log").insert({ actor_id: admin.id, action: "reveal_dates_set", booking_id: id, detail: row });
  revalidatePath("/admin");
  back("/admin", `${data.ref}: reveal dates saved.`);
}

/** Sends the "photos ready" email again, e.g. if the client says they never got it. */
export async function resendPhotosEmail(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id"));
  const d = db();
  const { data: cur } = await d.from("bookings").select("ref, package_price, advance_lkr, advance_status, balance_status").eq("id", id).maybeSingle();
  if (!cur || !fullyPaid(cur)) return back("/admin", "Photos can only be emailed once the booking is paid in full.");
  const b = cur;
  await d.from("bookings").update({ photos_ready_emailed_at: null }).eq("id", id);
  await notifyPhotosReady(id);
  const { data: after } = await d.from("bookings").select("photos_ready_emailed_at").eq("id", id).single();
  await d.from("audit_log").insert({ actor_id: admin.id, action: "photos_email_resent", booking_id: id, detail: { sent: !!after?.photos_ready_emailed_at } });
  revalidatePath("/admin");
  back("/admin", after?.photos_ready_emailed_at ? `${b.ref}: email sent to the client.` : `${b.ref}: email not sent. Check that files are uploaded and that email is set up (RESEND_API_KEY).`);
}

/** Quick controls: open, pause or close bookings and change the notice shown to students, without the full form. */
export async function setEventStatus(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id")), status = String(fd.get("status") || "");
  const row: { ceremony_note: string | null; status?: string } = { ceremony_note: String(fd.get("notice") || "").trim().slice(0, 300) || null };
  if (status) {
    if (!isStatus(status)) return back("/admin/events", "Unknown status.");
    row.status = status;
  }
  const { data } = await db().from("events").update(row).eq("id", id).select("name, status").maybeSingle();
  if (!data) return back("/admin/events", "Event not found.");
  await db().from("audit_log").insert({ actor_id: admin.id, action: "event_status_set", detail: { event_id: id, ...row } });
  revalidatePath("/admin/events"); revalidatePath("/graduation", "layout");
  back("/admin/events", status ? `${data.name}: ${STATUS[data.status as keyof typeof STATUS].label}.` : `${data.name}: notice updated.`);
}

/** Corrects a booking's package price and advance. The balance is always recalculated as package − advance. */
export async function adjustBookingAmounts(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id"));
  const price = Number(fd.get("price")), advance = Number(fd.get("advance"));
  if (!(price >= 0) || !(advance >= 0)) return back("/admin", "Enter amounts of 0 or more.");
  if (advance > price) return back("/admin", "The advance cannot be more than the package price.");
  const d = db();
  const { data: b } = await d.from("bookings").select("ref, package_price, advance_lkr, balance_lkr, advance_status, balance_status, shoot_done").eq("id", id).maybeSingle();
  if (!b) return back("/admin", "Booking not found.");
  if (b.balance_status === "approved") return back("/admin", `${b.ref}: marked as paid in full, so the amounts are locked.`);
  const pay = splitPayment(price, advance);
  const row: Record<string, unknown> = { package_price: pay.total, advance_lkr: pay.advance, balance_lkr: pay.balance };
  await d.from("bookings").update(row).eq("id", id);
  await d.from("audit_log").insert({ actor_id: admin.id, action: "amounts_adjusted", booking_id: id, detail: { before: { price: b.package_price, advance: b.advance_lkr, balance: b.balance_lkr }, after: pay } });
  await notifyPhotosReady(id); // emails only if this change made the booking paid in full and files exist
  revalidatePath("/admin");
  back("/admin", `${b.ref}: package ${lkr(pay.total)} − advance ${lkr(pay.advance)} = balance ${lkr(pay.balance)}.`);
}

/** For when the client paid the rest outside the site (cash, direct transfer) or nothing is left to pay.
 *  Shows the client their album link and sends the photos-ready email if the photographer has added it. */
export async function markFullyPaid(fd: FormData) {
  const admin = await requireRole("admin");
  const id = String(fd.get("id"));
  const d = db();
  const { data } = await d.from("bookings").update({ balance_status: "approved", review_note: null })
    .eq("id", id).eq("advance_status", "approved").neq("balance_status", "approved").select("ref").maybeSingle();
  if (!data) return back("/admin", "Only bookings with an approved advance that are not already paid can be marked as paid in full.");
  await d.from("audit_log").insert({ actor_id: admin.id, action: "marked_fully_paid", booking_id: id, detail: { note: String(fd.get("note") || "").trim() || null } });
  await notifyPhotosReady(id);
  revalidatePath("/admin");
  back("/admin", `${data.ref}: marked as paid in full. The client can now open their album link once the photographer adds it.`);
}
