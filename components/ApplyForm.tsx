"use client";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitApplication, type ApplyState } from "@/lib/actions/apply";
import { btnDark, input, label } from "@/lib/ui";

const SPECIALTIES = ["Graduation", "Weddings", "Events", "Portraits", "Videography", "Drone"];
const EXPERIENCE = ["Less than 1 year", "1–3 years", "3–5 years", "5+ years"];

export default function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, {});

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-4 border border-[#dbcfc1] bg-[#f8f4ef] p-8">
        <CheckCircle2 className="text-[#9b5b2b]" size={32} />
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">Application received</h2>
        <p className="text-sm leading-7 text-black/65">
          Thank you. Our team will look through your work and contact you by email or phone. If you are approved, you will
          create your account with the same email and get your own dashboard for packages, portfolio and time slots.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 border border-black/10 bg-white p-6 md:p-8">
      {/* Spam trap: hidden from people, often filled in by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label} htmlFor="a-name">Full name</label><input id="a-name" name="name" required autoComplete="name" className={input} /></div>
        <div><label className={label} htmlFor="a-email">Email</label><input id="a-email" name="email" type="email" required autoComplete="email" className={input} /></div>
        <div><label className={label} htmlFor="a-phone">Phone (WhatsApp)</label><input id="a-phone" name="phone" type="tel" required autoComplete="tel" className={input} /></div>
        <div><label className={label} htmlFor="a-city">City</label><input id="a-city" name="city" autoComplete="address-level2" className={input} placeholder="e.g. Colombo" /></div>
        <div><label className={label} htmlFor="a-port">Portfolio link</label><input id="a-port" name="portfolio_url" type="url" className={input} placeholder="https://" /></div>
        <div><label className={label} htmlFor="a-ig">Instagram</label><input id="a-ig" name="instagram" className={input} placeholder="@yourhandle" /></div>
      </div>
      <div><label className={label} htmlFor="a-exp">Experience</label>
        <select id="a-exp" name="experience" className={input} defaultValue="">
          <option value="">Choose one</option>
          {EXPERIENCE.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className={label}>What do you shoot?</legend>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
          {SPECIALTIES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm"><input type="checkbox" name="specialty" value={s} /> {s}</label>
          ))}
        </div>
      </fieldset>
      <div><label className={label} htmlFor="a-msg">Tell us about yourself (optional)</label><textarea id="a-msg" name="message" rows={4} maxLength={2000} className={input} placeholder="Your style, gear, availability…" /></div>
      <p className="text-xs leading-5 text-black/55">
        If you are approved, you will be asked to accept the{" "}
        <a href="/photographer-terms" target="_blank" className="underline">Fourmen Events Photographer Terms &amp; Conditions</a>{" "}
        before your profile goes live.
      </p>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className={`${btnDark} w-full sm:w-fit`}>{pending ? "Sending…" : "Send application"}</button>
    </form>
  );
}
