import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtTime, lkr, balanceOf, fullyPaid } from "@/lib/format";
import { publicName, revealFor } from "@/lib/reveal";
import { waLink } from "@/lib/services";
import { BalanceUploader } from "@/components/ActionUploaders";
import CopyButton from "@/components/CopyButton";
import Stars from "@/components/Stars";
import StarInput from "@/components/StarInput";
import SubmitButton from "@/components/SubmitButton";
import { submitReview } from "@/lib/actions/reviews";
import { btnSmallDark, h2, input as inputCls } from "@/lib/ui";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: fresh } = await searchParams;
  const user = await requireUser(`/account/bookings/${id}`);
  const d = db();
  const { data: b } = await d.from("bookings")
    .select("*, events(name, university, venue, payment_instructions, reveal_name_on, reveal_phone_on), slots(slot_date, start_time), photographers(id, alias, display_name, contact_phone)")
    .eq("id", id).eq("client_id", user.id).maybeSingle();
  if (!b) notFound();
  const balance = balanceOf(b), paid = fullyPaid(b);
  // The album link is only read out when the client has paid in full, so it never reaches the browser earlier.
  const album = paid && b.album_url ? { url: b.album_url as string, note: b.album_note as string | null } : null;
  // Reviews open once the photos are delivered and the booking is paid in full.
  const { data: review } = album ? await d.from("reviews").select("rating, comment, updated_at").eq("booking_id", b.id).maybeSingle() : { data: null };

  const adv = b.advance_status, bal = b.balance_status;
  // Real name and phone are rendered on the server only once revealed, so they never reach the browser early.
  const reveal = revealFor(b, b.events);
  const ph = b.photographers;
  const photographer = ph ? (reveal.name ? ph.display_name : publicName(ph)) : "your photographer";
  const phone = reveal.phone ? (ph?.contact_phone as string | null) : null;
  const Step = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className={`flex gap-3 py-2 text-sm ${ok ? "text-black" : "text-black/45"}`}>
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${ok ? "border-[#9b5b2b] bg-[#9b5b2b] text-white" : "border-black/20"}`}>{ok ? "✓" : ""}</span>
      <span>{children}</span>
    </li>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <Link href="/account" className="text-xs uppercase tracking-[0.2em] text-black/50 hover:text-[#9b5b2b]">← My bookings</Link>
      {fresh && <p className="mt-6 border-l-4 border-[#9b5b2b] bg-[#f3eee7] px-4 py-3 text-sm">Booking sent. We are checking your advance payment and will confirm it here.</p>}
      <p className="mt-8 text-base font-semibold uppercase tracking-[0.12em] md:text-lg">{b.events?.university}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">{b.events?.name} · {b.ref}</p>
      <h1 className={`${h2} mt-2`}>{b.package_name}</h1>
      <p className="mt-2 text-sm text-black/60">
        {b.slots ? `${fmtDate(b.slots.slot_date)}, ${fmtTime(b.slots.start_time)}` : "Time released"}{b.events?.venue ? ` · ${b.events.venue}` : ""}
      </p>
      <dl className="mt-5 max-w-sm space-y-1 border border-[#dbcfc1] bg-[#f8f4ef] p-4 text-sm">
        <div className="flex justify-between"><dt>Package total</dt><dd>{lkr(b.package_price)}</dd></div>
        <div className="flex justify-between text-black/60"><dt>Advance {adv === "approved" ? "paid" : adv === "rejected" ? "(not accepted)" : "(being checked)"}</dt><dd>− {lkr(b.advance_lkr)}</dd></div>
        <div className="flex justify-between border-t border-black/10 pt-1 font-medium"><dt>{paid ? "Balance paid" : "Remaining balance"}</dt><dd>{lkr(paid ? 0 : balance)}</dd></div>
      </dl>

      <ul className="mt-8 border-y border-black/10 py-3">
        <Step ok={adv === "approved"}>
          {adv === "approved" ? "Advance payment confirmed" : adv === "rejected" ? "Advance payment was not accepted. The time was released." : "Advance payment is being checked by our team"}
        </Step>
        <Step ok={b.shoot_done}>Shoot completed</Step>
        <Step ok={paid}>
          {paid ? (balance === 0 ? "Paid in full. Nothing more to pay." : "Balance paid") : bal === "pending" ? "Balance payment is being checked" : `Balance of ${lkr(balance)} to pay, before or after your shoot`}
        </Step>
        <Step ok={!!album}>Edited photo album ready</Step>
      </ul>

      {adv === "rejected" && b.review_note && <p className="mt-6 border-l-4 border-red-700 bg-red-50 px-4 py-3 text-sm">Reason: {b.review_note}</p>}

      {adv === "approved" && (
        <div className="mt-8 border border-[#dbcfc1] bg-[#f8f4ef] p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">Your photographer</p>
          <p className="mt-2 text-xl font-light uppercase tracking-[0.1em]">{photographer}</p>
          {phone && <p className="mt-2 text-sm">Phone: <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-medium text-[#9b5b2b] underline">{phone}</a></p>}
          {(!reveal.name || !reveal.phone) && (
            <p className="mt-2 text-xs text-black/50">
              {!reveal.name ? (reveal.nameOn ? `Your photographer's real name will appear here on ${fmtDate(reveal.nameOn)}.` : "Your photographer's real name will appear here closer to your shoot.") + " " : ""}
              {reveal.phoneOn ? `Their phone number will appear on ${fmtDate(reveal.phoneOn)}.` : "Their phone number will be shared closer to your shoot."}
            </p>
          )}
          <p className="mt-3 text-sm leading-7 text-black/65">
            To arrange the session, message Fourmen Events with your reference <b>{b.ref}</b> and we will coordinate with {photographer} for you.
          </p>
          <a href={waLink(`Hi Fourmen Events, my booking is ${b.ref}.`)} className="mt-4 inline-block bg-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white hover:bg-[#9b5b2b]">Message on WhatsApp</a>
        </div>
      )}

      {adv === "approved" && !paid && (bal === "none" || bal === "rejected") && (
        <div className="mt-8 bg-[#1c120c] p-6 text-white">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#e2b27c]">Pay your balance</p>
          <p className="mt-2 text-3xl font-light tracking-[0.06em] text-[#f0c58f]">{lkr(balance)}</p>
          <p className="mt-1 text-sm text-white/55">Package {lkr(b.package_price)} − advance paid {lkr(b.advance_lkr)}</p>
          <p className="mt-3 text-sm leading-7 text-white/65">
            {b.shoot_done ? "Your shoot is done." : "You can pay now or after your shoot, whichever your photographer agreed with you."}{" "}
            Transfer the balance to the account below, then upload the receipt. Your photo album unlocks once the full amount is confirmed.
          </p>
          {b.events?.payment_instructions ? (
            <div className="mt-5 border border-white/15 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#e2b27c]">Bank details</p>
                <CopyButton text={b.events.payment_instructions} label="Copy details" className="text-[#f0c58f] hover:text-white" />
              </div>
              <p className="mt-2 select-all whitespace-pre-line text-sm leading-7 text-white">{b.events.payment_instructions}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/65">
                <span>Use <b className="text-white">{b.ref}</b> as the payment reference.</span>
                <CopyButton text={b.ref} label="Copy reference" className="text-[#f0c58f] hover:text-white" />
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/65">For bank details, message Fourmen Events on WhatsApp with your reference <b className="text-white">{b.ref}</b>.</p>
          )}
          {bal === "rejected" && <p className="mt-3 text-sm text-[#f0c58f]">Your last receipt was not accepted{b.review_note ? `: ${b.review_note}` : ""}. Please upload a clear one.</p>}
          <div className="mt-5 text-black"><BalanceUploader bookingId={b.id} /></div>
        </div>
      )}

      {paid && (
        <section className="mt-10">
          <h2 className="mb-5 text-xl font-light uppercase tracking-[0.16em]">Your photo album</h2>
          {album ? (
            <div className="border border-[#dbcfc1] bg-[#f8f4ef] p-6">
              <a href={album.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-black px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-white hover:bg-[#9b5b2b]">Open your album ↗</a>
              {album.note && <p className="mt-4 whitespace-pre-line text-sm text-black/70"><b className="font-medium">From your photographer:</b> {album.note}</p>}
              <p className="mt-4 text-xs leading-6 text-black/50">The album opens on the photographer&apos;s cloud storage. Please download and save your photos soon, as the album will not stay online forever. This link is private to you, so please do not share it.</p>
            </div>
          ) : (
            <p className="text-sm text-black/55">Your photographer is still editing your photos. We will email you as soon as your album is ready.</p>
          )}
        </section>
      )}

      {album && (
        <section className="mt-10" id="review">
          <h2 className="mb-2 text-xl font-light uppercase tracking-[0.16em]">Rate your photographer</h2>
          <p className="mb-5 text-sm text-black/55">How was your experience with {photographer}? Your rating and comment are shown on their profile with your first name.</p>
          {review && (
            <div className="mb-5 border border-[#dbcfc1] bg-[#f8f4ef] p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">Your review</p>
              <div className="mt-2"><Stars value={review.rating} showNumber={false} size="text-xl" /></div>
              {review.comment && <p className="mt-2 whitespace-pre-line text-sm text-black/70">{review.comment}</p>}
            </div>
          )}
          <details open={!review} className="border border-black/10 bg-white p-5">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-black/60">{review ? "Edit your review" : "Write a review"}</summary>
            <form action={submitReview} className="mt-4 grid gap-4">
              <input type="hidden" name="booking_id" value={b.id} />
              <StarInput defaultValue={review?.rating ?? 0} />
              <div>
                <label className="mb-1 block text-xs text-black/55" htmlFor="review-comment">Your feedback (optional)</label>
                <textarea id="review-comment" name="comment" rows={4} maxLength={1000} defaultValue={review?.comment ?? ""} className={inputCls}
                  placeholder="What did you like? Was the photographer on time, friendly, and happy with the edits?" />
              </div>
              <div><SubmitButton className={btnSmallDark} pendingText="Sending…">{review ? "Update review" : "Submit review"}</SubmitButton></div>
            </form>
          </details>
        </section>
      )}
    </main>
  );
}
