import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/admin";

export type Role = "client" | "photographer" | "admin";
export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
  phone: string | null;
};

/** Admin emails from the ADMIN_EMAILS env var (comma separated). These can never be removed from the admin UI. */
export function envAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** Role is decided from the whitelists on every request, so adding or removing an
 *  admin / photographer email takes effect on their next page load, even if they signed up earlier.
 *  Only a verified email can unlock a role: otherwise anyone could sign up with the admin's address
 *  (e.g. if "Confirm email" is ever turned off in Supabase) and get the admin panel. */
async function resolveRole(email: string, verified: boolean): Promise<Role> {
  const e = email.trim().toLowerCase();
  if (!e || !verified) return "client";
  if (envAdminEmails().includes(e)) return "admin";
  const d = db();
  const [{ data: admins }, { data: ph }] = await Promise.all([
    d.from("admin_emails").select("email"),
    d.from("photographers").select("id").eq("email", e).maybeSingle(),
  ]);
  if ((admins ?? []).some((a) => a.email.trim().toLowerCase() === e)) return "admin";
  if (ph) return "photographer";
  return "client";
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const email = data.user.email ?? "";
  const meta = data.user.user_metadata ?? {};
  const d = db();
  const [{ data: p }, role] = await Promise.all([
    d.from("profiles").select("*").eq("id", data.user.id).maybeSingle(),
    resolveRole(email, !!data.user.email_confirmed_at),
  ]);
  const name: string = p?.full_name || meta.full_name || meta.name || "";
  const phone: string | null = p?.phone || meta.phone || null;

  // Keep the stored profile in step with the whitelists and the details given at sign-up.
  if (!p) {
    await d.from("profiles").upsert({ id: data.user.id, email, role, full_name: name || null, phone });
  } else if (p.role !== role || p.full_name !== (name || null) || p.phone !== phone || p.email !== email) {
    await d.from("profiles").update({ role, full_name: name || null, phone, email }).eq("id", data.user.id);
  }
  return { id: data.user.id, email, role, name, phone };
});

export async function requireUser(next = "/account") {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

/** Page-level and action-level guard. Wrong role -> back to the home page. */
export async function requireRole(role: Role, next?: string) {
  const u = await requireUser(next ?? `/${role}`);
  if (u.role !== role) redirect("/");
  return u;
}

/** Photographer record for a signed-in photographer (links by email on first use). */
export async function getPhotographer(user: SessionUser) {
  const d = db();
  const { data: byUser } = await d.from("photographers").select("*").eq("user_id", user.id).maybeSingle();
  if (byUser) return byUser;
  // Exact match only: ilike would treat "_" and "%" in an email as wildcards.
  const { data: byEmail } = await d.from("photographers").select("*").eq("email", user.email.trim().toLowerCase()).is("user_id", null).maybeSingle();
  if (!byEmail) return null;
  await d.from("photographers").update({ user_id: user.id }).eq("id", byEmail.id);
  return { ...byEmail, user_id: user.id };
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "photographer" ? "/photographer" : "/account";
}
