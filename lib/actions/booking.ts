"use server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { splitPayment, balanceOf, ADVANCE_LKR } from "@/lib/format";
import { notifyAdminsPaymentToReview } from "@/lib/email";

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newRef = () => "FM-" + Array.from({ length: 4 }, () => REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)]).join("");

export type BookingInput = {
  eventId: string; photographerId: string; packageId: string; slotId: string;
  name: string; phone: string; email: string; degree: string; notes: string; proofPath: string;
};

export async function createBooking(i: BookingInput): Promise<{ id?: string; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Please sign in to book." };
  if (user.role !== "client") return { error: "Booking is for client accounts. Use a different email." };
  const name = i.name.trim(), phone = i.phone.trim(), email = i.email.trim();
  if (!name || !phone || !email || !i.degree.trim()) return { error: "Fill in name, phone, email and degree." };
  if (!i.proofPath || !i.proofPath.startsWith(user.id + "/")) return { error: "Upload your advance payment proof." };

  const d = db();
  // Stops one account from holding many slots with unchecked receipts while real students wait.
  const { count: waiting } = await d.from("bookings").select("id", { count: "exact", head: true }).eq("client_id", user.id).eq("advance_status", "pending");
  if ((waiting ?? 0) >= 2) return { error: "You already have 2 bookings waiting for payment approval. Please wait until we confirm them, or contact Fourmen Events." };
  const { data: ev } = await d.from("events").select("*").eq("id", i.eventId).single();
  if (!ev || ev.status !== "open") return { error: "Bookings for this event are closed." };
  const { data: pkg } = await d.from("packages").select("*").eq("id", i.packageId).eq("photographer_id", i.photographerId).eq("active", true).single();
  if (!pkg) return { error: "That package is no longer available." };
  const { data: link } = await d.from("event_photographers").select("event_id").eq("event_id", ev.id).eq("photographer_id", i.photographerId).maybeSingle();
  if (!link) return { error: "This photographer is not part of this event." };
  // Only active photographers who have accepted the Photographer Terms can be booked (also blocks direct links).
  const { data: ph } = await d.from("photographers").select("id").eq("id", i.photographerId).eq("active", true).not("terms_accepted_at", "is", null).maybeSingle();
  if (!ph) return { error: "This photographer is not taking bookings right now." };

  // First come, first served: this single UPDATE only succeeds for the first person.
  const { data: claimed } = await d.from("slots").update({ status: "booked" })
    .eq("id", i.slotId).eq("event_id", ev.id).eq("photographer_id", i.photographerId).eq("status", "open").select("id");
  if (!claimed || claimed.length === 0) return { error: "Sorry, that time was just taken. Please pick another." };

  // Never ask for more upfront than the package costs.
  const pay = splitPayment(pkg.price_lkr, ADVANCE_LKR);
  for (let tries = 0; tries < 4; tries++) {
    const { data: row, error } = await d.from("bookings").insert({
      ref: newRef(), client_id: user.id, event_id: ev.id, photographer_id: i.photographerId,
      package_id: pkg.id, slot_id: i.slotId, client_name: name, client_phone: phone, client_email: email,
      degree: i.degree.trim(), notes: i.notes.trim() || null,
      package_name: pkg.name, package_price: pay.total, advance_lkr: pay.advance,
      balance_lkr: pay.balance, advance_proof_path: i.proofPath,
    }).select("id").single();
    if (row) {
      if (!user.name || !user.phone) await d.from("profiles").update({ full_name: user.name || name, phone: user.phone || phone }).eq("id", user.id);
      await notifyAdminsPaymentToReview(row.id, "advance"); // email failures never block the booking
      revalidatePath("/account");
      return { id: row.id };
    }
    if (error?.code !== "23505") break; // not a duplicate reference, give up
  }
  await d.from("slots").update({ status: "open" }).eq("id", i.slotId); // release the slot
  return { error: "Could not save your booking. Please try again." };
}

export async function submitBalance(bookingId: string, proofPath: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Please sign in." };
  if (!proofPath.startsWith(user.id + "/")) return { error: "Upload your payment proof first." };
  const d = db();
  const { data: b } = await d.from("bookings").select("*").eq("id", bookingId).eq("client_id", user.id).single();
  if (!b) return { error: "Booking not found." };
  // The balance can be paid any time once the advance is approved, before or after the shoot.
  if (b.advance_status !== "approved") return { error: "Your advance payment must be confirmed first." };
  if (balanceOf(b) <= 0) return { error: "There is no balance left to pay on this booking." };
  if (!["none", "rejected"].includes(b.balance_status)) return { error: "Your balance is already being processed." };
  const { data: sent } = await d.from("bookings").update({ balance_status: "pending", balance_proof_path: proofPath, review_note: null })
    .eq("id", bookingId).in("balance_status", ["none", "rejected"]).select("id");
  if (!sent?.length) return { error: "Your balance is already being processed." };
  await notifyAdminsPaymentToReview(bookingId, "balance");
  revalidatePath(`/account/bookings/${bookingId}`);
  return {};
}
