import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/supabase/admin";
import { fmtDate, lkr } from "@/lib/format";
import { eyebrow, h1 } from "@/lib/ui";
import { STATUS, VISIBLE, type EventStatus } from "@/lib/events";

export const metadata: Metadata = {
  title: "Graduation Photography",
  description:
    "Choose your photographer by their work and book your convocation shoot.",
};

const steps = [
  ["Choose your graduation", "Pick your university and convocation."],
  ["Browse photographers", "Flip through each portfolio and compare packages."],
  [
    "Pick a time and pay the advance",
    "First come, first served. Upload your receipt to secure it.",
  ],
  [
    "Get your photos",
    "After the shoot, pay the balance and get a private link to your edited photo album.",
  ],
];

export default async function Graduation() {
  const { data: events } = await db()
    .from("events")
    .select("*")
    .in("status", VISIBLE)
    .order("created_at", { ascending: false });
  return (
    <main className="bg-white text-black">
      <section className="bg-[#f3eee7] px-5 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className={eyebrow}>Graduation photography</p>
          <h1 className={`${h1} mt-5`}>
            Your convocation, photographed your way.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-black/60 md:text-base md:leading-8">
            Choose the photographer whose work you love, pick a time that suits
            your ceremony and book with a small advance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 md:px-12 md:py-20">
        <h2 className="text-xl font-light uppercase tracking-[0.18em] md:text-2xl">
          Graduations
        </h2>
        {!events?.length ? (
          <p className="mt-6 border border-dashed border-black/20 p-8 text-sm text-black/55">
            No graduations are listed right now. New universities are added as
            dates are confirmed. Check back soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/graduation/${e.slug}`}
                className="group border border-[#dbcfc1] bg-[#f8f4ef] p-6 transition hover:-translate-y-1 hover:border-[#9b5b2b] hover:shadow-xl md:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-2xl font-normal uppercase leading-tight tracking-[0.08em] md:text-3xl">
                    {e.university}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.18em] ${e.status === "open" ? "bg-black text-white" : "bg-[#9b5b2b]/10 text-[#9b5b2b]"}`}
                  >
                    {STATUS[e.status as EventStatus].label}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-[#9b5b2b]">
                  {e.name}
                </p>
                <p className="mt-4 text-sm leading-7 text-black/60">
                  {e.event_dates.map(fmtDate).join(" · ") ||
                    "Dates to be announced"}
                  <br />
                  {e.venue}
                  <br />
                  Advance to book: {lkr(e.advance_lkr)}
                </p>
                <span className="mt-5 inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9b5b2b]">
                  {e.status === "open"
                    ? "Choose photographer"
                    : "See photographers"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-black/10 px-5 py-16 md:px-12">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <div key={t}>
              <p className="text-3xl font-extralight text-[#9b5b2b]">{i + 1}</p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.12em]">
                {t}
              </p>
              <p className="mt-2 text-sm leading-6 text-black/55">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
