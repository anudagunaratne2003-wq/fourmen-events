import "server-only";
import { db } from "@/lib/supabase/admin";
import { firstName, fullyPaid } from "@/lib/format";

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
