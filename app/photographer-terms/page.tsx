import type { Metadata } from "next";
import TermsDocument from "@/components/TermsDocument";
import { TERMS } from "@/lib/terms";
import { eyebrow, h2 } from "@/lib/ui";

export const metadata: Metadata = { title: "Photographer Terms & Conditions" };

/** Public copy of the terms, so photographers can read them before applying. */
export default function PhotographerTerms() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <p className={eyebrow}>For photographers</p>
      <h1 className={`${h2} mt-4`}>{TERMS.title}</h1>
      <div className="mt-8"><TermsDocument /></div>
    </main>
  );
}
