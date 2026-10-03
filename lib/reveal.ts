// Rules for when a client may see their photographer's real name and phone.

/** Today's date in Sri Lanka as YYYY-MM-DD, so reveals flip at local midnight. */
export const todayLK = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());

/** The name clients see before the reveal. Falls back to a stable code if the admin has not set a stage name. */
export const publicName = (p: { id: string; alias?: string | null }) => p.alias?.trim() || `Photographer ${p.id.slice(0, 4).toUpperCase()}`;

type RevealDates = { reveal_name_on?: string | null; reveal_phone_on?: string | null } | null | undefined;

/** Both reveals need an approved advance and a date that has arrived. A booking's own date overrides the event's. */
export function revealFor(b: { advance_status: string } & NonNullable<RevealDates>, ev: RevealDates) {
  const paid = b.advance_status === "approved", today = todayLK();
  const nameOn = b.reveal_name_on || ev?.reveal_name_on || null;
  const phoneOn = b.reveal_phone_on || ev?.reveal_phone_on || null;
  const phone = paid && !!phoneOn && today >= phoneOn;
  return { name: phone || (paid && !!nameOn && today >= nameOn), phone, nameOn, phoneOn };
}
