import type { Metadata } from "next";
import ApplyForm from "@/components/ApplyForm";
import { eyebrow, h1 } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Work with us",
  description: "Photographers: join Fourmen Events and get booked for graduations and events.",
};

const perks = [
  ["Get booked", "Students and clients find you through Fourmen and book your open time slots."],
  ["Your own dashboard", "Set your packages and prices, upload your portfolio and choose when you are available."],
  ["We handle the admin", "Fourmen checks payments and coordinates with clients, so you can focus on shooting."],
];

export default function JoinUs() {
  return (
    <main className="bg-white text-black">
      <section className="bg-[#f3eee7] px-5 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className={eyebrow}>For photographers</p>
          <h1 className={`${h1} mt-5`}>Shoot with Fourmen Events.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-black/60 md:text-base md:leading-8">
            Are you a photographer who would like to take bookings through us? Tell us about yourself and share your work. We review every application personally.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-16 md:px-12 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-8">
          {perks.map(([t, d], i) => (
            <div key={t}>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">0{i + 1}</p>
              <h2 className="mt-2 text-lg font-light uppercase tracking-[0.14em]">{t}</h2>
              <p className="mt-2 text-sm leading-7 text-black/60">{d}</p>
            </div>
          ))}
        </div>
        <ApplyForm />
      </section>
    </main>
  );
}
