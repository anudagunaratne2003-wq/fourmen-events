"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { fullyPaid } from "@/lib/format";
import { notifyNewReview } from "@/lib/email";

/** A client rates their photographer once the shoot is delivered (album shared) and paid in full. They can update it later. */
export async function submitReview(fd: FormData) {
  const bookingId = String(fd.get("booking_id"));
  const user = await requireUser(`/account/bookings/${bookingId}`);
  const back = (msg: string): never => redirect(`/account/bookings/${bookingId}?msg=${encodeURIComponent(msg)}&t=${Date.now()}`);
  const rating = Math.round(Number(fd.get("rating")));
  const comment = String(fd.get("comment") || "").trim().slice(0, 1000) || null;
  if (!(rating >= 1 && rating <= 5)) return back("Please choose from 1 to 5 stars.");

  const d = db();
  const { data: b } = await d.from("bookings")
    .select("id, client_id, photographer_id, package_price, advance_lkr, advance_status, balance_status, album_url")
    .eq("id", bookingId).eq("client_id", user.id).maybeSingle();
  if (!b) return back("Booking not found.");
  if (!fullyPaid(b) || !b.album_url) return back("You can rate your photographer once your photos are delivered and your booking is paid in full.");

  const { data: existing } = await d.from("reviews").select("id").eq("booking_id", b.id).maybeSingle();
  const { error } = await d.from("reviews").upsert(
    { booking_id: b.id, photographer_id: b.photographer_id, client_id: user.id, rating, comment, updated_at: new Date().toISOString() },
    { onConflict: "booking_id" },
  );
  if (error) return back("Could not save your review. Please try again.");
  if (!existing) await notifyNewReview(b.id);
  revalidatePath(`/account/bookings/${b.id}`); revalidatePath("/graduation", "layout"); revalidatePath("/photographer");
  back(existing ? "Your review was updated. Thank you!" : "Thank you for your review!");
}
