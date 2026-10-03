import NextImage from "next/image";
import Link from "next/link";
import { CalendarCheck, Mail, Phone } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import { services } from "@/lib/services";
import { btnDark, btnLine, eyebrow, h2 } from "@/lib/ui";

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-black">
      <HeroCarousel />

      <section
        id="services"
        className="bg-[#f3eee7] px-5 py-20 md:px-12 md:py-28 lg:px-20"
      >
        <div className="mx-auto max-w-7xl">
          <p className={`${eyebrow} text-center`}>What we do</p>
          <h2 className={`${h2} mt-5 text-center`}>
            Our products and services.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-7 text-black/55 md:text-base md:leading-8">
            Two services are open for booking today. The rest are on the way.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={s.href}
                className="group relative flex flex-col overflow-hidden border border-[#dbcfc1] bg-[#f8f4ef] transition duration-500 hover:-translate-y-2 hover:border-[#9b5b2b] hover:shadow-2xl hover:shadow-[#9b5b2b]/10"
              >
                <div
                  className={`relative h-56 overflow-hidden ${s.image.endsWith(".png") ? "bg-white" : ""}`}
                >
                  <NextImage
                    src={s.image}
                    alt={s.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className={`transition duration-700 group-hover:scale-105 ${s.image.endsWith(".png") ? "object-contain object-bottom p-4" : "object-cover"}`}
                  />
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${s.live ? "bg-[#1c120c] text-[#f0c58f]" : "bg-white/90 text-[#9b5b2b]"}`}
                  >
                    {s.live ? "Book now" : "Coming soon"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-light uppercase tracking-[0.12em]">
                    {s.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-7 text-black/55">
                    {s.blurb}
                  </p>
                  <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9b5b2b]">
                    {s.live ? "Explore" : "Learn more"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1c120c] px-5 py-20 text-white md:px-12 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#e2b27c] md:text-xs">
              Graduation season
            </p>
            <h2 className={`${h2} mt-5`}>
              Choose your photographer by their work.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 md:text-base md:leading-8">
              Browse real portfolios, compare packages, pick a time on your
              convocation day and secure it with a small advance.
            </p>
            <Link
              href="/graduation"
              className="mt-8 inline-block bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:-translate-y-1 hover:bg-[#9b5b2b] hover:text-white md:text-xs"
            >
              Book graduation photos
            </Link>
          </div>
          <div className="relative h-72 md:h-96">
            <NextImage
              src="/events/university.jpg"
              alt="Graduation photo session"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="bg-white px-5 py-20 md:px-12 md:py-28 lg:px-20"
      >
        <div className="mx-auto grid max-w-7xl gap-6 border border-black/10 bg-[#f8f5f1] p-5 md:p-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-white p-6 md:p-8">
            <CalendarCheck className="text-[#9b5b2b]" size={36} />
            <h2 className="mt-7 text-3xl font-light uppercase tracking-[0.1em] md:text-4xl md:tracking-[0.12em]">
              Let&apos;s plan your event.
            </h2>
            <p className="mt-5 text-sm leading-7 text-black/60 md:text-base md:leading-8">
              Tell us what you need and we will help you choose the right
              service.
            </p>
            <div className="mt-7 space-y-4 text-sm text-black/70 md:text-base">
              <p className="flex items-center gap-3">
                <Phone size={18} className="text-[#9b5b2b]" /> +94 71 979 9448
              </p>
              <p className="flex items-center gap-3">
                <Mail size={18} className="text-[#9b5b2b]" />{" "}
                fourmen.events26@gmail.com
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 bg-white p-6 md:p-8">
            <p className="text-sm leading-7 text-black/60">
              Looking for a photo booth? Send a booking request from the
              Photobooth page.
            </p>
            <Link href="/photobooth#booking" className={btnDark}>
              Book Timberbooth
            </Link>
            <Link href="/graduation" className={btnLine}>
              Book graduation photography
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
