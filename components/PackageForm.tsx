import PackagePriceField from "@/components/PackagePriceField";
import SubmitButton from "@/components/SubmitButton";
import { SERVICE_FEE_LKR } from "@/lib/format";
import { btnSmallDark, input, label } from "@/lib/ui";

export type Pkg = { id: string; name: string; price_lkr: number; base_price_lkr: number | null; description: string | null; inclusions: string[] };

/** Create or edit a package. Used by photographers, and by admins managing a profile (photographerId set). */
export default function PackageForm({ k, action, photographerId }: { k?: Pkg; action: (fd: FormData) => Promise<void>; photographerId?: string }) {
  return (
    <form action={action} className="mt-4 grid gap-3">
      {k && <input type="hidden" name="id" value={k.id} />}
      {photographerId && <input type="hidden" name="photographer_id" value={photographerId} />}
      <div><label className={label}>Name</label><input name="name" required maxLength={80} defaultValue={k?.name} className={input} placeholder="e.g. Solo Portrait" /></div>
      <PackagePriceField base={k ? (k.base_price_lkr ?? Math.max(k.price_lkr - SERVICE_FEE_LKR, 0)) : null} idPrefix={k?.id ?? "new"} />
      <div><label className={label}>Short description</label><input name="description" maxLength={300} defaultValue={k?.description ?? ""} className={input} /></div>
      <div><label className={label}>What is included (one per line)</label><textarea name="inclusions" rows={5} defaultValue={k?.inclusions.join("\n")} className={input} placeholder={"30-minute session\n25 edited photos\nOnline gallery"} /></div>
      <SubmitButton className={btnSmallDark} pendingText="Saving…">Save package</SubmitButton>
    </form>
  );
}
