import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase/admin";
import { publicName } from "@/lib/reveal";
import { TERMS } from "@/lib/terms";
import { fmtDateTimeLK, lkr, SERVICE_FEE_LKR } from "@/lib/format";
import { portfolioUrl } from "@/lib/storage";
import { btnSmall, btnSmallDark, h2, input, label } from "@/lib/ui";
import SubmitButton from "@/components/SubmitButton";
import PackageForm from "@/components/PackageForm";
import BankFields from "@/components/BankFields";
import { AdminPortfolioUploader } from "@/components/ActionUploaders";
import {
  updatePhotographerProfile, savePackageAdmin, deletePackageAdmin, deletePortfolioImageAdmin, saveBankDetailsAdmin,
} from "@/lib/actions/admin";

const box = "border border-[#dbcfc1] bg-white p-6";
const sec = "mt-10";

/** Admins build or update a photographer's whole profile for them (photos and package details sent by the photographer). */
export default async function ManagePhotographer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const { data: p } = await d.from("photographers").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: pkgs }, { data: imgs }, { data: bank }] = await Promise.all([
    d.from("packages").select("*").eq("photographer_id", id).order("price_lkr"),
    d.from("portfolio_images").select("id, path").eq("photographer_id", id).order("created_at", { ascending: false }),
    d.from("photographer_bank_accounts").select("bank_name, branch, account_name, account_number").eq("photographer_id", id).maybeSingle(),
  ]);
  const accepted = p.terms_version === TERMS.version;

  return (
    <>
      <Link href="/admin/photographers" className="text-xs uppercase tracking-[0.2em] text-black/50 hover:text-[#9b5b2b]">← All photographers</Link>
      <h1 className={`${h2} mt-4`}>{p.display_name}</h1>
      <p className="mt-2 text-sm text-black/55">
        {p.email} · clients see <b className="font-medium text-[#9b5b2b]">{publicName(p)}</b> · {p.user_id ? "has an account" : "has not created an account yet"}{!p.active && " · hidden"}
      </p>
      <p className={`mt-4 border-l-4 px-4 py-3 text-sm ${accepted ? "border-green-700 bg-green-50 text-green-900" : "border-amber-600 bg-amber-50 text-amber-900"}`}>
        {accepted
          ? `Live: Photographer Terms v${p.terms_version} accepted on ${fmtDateTimeLK(p.terms_accepted_at)}.`
          : `Not visible to clients yet. You can set up everything below, but the profile only goes live once ${p.display_name} signs in with ${p.email} and accepts the Photographer Terms themselves. Admins cannot accept the terms on their behalf.`}
      </p>

      {/* ---------- Profile details ---------- */}
      <section className={sec}>
        <h2 className="mb-3 text-xl font-light uppercase tracking-[0.16em]">Profile details</h2>
        <form action={updatePhotographerProfile} className={`${box} grid gap-3 md:grid-cols-2`}>
          <input type="hidden" name="photographer_id" value={p.id} />
          <div><label className={label} htmlFor="pf-name">Real name (shown to clients only after the reveal)</label><input id="pf-name" name="display_name" required maxLength={80} defaultValue={p.display_name} className={input} /></div>
          <div><label className={label} htmlFor="pf-alias">Stage name (what clients see before the reveal)</label><input id="pf-alias" name="alias" maxLength={60} defaultValue={p.alias ?? ""} className={input} placeholder="e.g. Lens Artist 04" /></div>
          <div><label className={label} htmlFor="pf-style">Style (one line)</label><input id="pf-style" name="style" maxLength={120} defaultValue={p.style ?? ""} className={input} placeholder="Natural light, candid portraits" /></div>
          <div><label className={label} htmlFor="pf-phone">Phone (shared with clients on the reveal date)</label><input id="pf-phone" name="contact_phone" maxLength={40} defaultValue={p.contact_phone ?? ""} className={input} /></div>
          <div className="md:col-span-2"><label className={label} htmlFor="pf-bio">Short bio (public, do not include contact details)</label><textarea id="pf-bio" name="bio" rows={3} maxLength={1000} defaultValue={p.bio ?? ""} className={input} /></div>
          <div><SubmitButton className={btnSmallDark} pendingText="Saving…">Save profile details</SubmitButton></div>
        </form>
      </section>

      {/* ---------- Packages ---------- */}
      <section className={sec}>
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">Packages</h2>
        <p className="mb-3 mt-1 text-sm text-black/55">Enter the photographer&apos;s own price. The {lkr(SERVICE_FEE_LKR)} Fourmen fee is added automatically.</p>
        <div className="grid gap-5 md:grid-cols-2">
          {(pkgs ?? []).map((k) => (
            <details key={k.id} className={box}>
              <summary className="cursor-pointer text-lg font-light uppercase tracking-[0.1em]">{k.name} <span className="text-[#9b5b2b]">· {lkr(k.price_lkr)}</span>
                <span className="block text-xs normal-case tracking-normal text-black/50">Photographer receives {lkr(k.base_price_lkr ?? Math.max(k.price_lkr - SERVICE_FEE_LKR, 0))}</span></summary>
              <PackageForm k={k} action={savePackageAdmin} photographerId={p.id} />
              <form action={deletePackageAdmin} className="mt-3"><input type="hidden" name="photographer_id" value={p.id} /><input type="hidden" name="id" value={k.id} />
                <SubmitButton className={btnSmall} danger confirm={`Delete the ${k.name} package?`} confirmDetail="Students will no longer be able to choose it. Existing bookings keep their package.">Delete package</SubmitButton></form>
            </details>
          ))}
          <details className={box} open={!pkgs?.length}>
            <summary className="cursor-pointer text-lg font-light uppercase tracking-[0.1em]">+ New package</summary>
            <PackageForm action={savePackageAdmin} photographerId={p.id} />
          </details>
        </div>
      </section>

      {/* ---------- Portfolio ---------- */}
      <section className={sec}>
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">Portfolio</h2>
        <p className="mb-3 mt-1 text-sm text-black/55">Upload the photos the photographer sent you. They must be the photographer&apos;s own work, without watermarks, logos or contact details (Terms, section 1).</p>
        <div className={box}>
          <AdminPortfolioUploader photographerId={p.id} />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {(imgs ?? []).map((i) => (
              <div key={i.id} className="group relative aspect-square bg-[#f3eee7]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={portfolioUrl(i.path)} alt="" className="h-full w-full object-cover" />
                <form action={deletePortfolioImageAdmin} className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-center opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">
                  <input type="hidden" name="photographer_id" value={p.id} /><input type="hidden" name="id" value={i.id} />
                  <SubmitButton className="text-[10px] uppercase tracking-[0.2em] text-white" pendingText="Removing…" danger confirm="Remove this photo from the portfolio?">Remove</SubmitButton>
                </form>
              </div>
            ))}
          </div>
          {!imgs?.length && <p className="mt-4 text-sm text-black/45">No portfolio photos yet.</p>}
        </div>
      </section>

      {/* ---------- Payout details ---------- */}
      <section className={sec}>
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">Payout details</h2>
        <p className="mb-3 mt-1 text-sm text-black/55">Bank account for transferring their earnings. The photographer is emailed whenever this changes.</p>
        <form action={saveBankDetailsAdmin} className={`${box} grid max-w-3xl gap-4`}>
          <input type="hidden" name="photographer_id" value={p.id} />
          <input type="hidden" name="return" value="manage" />
          <BankFields bank={bank} idPrefix={`m-${p.id}`} />
          <div><SubmitButton className={btnSmallDark} pendingText="Saving…" confirm={`Save payout details for ${p.display_name}?`} confirmDetail="The photographer is emailed that their payout details changed.">Save payout details</SubmitButton></div>
        </form>
      </section>
    </>
  );
}
