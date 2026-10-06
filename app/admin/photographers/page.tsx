import { db } from "@/lib/supabase/admin";
import { createPhotographer, togglePhotographer, reviewApplication, setPhotographerAlias, saveBankDetailsAdmin } from "@/lib/actions/admin";
import { publicName } from "@/lib/reveal";
import { fmtDate, fmtDateTimeLK } from "@/lib/format";
import { TERMS } from "@/lib/terms";
import { btnSmall, btnSmallDark, h2, input, label } from "@/lib/ui";
import SubmitButton from "@/components/SubmitButton";
import BankFields from "@/components/BankFields";
import CopyButton from "@/components/CopyButton";

export default async function PhotographersAdmin() {
  const d = db();
  const [{ data: phs }, { data: apps }, { data: banks }] = await Promise.all([
    d.from("photographers").select("*").order("created_at", { ascending: false }),
    d.from("photographer_applications").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    d.from("photographer_bank_accounts").select("photographer_id, bank_name, branch, account_name, account_number, updated_at"),
  ]);
  const bankOf = (id: string) => (banks ?? []).find((b) => b.photographer_id === id) ?? null;
  return (
    <>
      <h1 className={h2}>Photographers</h1>
      <p className="mb-6 mt-2 text-sm text-black/55">
        Add a photographer with the email they will sign in with. They then manage their own times, packages, portfolio and deliveries.
      </p>
      <section className="mb-10">
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#9b5b2b]">New applications ({apps?.length ?? 0}) · from the public Work with us page</h2>
        {!apps?.length ? <p className="border border-dashed border-black/20 bg-white px-5 py-6 text-sm text-black/45">No pending applications.</p> : (
          <div className="space-y-4">
            {apps.map((a) => (
              <div key={a.id} className="border border-[#dbcfc1] bg-white p-5 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{a.name} <span className="font-normal text-black/45">· applied {fmtDate(a.created_at.slice(0, 10))}</span></p>
                    <p className="break-all text-black/60">{a.email} · {a.phone}{a.city ? ` · ${a.city}` : ""}</p>
                    <p className="mt-1 text-black/60">{[a.experience, a.specialties].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1 flex flex-wrap gap-x-4 break-all">
                      {a.portfolio_url && /^https?:\/\//i.test(a.portfolio_url) && <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer nofollow" className="text-[#9b5b2b] underline">Portfolio</a>}
                      {a.instagram && <span className="text-black/60">Instagram: {a.instagram}</span>}
                    </p>
                    {a.message && <p className="mt-2 whitespace-pre-line text-black/65">{a.message}</p>}
                  </div>
                  <div className="flex gap-2">
                    <form action={reviewApplication}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="decision" value="approve" /><SubmitButton className={btnSmallDark} pendingText="Approving…" confirm={`Approve ${a.name} as a photographer?`} confirmDetail={`${a.email} is added to the photographer list and emailed instructions to create their account.`}>Approve</SubmitButton></form>
                    <form action={reviewApplication}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="decision" value="decline" /><SubmitButton className={btnSmall} danger confirm={`Decline ${a.name}'s application?`} confirmDetail="They will be sent a short, polite email. This cannot be undone.">Decline</SubmitButton></form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#9b5b2b]">Add a photographer directly</h2>
      <form action={createPhotographer} className="grid gap-3 border border-[#dbcfc1] bg-white p-6 md:grid-cols-2">
        <div><label className={label}>Display name</label><input name="name" required className={input} /></div>
        <div><label className={label}>Sign-in email</label><input name="email" type="email" required className={input} /></div>
        <div><label className={label}>Stage name (what clients see before the reveal)</label><input name="alias" maxLength={60} className={input} placeholder="e.g. Lens Artist 04" /></div>
        <div><label className={label}>Style (one line)</label><input name="style" className={input} placeholder="Natural light, candid portraits" /></div>
        <div><label className={label}>Private phone (never shown to clients)</label><input name="phone" className={input} /></div>
        <div className="md:col-span-2"><label className={label}>Short bio</label><textarea name="bio" rows={2} className={input} /></div>
        <div><SubmitButton className={btnSmallDark}>Add photographer</SubmitButton></div>
      </form>
      <div className="mt-8 divide-y divide-black/10 border border-[#dbcfc1] bg-white">
        {(phs ?? []).map((p) => {
          const bank = bankOf(p.id);
          return (
          <div key={p.id} className="px-5 py-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-medium">{p.display_name} {!p.active && <span className="text-black/40">(hidden)</span>}</p>
              <p className="text-black/55">{p.email}{p.contact_phone ? ` · ${p.contact_phone}` : ""} · {p.user_id ? "has signed in" : "not signed in yet"}</p>
              <p className="text-black/55">Clients see: <b className="font-medium text-[#9b5b2b]">{publicName(p)}</b>{!p.alias && " (auto, set a stage name)"}</p>
              <p className={`text-xs ${p.terms_version === TERMS.version ? "text-green-700" : "text-amber-700"}`}>
                {p.terms_version
                  ? `Photographer Terms v${p.terms_version}, accepted on ${fmtDateTimeLK(p.terms_accepted_at)}${p.terms_version !== TERMS.version ? ` (must accept v${TERMS.version})` : ""}`
                  : "Terms not accepted yet: hidden from clients until they accept in their dashboard"}
              </p></div>
            <form action={setPhotographerAlias} className="flex gap-2"><input type="hidden" name="id" value={p.id} /><input name="alias" maxLength={60} defaultValue={p.alias ?? ""} placeholder="Stage name" aria-label={`Stage name for ${p.display_name}`} className={`${input} py-2!`} /><SubmitButton className={btnSmall}>Save</SubmitButton></form>
            <form action={togglePhotographer}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="active" value={String(!p.active)} /><SubmitButton className={btnSmall}>{p.active ? "Hide" : "Show"}</SubmitButton></form>
          </div>
          <div className="mt-3 border-t border-black/10 pt-3">
            {bank ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="leading-6 text-black/70">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#9b5b2b]">Payout · </span>
                  {bank.bank_name}, {bank.branch} · {bank.account_name} · <span className="font-mono">{bank.account_number}</span>
                  <span className="block text-xs text-black/40">Updated {fmtDate(bank.updated_at.slice(0, 10))}</span>
                </p>
                <CopyButton text={`${bank.bank_name}, ${bank.branch}\n${bank.account_name}\n${bank.account_number}`} label="Copy bank details" className="text-[#9b5b2b] hover:text-black" />
              </div>
            ) : <p className="text-xs text-amber-700">No payout bank details yet. The photographer can add them in their dashboard, or you can add them below.</p>}
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-black/55 underline">{bank ? "Edit payout details" : "Add payout details"}</summary>
              <form action={saveBankDetailsAdmin} className="mt-3 grid max-w-2xl gap-3">
                <input type="hidden" name="photographer_id" value={p.id} />
                <BankFields bank={bank} idPrefix={`ph-${p.id}`} />
                <div><SubmitButton className={btnSmallDark} pendingText="Saving…" confirm={`Save payout details for ${p.display_name}?`} confirmDetail="The photographer is emailed that their payout details changed.">Save payout details</SubmitButton></div>
              </form>
            </details>
          </div>
          </div>
          );
        })}
        {!phs?.length && <p className="px-5 py-6 text-sm text-black/45">No photographers yet.</p>}
      </div>
    </>
  );
}
