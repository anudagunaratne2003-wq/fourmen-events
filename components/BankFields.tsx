import { input, label } from "@/lib/ui";

type Bank = { bank_name: string; branch: string; account_name: string; account_number: string } | null | undefined;

/** The four payout fields, shared by the photographer dashboard and the admin page. */
export default function BankFields({ bank, idPrefix }: { bank: Bank; idPrefix: string }) {
  const f = (name: keyof NonNullable<Bank>, text: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className={label} htmlFor={`${idPrefix}-${name}`}>{text}</label>
      <input id={`${idPrefix}-${name}`} name={name} required defaultValue={bank?.[name] ?? ""} className={input} {...extra} />
    </div>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {f("bank_name", "Bank", { placeholder: "e.g. Commercial Bank", maxLength: 80, autoComplete: "off" })}
      {f("branch", "Branch", { placeholder: "e.g. Kandy", maxLength: 80, autoComplete: "off" })}
      {f("account_name", "Account holder's name", { placeholder: "As shown on the account", maxLength: 120, autoComplete: "off" })}
      {f("account_number", "Account number", { inputMode: "numeric", pattern: "[0-9 \\-]{5,30}", title: "5 to 20 digits", maxLength: 30, autoComplete: "off" })}
    </div>
  );
}
