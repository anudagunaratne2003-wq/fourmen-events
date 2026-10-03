import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm, { type AuthMode } from "@/components/LoginForm";
import { getUser, homeFor } from "@/lib/auth";
import { eyebrow, h2 } from "@/lib/ui";

export const metadata: Metadata = { title: "Sign in or create an account" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string }> }) {
  const { next, mode, error } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const user = await getUser();
  if (user) redirect(safe || homeFor(user.role));
  const m: AuthMode = mode === "signup" || mode === "forgot" ? mode : "signin";
  return (
    <main className="mx-auto max-w-md px-5 py-16 md:py-24">
      <p className={eyebrow}>Account</p>
      <h1 className={`${h2} mt-4`}>{m === "signup" ? "Create account" : m === "forgot" ? "Reset password" : "Sign in"}</h1>
      <p className="mb-8 mt-4 text-sm leading-7 text-black/60">
        Create a free account to book and track your sessions. Photographers and the Fourmen team use the email they were registered with.
      </p>
      {error && (
        <p role="alert" className="mb-6 text-sm text-red-700">
          {error === "browser"
            ? "Please open the email link in the same browser you used to request it, or request a new link here."
            : "That link has expired or was already used. Only the newest email link works, so request a new one and use that."}
        </p>
      )}
      <LoginForm key={m} next={safe} mode={m} />
    </main>
  );
}
