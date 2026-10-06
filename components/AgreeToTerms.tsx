"use client";
import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { btnDark } from "@/lib/ui";

/** Unticked by default; the button only works once the photographer ticks the box. */
export default function AgreeToTerms({ version }: { version: string }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="space-y-5">
      <input type="hidden" name="version" value={version} />
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
        <input type="checkbox" name="agree" value="yes" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#9b5b2b]" />
        <span>I have read, understood, and agree to the <b>Fourmen Events Photographer Terms &amp; Conditions</b> (version {version}).</span>
      </label>
      <SubmitButton className={`${btnDark} w-full sm:w-auto`} disabled={!agreed} pendingText="Activating your profile…">
        Agree &amp; create photographer profile
      </SubmitButton>
    </div>
  );
}
