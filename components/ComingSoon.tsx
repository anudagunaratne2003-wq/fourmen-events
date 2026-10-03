import NextImage from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { services, waLink } from "@/lib/services";
import { btnDark, btnLine, eyebrow, h1 } from "@/lib/ui";

export default function ComingSoon({ slug }: { slug: string }) {
  const s = services.find((x) => x.slug === slug)!;
  return (
    <main className="bg-white text-black">
      <section className="relative h-[46vh] min-h-[320px]">
        <NextImage src={s.image} alt={s.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-5 pb-10 text-white md:px-12">
          <span className="inline-block rounded-full bg-[#f0c58f]/20 px-4 py-1 text-[10px] uppercase tracking-[0.25em] text-[#f0c58f]">Coming soon</span>
          <h1 className={`${h1} mt-4`}>{s.title}</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-12 md:py-24">
        <div>
          <p className={eyebrow}>What it is</p>
          <p className="mt-4 text-base leading-8 text-black/65">{s.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={waLink(`Hi Fourmen Events, I'd like to hear when ${s.title} launches.`)} className={btnDark}>Notify me on WhatsApp</a>
            <Link href="/graduation" className={btnLine}>See live services</Link>
          </div>
        </div>
        <div className="border border-[#dbcfc1] bg-[#f8f4ef] p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">What to expect</p>
          <div className="mt-5 space-y-4">
            {s.expect?.map((e) => (
              <div key={e} className="flex gap-3 text-sm leading-7 text-black/65">
                <CheckCircle2 size={17} className="mt-1 shrink-0 text-[#9b5b2b]" />{e}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
