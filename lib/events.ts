// Event booking states, shared by the admin controls and the public pages.

export type EventStatus = "draft" | "upcoming" | "open" | "paused" | "closed";

/** States the public can see. Only "open" takes bookings. */
export const VISIBLE: EventStatus[] = ["upcoming", "open", "paused"];

export const STATUS: Record<EventStatus, { label: string; admin: string; banner: string | null }> = {
  draft: { label: "Draft", admin: "Hidden from the public", banner: null },
  upcoming: { label: "Opening soon", admin: "Visible, browsing only", banner: "Bookings open soon. You can browse photographers and their packages now." },
  open: { label: "Open for booking", admin: "Taking bookings", banner: null },
  paused: { label: "Bookings paused", admin: "Visible, bookings stopped", banner: "Bookings are paused for now. Please check back soon." },
  closed: { label: "Closed", admin: "Finished, hidden from the public", banner: null },
};

export const isStatus = (s: string): s is EventStatus => s in STATUS;
