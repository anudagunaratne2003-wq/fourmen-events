"use client";
import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";
import { btnDark, btnLine, input, label } from "@/lib/ui";

export type AuthMode = "signin" | "signup" | "forgot";

const tooMany = "Too many emails were sent recently. Please wait a few minutes and try again.";

export default function LoginForm({ next, mode: initial }: { next: string; mode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initial);
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState("");
  const callback = (to: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(to)}`;
  const go = () => window.location.assign(`/auth/callback?next=${encodeURIComponent(next)}`);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const switchTo = (m: AuthMode) => { setMode(m); setMsg(""); setSent(""); };

  async function google() {
    await browserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(next) } });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setSent("");
    const email = f.email.trim();
    const sb = browserClient();

    if (mode === "signup") {
      if (!f.name.trim() || !f.phone.trim()) return setMsg("Enter your name and phone number.");
      if (f.password.length < 8) return setMsg("Use a password with at least 8 characters.");
      if (f.password !== f.confirm) return setMsg("The two passwords do not match.");
      setBusy(true);
      const { data, error } = await sb.auth.signUp({
        email, password: f.password,
        options: { data: { full_name: f.name.trim(), phone: f.phone.trim() }, emailRedirectTo: callback(next) },
      });
      setBusy(false);
      if (error) return setMsg(error.status === 429 ? tooMany : error.message || "Could not create the account. Try again.");
      // Supabase returns a user with no identities when the email is already registered.
      if (data.user && data.user.identities?.length === 0) return setMsg("An account with this email already exists. Sign in instead, or reset your password.");
      if (data.session) return go();
      return setSent(`We sent a confirmation link to ${email}. Open it on this device to activate your account.`);
    }

    if (mode === "signin") {
      setBusy(true);
      const { error } = await sb.auth.signInWithPassword({ email, password: f.password });
      if (!error) return go();
      setBusy(false);
      if (/confirm/i.test(error.message)) return setMsg("Please confirm your email first. Check your inbox for the link we sent.");
      return setMsg("Wrong email or password. If you used Google or an emailed code before, use \"Forgot password\" to set one.");
    }

    setBusy(true);
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: callback("/reset-password") });
    setBusy(false);
    if (error) return setMsg(error.status === 429 ? tooMany : "Could not send the reset email. Check the address and try again.");
    setSent(`If ${email} has an account, a password reset link is on its way.`);
  }

  const tab = (m: AuthMode, text: string) => (
    <button type="button" onClick={() => switchTo(m)} aria-pressed={mode === m}
      className={`flex-1 border-b-2 pb-3 text-xs uppercase tracking-[0.2em] transition ${mode === m ? "border-black text-black" : "border-transparent text-black/40 hover:text-black/70"}`}>{text}</button>
  );

  return (
    <div className="space-y-6">
      {mode !== "forgot" && <div className="flex">{tab("signin", "Sign in")}{tab("signup", "Create account")}</div>}
      {mode !== "forgot" && (
        <>
          <button type="button" onClick={google} className={`${btnLine} flex w-full items-center justify-center`}>Continue with Google</button>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-black/40">or with email</p>
        </>
      )}
      {sent ? (
        <p role="status" className="border-l-4 border-[#9b5b2b] bg-[#f3eee7] px-4 py-3 text-sm text-black/75">{sent}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div><label htmlFor="n" className={label}>Full name</label><input id="n" required autoComplete="name" className={input} value={f.name} onChange={set("name")} /></div>
              <div><label htmlFor="p" className={label}>Phone (WhatsApp)</label><input id="p" type="tel" required autoComplete="tel" className={input} value={f.phone} onChange={set("phone")} /></div>
            </>
          )}
          <div><label htmlFor="e" className={label}>Email address</label><input id="e" type="email" required autoComplete="email" className={input} value={f.email} onChange={set("email")} /></div>
          {mode !== "forgot" && (
            <div><label htmlFor="pw" className={label}>Password</label><input id="pw" type="password" required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={input} value={f.password} onChange={set("password")} /></div>
          )}
          {mode === "signup" && (
            <div><label htmlFor="pw2" className={label}>Confirm password</label><input id="pw2" type="password" required autoComplete="new-password" className={input} value={f.confirm} onChange={set("confirm")} /></div>
          )}
          <button disabled={busy} className={`${btnDark} w-full`}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
          </button>
        </form>
      )}
      {msg && <p className="text-sm text-red-700" role="alert">{msg}</p>}
      <div className="text-center">
        {mode === "signin" && (
          <div className="space-y-3">
            <p className="text-sm text-black/60">New to Fourmen? <button type="button" onClick={() => switchTo("signup")} className="font-medium text-[#9b5b2b] underline">Create an account</button></p>
            <button type="button" onClick={() => switchTo("forgot")} className="text-xs uppercase tracking-[0.2em] text-black/50 underline">Forgot password?</button>
          </div>
        )}
        {mode === "signup" && !sent && <p className="text-sm text-black/60">Already have an account? <button type="button" onClick={() => switchTo("signin")} className="font-medium text-[#9b5b2b] underline">Sign in</button></p>}
        {mode === "forgot" && <button type="button" onClick={() => switchTo("signin")} className="text-xs uppercase tracking-[0.2em] text-black/50 underline">Back to sign in</button>}
      </div>
    </div>
  );
}
