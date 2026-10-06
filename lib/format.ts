export const lkr = (n: number) => "LKR " + Number(n).toLocaleString("en-US");
export const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
export const firstName = (n: string) => (n || "").trim().split(/\s+/)[0] ?? "";

/** The advance can never be more than the package, and the balance is always package total minus advance. */
export function splitPayment(total: number, advance: number) {
  const t = Math.max(Math.round(total), 0);
  const a = Math.min(Math.max(Math.round(advance), 0), t);
  return { total: t, advance: a, balance: t - a };
}

type Amounts = { package_price: number; advance_lkr: number };
type PayState = Amounts & { advance_status: string; balance_status: string };

/** What is left to pay, always worked out from the package and the advance (never trusted from a stored number). */
export const balanceOf = (b: Amounts) => splitPayment(b.package_price, b.advance_lkr).balance;

/** Paid in full: the advance is approved and either the balance was approved or nothing is left to pay.
 *  This single rule decides whether a client can see their album link. */
export const fullyPaid = (b: PayState) => b.advance_status === "approved" && (b.balance_status === "approved" || balanceOf(b) === 0);

type B = PayState & { shoot_done: boolean };
export function stageLabel(b: B) {
  if (b.advance_status === "rejected") return "Advance not accepted";
  if (b.advance_status === "pending") return "Advance being checked";
  // Paying in full can now happen before the shoot, so payment state is checked first.
  if (fullyPaid(b)) return b.shoot_done ? "Paid in full · shoot done" : "Paid in full";
  if (b.balance_status === "pending") return "Balance being checked";
  if (!b.shoot_done) return "Confirmed";
  return "Balance due";
}
