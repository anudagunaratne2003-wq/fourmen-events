// Rules for when a client may see their photographer's real name and phone.

/** Today's date in Sri Lanka as YYYY-MM-DD, so reveals flip at local midnight. */
export const todayLK = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());

/** The name clients see before the reveal. Falls back to a stable code if the admin has not set a stage name. */
export const publicName = (p: { id: string; alias?: string | null }) => p.alias?.trim() || `Photographer ${p.id.slice(0, 4).toUpperCase()}`;

type RevealDates = { reveal_name_on?: string | null; reveal_phone_on?: string | null } | null | undefined;

/** The photographer's name and phone are revealed together, on one date, once the advance is approved.
 *  A booking's own date overrides the event's. (Both columns are saved with the same date; the second is
 *  only read as a fallback for older rows.) */
export function revealFor(b: { advance_status: string } & NonNullable<RevealDates>, ev: RevealDates) {
  const paid = b.advance_status === "approved", today = todayLK();
  const on = b.reveal_name_on || b.reveal_phone_on || ev?.reveal_name_on || ev?.reveal_phone_on || null;
  const shown = paid && !!on && today >= on;
  return { name: shown, phone: shown, on, nameOn: on, phoneOn: on };
}
