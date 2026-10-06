import "server-only";
import { db } from "@/lib/supabase/admin";
import { firstName, fullyPaid, fmtDate, fmtTime, lkr } from "@/lib/format";
import { envAdminEmails } from "@/lib/auth";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Reads a setting, ignoring spaces and wrapping quotes pasted in from a .env file
 *  (e.g. EMAIL_FROM="Fourmen Events <hello@…>" copied into Vercel with the quotes). */
const setting = (v: string | undefined) => (v ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();

let lastError = "";
/** Why the most recent send failed, in plain words, so admins can see it instead of digging in logs. */
export const lastEmailError = () => lastError;

/** Sends one email through Resend (resend.com). Returns false if email is not configured or sending failed. */
export async function sendEmail(to: string, subject: string, html: string, text: string) {
  const key = setting(process.env.RESEND_API_KEY), from = setting(process.env.EMAIL_FROM), replyTo = setting(process.env.EMAIL_REPLY_TO);
  lastError = "";
  if (!key || !from) {
    lastError = "RESEND_API_KEY or EMAIL_FROM is not set";
    console.warn(`[email] ${lastError}. Skipped: "${subject}" to ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: replyTo || undefined }),
    });
    if (!res.ok) {
      const body = await res.text();
      let msg = body;
      try { msg = JSON.parse(body).message ?? body; } catch { /* not JSON */ }
      lastError = `Resend ${res.status}: ${String(msg).slice(0, 200)}`;
      console.error(`[email] ${lastError}`);
    }
    return res.ok;
  } catch (err) {
    lastError = "could not reach Resend";
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

/** Shared look for the simpler emails below. */
function emailLayout(ref: string, heading: string, body: string, button?: { href: string; label: string }) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1c120c;line-height:1.6">
  <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#9b5b2b">Fourmen Events${ref ? ` · ${esc(ref)}` : ""}</p>
  <h1 style="font-weight:300;letter-spacing:.08em;text-transform:uppercase;font-size:22px">${esc(heading)}</h1>
  ${body}
  ${button ? `<p style="margin:28px 0"><a href="${button.href}" style="background:#000;color:#fff;text-decoration:none;padding:14px 24px;font-size:12px;letter-spacing:.2em;text-transform:uppercase">${esc(button.label)}</a></p>` : ""}
</div>`;
}

/** Everyone with admin access: the ADMIN_EMAILS setting plus the admin team list. */
async function adminRecipients() {
  const { data } = await db().from("admin_emails").select("email");
  return [...new Set([...envAdminEmails(), ...(data ?? []).map((r) => String(r.email).trim().toLowerCase())])].filter(Boolean);
}

type Application = {
  name: string; email: string; phone: string; city: string | null; portfolio_url: string | null;
  instagram: string | null; experience: string | null; specialties: string | null; message: string | null;
};

/** New "Work with us" application: tell every admin, and confirm receipt to the applicant. */
export async function notifyNewApplication(a: Application) {
  const review = `${siteUrl()}/admin/photographers`;
  const rows: [string, string][] = [
    ["Name", a.name], ["Email", a.email], ["Phone", a.phone], ["City", a.city ?? ""],
    ["Experience", a.experience ?? ""], ["Shoots", a.specialties ?? ""], ["Instagram", a.instagram ?? ""],
  ];
  const portfolio = a.portfolio_url && /^https?:\/\//i.test(a.portfolio_url)
    ? `<p><a href="${esc(a.portfolio_url)}" style="color:#9b5b2b">View portfolio</a></p>` : "";
  const table = `<table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0">${rows.filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:5px 12px 5px 0;color:#6b5a4d;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:5px 0;vertical-align:top">${esc(v)}</td></tr>`).join("")}</table>`;
  const message = a.message ? `<p style="white-space:pre-line;border-left:3px solid #dbcfc1;padding-left:12px;color:#3d2c20">${esc(a.message)}</p>` : "";
  const text = `New photographer application\n\n${rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n")}${a.portfolio_url ? `\nPortfolio: ${a.portfolio_url}` : ""}${a.message ? `\n\n${a.message}` : ""}\n\nReview it: ${review}`;

  const admins = await adminRecipients();
  await Promise.all([
    ...admins.map((to) => sendEmail(to, `New photographer application: ${a.name}`,
      emailLayout("", "New photographer application", `<p>${esc(a.name)} would like to work with Fourmen Events.</p>${table}${portfolio}${message}`, { href: review, label: "Review application" }), text)),
    sendEmail(a.email, "We received your application",
      emailLayout("", "Application received", `<p>Hi ${esc(firstName(a.name) || "there")},</p><p>Thank you for applying to shoot with Fourmen Events. Our team will look through your work and get back to you by email.</p>`),
      `Hi ${firstName(a.name) || "there"},\n\nThank you for applying to shoot with Fourmen Events. Our team will look through your work and get back to you by email.\n\nFourmen Events`),
  ]);
}

/** Tells the applicant the outcome. Approved applicants are told how to create their account. */
export async function notifyApplicationDecision(a: { name: string; email: string }, approved: boolean) {
  const hi = `Hi ${firstName(a.name) || "there"},`;
  if (approved) {
    const signup = `${siteUrl()}/login?mode=signup`;
    return sendEmail(a.email, "Welcome to Fourmen Events",
      emailLayout("", "You're approved", `<p>${esc(hi)}</p><p>Great news: your application to shoot with Fourmen Events has been approved.</p>
  <p>Create your account using <b>this email address (${esc(a.email)})</b>. You will then have your own dashboard to add your packages, portfolio photos and available times.</p>`,
        { href: signup, label: "Create your account" }),
      `${hi}\n\nYour application to shoot with Fourmen Events has been approved.\nCreate your account with this email address (${a.email}) here: ${signup}\nYou will then have your own dashboard to add your packages, portfolio photos and available times.\n\nFourmen Events`);
  }
  return sendEmail(a.email, "Your Fourmen Events application",
    emailLayout("", "Thank you for applying", `<p>${esc(hi)}</p><p>Thank you for your interest in working with Fourmen Events. We are not able to take your application forward at the moment, but we appreciate you sharing your work and wish you all the best.</p>`),
    `${hi}\n\nThank you for your interest in working with Fourmen Events. We are not able to take your application forward at the moment, but we appreciate you sharing your work and wish you all the best.\n\nFourmen Events`);
}

/** Tells the photographer the client has paid in full (balance approved or marked as paid by an admin),
 *  and reminds them to add the album link if it is still missing. Returns whether the email went out. */
export async function notifyPhotographerPaidInFull(bookingId: string) {
  const d = db();
  const { data: b } = await d.from("bookings")
    .select("id, ref, client_name, package_name, package_price, advance_lkr, album_url, shoot_done, events(id, name, university), slots(slot_date, start_time), photographers(email, display_name)")
    .eq("id", bookingId).maybeSingle();
  const ph = b?.photographers as unknown as { email: string; display_name: string } | null;
  if (!b || !ph?.email) return false;
  const ev = b.events as unknown as { id: string; name: string; university: string } | null;
  const slot = b.slots as unknown as { slot_date: string; start_time: string } | null;
  const client = firstName(b.client_name) || "Your client"; // photographers only ever see the client's first name
  const balance = Math.max(b.package_price - b.advance_lkr, 0);
  const link = `${siteUrl()}/photographer${ev ? `?event=${ev.id}` : ""}#bookings`;
  const shoot = [ev?.university, ev?.name, slot ? `${fmtDate(slot.slot_date)}, ${fmtTime(slot.start_time)}` : ""].filter(Boolean).join(" · ");
  // The client may now pay in full before the shoot, so only ask for the album once the shoot is done.
  const next = b.album_url
    ? "Your album link is already saved, so the client can now open their photos."
    : b.shoot_done
      ? "Next step: add the share link to the edited album in your dashboard. The client sees it as soon as you save it."
      : "There is nothing more to collect from this client. After the shoot, add the share link to the edited album in your dashboard.";

  const html = emailLayout(b.ref, "Paid in full", `<p>Hi ${esc(firstName(ph.display_name) || "there")},</p>
  <p>${esc(client)} has paid the remaining balance${balance ? ` of <b>${esc(lkr(balance))}</b>` : ""}, so the ${esc(b.package_name)} package (${esc(lkr(b.package_price))}) is now <b>paid in full</b>.</p>
  ${shoot ? `<p style="color:#6b5a4d">${esc(shoot)}</p>` : ""}
  <p>${esc(next)}</p>
  <p style="font-size:13px;color:#6b5a4d">Booking reference: ${esc(b.ref)}</p>`, { href: link, label: !b.album_url && b.shoot_done ? "Add the album link" : "Open your dashboard" });
  const text = `Hi ${firstName(ph.display_name) || "there"},\n\n${client} has paid the remaining balance${balance ? ` of ${lkr(balance)}` : ""}, so the ${b.package_name} package (${lkr(b.package_price)}) is now paid in full.\n${shoot ? `${shoot}\n` : ""}\n${next}\n\nYour dashboard: ${link}\nBooking reference: ${b.ref}\n\nFourmen Events`;

  return sendEmail(ph.email, `Paid in full: ${b.ref}${!b.album_url && b.shoot_done ? " (please add the album link)" : ""}`, html, text);
}

/** A client uploaded a payment receipt: ask every admin to check it, since nothing moves on until they approve. */
export async function notifyAdminsPaymentToReview(bookingId: string, kind: "advance" | "balance") {
  const { data: b } = await db().from("bookings")
    .select("ref, client_name, client_phone, package_name, package_price, advance_lkr, events(name, university), slots(slot_date, start_time), photographers(display_name)")
    .eq("id", bookingId).maybeSingle();
  if (!b) return;
  const ev = b.events as unknown as { name: string; university: string } | null;
  const slot = b.slots as unknown as { slot_date: string; start_time: string } | null;
  const ph = b.photographers as unknown as { display_name: string } | null;
  const amount = kind === "advance" ? b.advance_lkr : Math.max(b.package_price - b.advance_lkr, 0);
  const what = kind === "advance" ? "advance payment (new booking)" : "remaining balance";
  const review = `${siteUrl()}/admin`;
  const rows: [string, string][] = [
    ["Payment", `${what}: ${lkr(amount)}`],
    ["Client", `${b.client_name} · ${b.client_phone}`],
    ["University", ev?.university ?? ""], ["Event", ev?.name ?? ""],
    ["Shoot", slot ? `${fmtDate(slot.slot_date)}, ${fmtTime(slot.start_time)}` : ""],
    ["Photographer", ph?.display_name ?? ""],
    ["Package", `${b.package_name} (${lkr(b.package_price)})`],
  ];
  const shown = rows.filter(([, v]) => v);
  const html = emailLayout(b.ref, kind === "advance" ? "New booking to verify" : "Balance payment to verify",
    `<p>A client has uploaded a receipt for the ${esc(what)}. Please check it and approve or reject it.</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0">${shown.map(([k, v]) => `<tr><td style="padding:5px 12px 5px 0;color:#6b5a4d;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:5px 0;vertical-align:top">${esc(v)}</td></tr>`).join("")}</table>
  <p style="font-size:13px;color:#6b5a4d">The receipt is shown in the admin panel. ${kind === "balance" ? "Once you approve it, the photographer is told the booking is paid in full." : "Once you approve it, the photographer is told about the confirmed booking."}</p>`,
    { href: review, label: "Review payment" });
  const text = `A client has uploaded a receipt for the ${what}. Please check it and approve or reject it.\n\n${shown.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReview it: ${review}\nBooking reference: ${b.ref}`;
  const subject = `${kind === "advance" ? "New booking" : "Balance payment"} to verify: ${b.ref} (${lkr(amount)})`;
  await Promise.all((await adminRecipients()).map((to) => sendEmail(to, subject, html, text)));
}
