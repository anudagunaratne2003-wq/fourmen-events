import "server-only";
import { db } from "@/lib/supabase/admin";
import { notifyBankDetailsChanged } from "@/lib/email";

export type BankAccount = { bank_name: string; branch: string; account_name: string; account_number: string; updated_at?: string };

const field = (fd: FormData, k: string, max: number) => String(fd.get(k) || "").trim().replace(/\s+/g, " ").slice(0, max);

/** Reads and checks the payout form. Account numbers are stored as digits only. */
export function parseBankForm(fd: FormData): { row: BankAccount } | { error: string } {
  const bank_name = field(fd, "bank_name", 80), branch = field(fd, "branch", 80), account_name = field(fd, "account_name", 120);
  const account_number = String(fd.get("account_number") || "").replace(/[\s-]/g, "");
  if (bank_name.length < 2 || branch.length < 2 || account_name.length < 2) return { error: "Fill in the bank, branch and account holder's name." };
  if (!/^\d{5,20}$/.test(account_number)) return { error: "The account number should be 5 to 20 digits (spaces and dashes are fine)." };
  return { row: { bank_name, branch, account_name, account_number } };
}

/** Saves payout details and, if anything changed, emails the photographer so an unexpected change is noticed. */
export async function saveBankAccount(photographerId: string, row: BankAccount, actorId: string, byAdmin: boolean) {
  const d = db();
  const { data: before } = await d.from("photographer_bank_accounts").select("bank_name, branch, account_name, account_number").eq("photographer_id", photographerId).maybeSingle();
  const changed = !before || (Object.keys(row) as (keyof BankAccount)[]).some((k) => before[k as keyof typeof before] !== row[k]);
  if (!changed) return { changed: false };
  const { error } = await d.from("photographer_bank_accounts").upsert({ photographer_id: photographerId, ...row, updated_at: new Date().toISOString(), updated_by: actorId });
  if (error) return { error: "Could not save the payout details. Please try again." };
  // Never log the full account number.
  await d.from("audit_log").insert({ actor_id: actorId, action: "bank_details_saved", detail: { photographer_id: photographerId, by_admin: byAdmin, account_last4: row.account_number.slice(-4), first_time: !before } });
  await notifyBankDetailsChanged(photographerId, row, byAdmin);
  return { changed: true };
}

/** "•••• 1234", for places where the full number is not needed. */
export const maskAccount = (n: string) => `•••• ${n.slice(-4)}`;
