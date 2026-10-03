import type { Metadata } from "next";
import { requireUser, homeFor } from "@/lib/auth";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { eyebrow, h2 } from "@/lib/ui";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPassword() {
  const user = await requireUser("/reset-password");
  return (
    <main className="mx-auto max-w-md px-5 py-16 md:py-24">
      <p className={eyebrow}>Account</p>
      <h1 className={`${h2} mt-4`}>New password</h1>
      <p className="mb-8 mt-4 text-sm leading-7 text-black/60">Choose a new password for {user.email}.</p>
      <ResetPasswordForm home={homeFor(user.role)} />
    </main>
  );
}
