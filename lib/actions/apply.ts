"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";

export type ApplyState = { ok?: boolean; error?: string };

const text = (fd: FormData, k: string, max = 300) => String(fd.get(k) || "").trim().slice(0, max);

/** Public form: anyone can apply. Nothing is granted until an admin approves the application. */
export async function submitApplication(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  // Hidden field real people never fill in. Bots usually do, so pretend it worked.
  if (text(fd, "website")) return { ok: true };

  const name = text(fd, "name", 120), email = text(fd, "email", 200).toLowerCase(), phone = text(fd, "phone", 40);
  if (!name || !phone) return { error: "Please enter your name and phone number." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  const portfolio = text(fd, "portfolio_url", 300), instagram = text(fd, "instagram", 120);
  if (!portfolio && !instagram) return { error: "Share a portfolio link or your Instagram so we can see your work." };
  if (portfolio && !/^https?:\/\/\S+\.\S+/i.test(portfolio)) return { error: "The portfolio link should start with http:// or https://" };

  const d = db();
  const [{ data: existing }, { data: pending }] = await Promise.all([
    d.from("photographers").select("id").eq("email", email).maybeSingle(),
    d.from("photographer_applications").select("id").eq("email", email).eq("status", "pending").maybeSingle(),
  ]);
  if (existing) return { error: "This email is already registered as a Fourmen photographer. Sign in at /login." };
  if (pending) return { error: "We already have your application and will be in touch soon." };

  const { error } = await d.from("photographer_applications").insert({
    name, email, phone,
    city: text(fd, "city", 120) || null,
    portfolio_url: portfolio || null,
    instagram: instagram || null,
    experience: text(fd, "experience", 120) || null,
    specialties: fd.getAll("specialty").map(String).filter(Boolean).join(", ").slice(0, 300) || null,
    message: text(fd, "message", 2000) || null,
  });
  if (error) return { error: "Could not send your application. Please try again." };
  revalidatePath("/admin/photographers");
  return { ok: true };
}
