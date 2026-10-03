import { db } from "@/lib/supabase/admin";
import { fmtDate, fmtTime, lkr, stageLabel, balanceOf, fullyPaid } from "@/lib/format";
import { isImage } from "@/lib/storage";
import Flash from "@/components/Flash";
import { reviewPayment, setBookingReveal, resendPhotosEmail, adjustBookingAmounts, markFullyPaid } from "@/lib/actions/admin";
import { revealFor, publicName } from "@/lib/reveal";
import { btnSmall, btnSmallDark, h2, input } from "@/lib/ui";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const d = db();
  const { data: all } = await d.from("bookings")
    .select("*, events(name, university, reveal_name_on, reveal_phone_on), slots(slot_date, start_time), photographers(id, display_name, alias)")
    .order("created_at", { ascending: false });
  const rows = all ?? [];

  type Item = { b: (typeof rows)[number]; kind: "advance" | "balance"; amount: number; path: string | null };
  const queue: Item[] = [];
  for (const b of rows) {
    if (b.advance_status === "pending") queue.push({ b, kind: "advance", amount: b.advance_lkr, path: b.advance_proof_path });
    if (b.balance_status === "pending") queue.push({ b, kind: "balance", amount: balanceOf(b), path: b.balance_proof_path });
  }
  const urls = await Promise.all(queue.map(async (q) => (q.path ? (await d.storage.from("proofs").createSignedUrl(q.path, 900)).data?.signedUrl ?? null : null)));
  const verified = rows.reduce((t, b) => t + (b.advance_status === "approved" ? b.advance_lkr : 0) + (b.balance_status === "approved" ? balanceOf(b) : 0), 0);

  return (
    <>
      <h1 className={h2}>Payments and bookings</h1>
      <div className="mt-6"><Flash msg={msg} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Bookings", rows.length], ["Payments to review", queue.length], ["Verified payments", lkr(verified)]].map(([t, v]) => (
          <div key={String(t)} className="border border-[#dbcfc1] bg-white p-5"><p className="text-xs uppercase tracking-[0.2em] text-black/50">{t}</p><p className="mt-2 text-2xl font-light tracking-[0.06em]">{v}</p></div>
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-xl font-light uppercase tracking-[0.16em]">Payment review</h2>
      {!queue.length ? <p className="border border-dashed border-black/20 bg-white p-6 text-sm text-black/55">Nothing waiting. New proofs from clients appear here.</p> : (
        <div className="space-y-4">
          {queue.map((q, i) => (
            <div key={q.b.id + q.kind} className="grid gap-5 border border-[#dbcfc1] bg-white p-5 md:grid-cols-[1fr_220px]">
              <div className="text-sm leading-7">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">{q.kind} payment · {q.b.ref}</p>
                <p className="text-xl font-light tracking-[0.06em]">{lkr(q.amount)}</p>
                <p>{q.b.client_name} · {q.b.client_phone} · {q.b.client_email}</p>
                <p className="text-black/60"><b className="font-semibold text-black/80">{q.b.events?.university}</b> · {q.b.events?.name} · {q.b.photographers?.display_name} · {q.b.package_name}</p>
                <p className="text-black/60">{q.b.slots ? `${fmtDate(q.b.slots.slot_date)}, ${fmtTime(q.b.slots.start_time)}` : ""}</p>
                <form action={reviewPayment} className="mt-4 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={q.b.id} /><input type="hidden" name="kind" value={q.kind} />
                  <input name="note" placeholder="Reason (shown to client if rejected)" className={`${input} max-w-xs py-2!`} />
                  <button name="decision" value="approve" className={btnSmallDark}>Approve</button>
                  <button name="decision" value="reject" className={btnSmall}>Reject</button>
                </form>
              </div>
              <div>
                {urls[i] ? (isImage(q.path) ? (
                  <a href={urls[i]!} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={urls[i]!} alt="Payment proof" className="max-h-64 w-full border border-black/10 object-contain" /></a>
                ) : <a href={urls[i]!} target="_blank" rel="noopener noreferrer" className={btnSmall}>Open proof file</a>) : <p className="text-sm text-black/45">No proof file.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-12 text-xl font-light uppercase tracking-[0.16em]">All bookings</h2>
      <div className="overflow-x-auto border border-[#dbcfc1] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.15em] text-black/45"><tr>{["Ref", "Client", "Event", "Photographer", "Package", "Status", "Reveal to client (blank = event date)"].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-black/10">
            {rows.map((b) => (
              <tr key={b.id}><td className="px-4 py-3">{b.ref}</td><td className="px-4 py-3">{b.client_name}<br /><span className="text-black/45">{b.client_phone}</span></td><td className="px-4 py-3"><b className="font-semibold">{b.events?.university}</b><br /><span className="text-black/45">{b.events?.name}</span></td><td className="px-4 py-3">{b.photographers?.display_name}<br /><span className="text-black/45">as {b.photographers ? publicName(b.photographers) : ""}</span></td><td className="px-4 py-3">{b.package_name}<AmountsCell b={b} /></td><td className="px-4 py-3">{stageLabel(b)}{b.advance_status === "approved" && !fullyPaid(b) && (
                <form action={markFullyPaid} className="mt-1"><input type="hidden" name="id" value={b.id} />
                  <span className="block text-xs text-black/45">{lkr(balanceOf(b))} still due</span>
                  <button className="text-xs text-[#9b5b2b] underline">Mark as paid in full</button></form>)}<span className="mt-1 block text-xs text-black/45">{b.album_url ? <>Album link added · <a href={b.album_url} target="_blank" rel="noopener noreferrer" className="text-[#9b5b2b] underline">open</a></> : "No album link yet"}</span>{fullyPaid(b) && (
                <form action={resendPhotosEmail} className="mt-1"><input type="hidden" name="id" value={b.id} />
                  <span className="block text-xs text-black/45">{b.photos_ready_emailed_at ? `Photos email sent ${fmtDate(b.photos_ready_emailed_at.slice(0, 10))}` : "Photos email not sent yet"}</span>
                  <button className="text-xs text-[#9b5b2b] underline">{b.photos_ready_emailed_at ? "Send again" : "Send now"}</button></form>)}</td><td className="px-4 py-3"><RevealCell b={b} /></td></tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-6 text-black/45">No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RevealCell({ b }: { b: { id: string; advance_status: string; reveal_name_on: string | null; reveal_phone_on: string | null; events: { reveal_name_on: string | null; reveal_phone_on: string | null } | null } }) {
  const r = revealFor(b, b.events);
  const state = (shown: boolean, on: string | null) => (shown ? "shown" : on ? `from ${fmtDate(on)}` : "not set");
  return (
    <form action={setBookingReveal} className="grid min-w-56 gap-1 text-xs">
      <input type="hidden" name="id" value={b.id} />
      <label className="flex items-center justify-between gap-2">Name<input type="date" name="reveal_name_on" defaultValue={b.reveal_name_on ?? ""} className="border border-black/10 px-2 py-1" /></label>
      <label className="flex items-center justify-between gap-2">Phone<input type="date" name="reveal_phone_on" defaultValue={b.reveal_phone_on ?? ""} className="border border-black/10 px-2 py-1" /></label>
      <span className="text-black/45">{b.advance_status !== "approved" ? "Hidden until advance approved" : `Name ${state(r.name, r.nameOn)} · phone ${state(r.phone, r.phoneOn)}`}</span>
      <button className={`${btnSmall} px-2! py-1!`}>Save</button>
    </form>
  );
}

function AmountsCell({ b }: { b: { id: string; package_price: number; advance_lkr: number; balance_status: string } }) {
  const summary = <span className="block text-xs text-black/50">{lkr(b.package_price)} − {lkr(b.advance_lkr)} adv = <b className="font-medium text-black/70">{lkr(balanceOf(b))}</b> balance</span>;
  if (b.balance_status === "approved") return summary;
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{summary}<span className="text-[#9b5b2b] underline">Correct amounts</span></summary>
      <form action={adjustBookingAmounts} className="mt-2 grid min-w-48 gap-1">
        <input type="hidden" name="id" value={b.id} />
        <label className="flex items-center justify-between gap-2">Package<input name="price" type="number" min={0} required defaultValue={b.package_price} className="w-28 border border-black/10 px-2 py-1" /></label>
        <label className="flex items-center justify-between gap-2">Advance<input name="advance" type="number" min={0} required defaultValue={b.advance_lkr} className="w-28 border border-black/10 px-2 py-1" /></label>
        <span className="text-black/45">Balance is recalculated.</span>
        <button className={`${btnSmall} px-2! py-1!`}>Save</button>
      </form>
    </details>
  );
}
