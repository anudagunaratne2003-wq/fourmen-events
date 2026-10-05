import "server-only";
import { db } from "@/lib/supabase/admin";
import { firstName, fullyPaid, fmtDate, fmtTime, lkr } from "@/lib/format";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Sends one email through Resend (resend.com). Returns false if email is not configured or sending failed. */
export async function sendEmail(to: string, subject: string, html: string, text: string) {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn(`[email] RESEND_API_KEY or EMAIL_FROM is not set. Skipped: "${subject}" to ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: process.env.EMAIL_REPLY_TO || undefined }),
    });
    if (!res.ok) console.error(`[email] Resend returned ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (err) {
    console.error("[email] Could not reach Resend", err);
    return false;
  }
}

/** Emails the client once their album can be opened: paid in full AND the photographer has added the album link.
 *  Safe to call any number of times; only the first call that finds both conditions true sends the email.
 *  The email links to the booking page (sign-in required), not to the album itself. */
export async function notifyPhotosReady(bookingId: string) {
  const d = db();
  const { data: b } = await d.from("bookings").select("id, ref, client_name, client_email, package_price, advance_lkr, advance_status, balance_status, album_url, photos_ready_emailed_at, events(name)").eq("id", bookingId).maybeSingle();
  if (!b || !fullyPaid(b) || !b.album_url || b.photos_ready_emailed_at) return;

  // Claim the send first so two triggers at the same moment cannot both email the client.
  const { data: claimed } = await d.from("bookings").update({ photos_ready_emailed_at: new Date().toISOString() })
    .eq("id", bookingId).is("photos_ready_emailed_at", null).select("id");
  if (!claimed?.length) return;

  const link = `${siteUrl()}/account/bookings/${b.id}`;
  const name = esc(firstName(b.client_name) || "there");
  const event = (b.events as unknown as { name: string } | null)?.name;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1c120c;line-height:1.6">
  <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#9b5b2b">Fourmen Events · ${esc(b.ref)}</p>
  <h1 style="font-weight:300;letter-spacing:.08em;text-transform:uppercase;font-size:22px">Your photos are ready</h1>
  <p>Hi ${name},</p>
  <p>Thank you for your payment. Your edited photo album${event ? ` from <b>${esc(event)}</b>` : ""} is ready.</p>
  <p style="margin:28px 0"><a href="${link}" style="background:#000;color:#fff;text-decoration:none;padding:14px 24px;font-size:12px;letter-spacing:.2em;text-transform:uppercase">Open your album</a></p>
  <p style="font-size:13px;color:#6b5a4d">Sign in with this email address and open your booking to find the album link. Please download and save your photos soon, as the album will not be kept online forever.</p>
  <p style="font-size:13px;color:#6b5a4d">Booking reference: ${esc(b.ref)}</p>
</div>`;
  const text = `Hi ${firstName(b.client_name) || "there"},\n\nYour edited photo album${event ? ` from ${event}` : ""} is ready.\nOpen your booking to get the album link: ${link}\n\nSign in with this email address. Please download and save your photos soon. Booking reference: ${b.ref}\n\nFourmen Events`;

  const ok = await sendEmail(b.client_email, `Your photos are ready (${b.ref})`, html, text);
  // Not sent? Release the claim so the next trigger (payment approval, link saved, admin "Send now") tries again.
  if (!ok) await d.from("bookings").update({ photos_ready_emailed_at: null }).eq("id", bookingId);
}

/** Tells the photographer a client's advance was approved, so the time slot is confirmed and paid.
 *  Called once, when an admin approves the advance. Returns whether the email went out. */
export async function notifyPhotographerBooked(bookingId: string) {
  const d = db();
  const { data: b } = await d.from("bookings")
    .select("id, ref, client_name, degree, notes, package_name, package_price, advance_lkr, events(id, name, university, venue), slots(slot_date, start_time, end_time), photographers(email, display_name)")
    .eq("id", bookingId).maybeSingle();
  const ph = b?.photographers as unknown as { email: string; display_name: string } | null;
  if (!b || !ph?.email) return false;
  const ev = b.events as unknown as { id: string; name: string; university: string; venue: string | null } | null;
  const slot = b.slots as unknown as { slot_date: string; start_time: string; end_time: string } | null;

  const when = slot ? `${fmtDate(slot.slot_date)}, ${fmtTime(slot.start_time)} – ${fmtTime(slot.end_time)}` : "Time to be confirmed";
  const client = firstName(b.client_name) || "A client"; // photographers only ever see the client's first name
  const link = `${siteUrl()}/photographer${ev ? `?event=${ev.id}` : ""}#bookings`;
  const rows: [string, string][] = [
    ["University", ev?.university ?? ""],
    ["Event", ev?.name ?? ""],
    ["Date and time", when],
    ["Venue", ev?.venue ?? ""],
    ["Client", client],
    ["Degree", b.degree ?? ""],
    ["Package", `${b.package_name} (${lkr(b.package_price)})`],
    ["Notes from client", b.notes ?? ""],
    ["Booking reference", b.ref],
  ];
  const shown = rows.filter(([, v]) => v);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1c120c;line-height:1.6">
  <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#9b5b2b">Fourmen Events · ${esc(b.ref)}</p>
  <h1 style="font-weight:300;letter-spacing:.08em;text-transform:uppercase;font-size:22px">New confirmed booking</h1>
  <p>Hi ${esc(firstName(ph.display_name) || "there")},</p>
  <p>${esc(client)} has paid the advance and their time with you is confirmed.</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:16px 0">
    ${shown.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6b5a4d;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;vertical-align:top">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("\n    ")}
  </table>
  <p style="margin:28px 0"><a href="${link}" style="background:#000;color:#fff;text-decoration:none;padding:14px 24px;font-size:12px;letter-spacing:.2em;text-transform:uppercase">Open your dashboard</a></p>
  <p style="font-size:13px;color:#6b5a4d">Fourmen Events coordinates with the client for you. After the shoot, mark it as done in your dashboard and add the album link.</p>
</div>`;
  const text = `Hi ${firstName(ph.display_name) || "there"},\n\n${client} has paid the advance and their time with you is confirmed.\n\n${shown.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nYour dashboard: ${link}\n\nFourmen Events`;

  return sendEmail(ph.email, `Confirmed booking: ${when} (${b.ref})`, html, text);
}
