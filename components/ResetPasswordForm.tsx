"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { btnDark, input, label } from "@/lib/ui";

export default function ResetPasswordForm({ home }: { home: string }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    if (pw.length < 8) return setMsg("Use a password with at least 8 characters.");
    if (pw !== confirm) return setMsg("The two passwords do not match.");
    setBusy(true);
    const { error } = await browserClient().auth.updateUser({ password: pw });
    if (error) { setBusy(false); return setMsg(error.message || "Could not update the password."); }
    window.location.assign(home);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label htmlFor="pw" className={label}>New password</label><input id="pw" type="password" required minLength={8} autoComplete="new-password" className={input} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <div><label htmlFor="pw2" className={label}>Confirm password</label><input id="pw2" type="password" required autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
      <button disabled={busy} className={`${btnDark} w-full`}>{busy ? "Saving…" : "Save password"}</button>
      {msg && <p className="text-sm text-red-700" role="alert">{msg}</p>}
    </form>
  );
}
