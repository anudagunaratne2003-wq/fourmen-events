"use client";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

const heroImages = ["/hero/hero-1.jpg", "/hero/hero-2.jpg", "/hero/hero-3.jpg", "/hero/hero-4.jpg", "/hero/hero-5.jpg"];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((c) => (c + 1) % heroImages.length), 4500);
    return () => clearInterval(t);
  }, []);
  const next = () => setActive((c) => (c + 1) % heroImages.length);
  const prev = () => setActive((c) => (c - 1 + heroImages.length) % heroImages.length);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {heroImages.map((image, index) => (
        <div key={image} className={`absolute inset-0 transition-all duration-1000 ${index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}>
          <NextImage src={image} alt={`Fourmen Events hero ${index + 1}`} fill priority={index === 0} className="object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20 md:bg-gradient-to-r md:from-black/75 md:via-black/25 md:to-transparent" />

      <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-[1500px] items-center px-5 pt-24 md:px-12">
        <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl text-white">
          <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-white/70 md:text-xs md:tracking-[0.45em]">
            Fourmen Events · Photography and photobooth experiences
          </p>
          <h1 className="text-4xl font-light uppercase leading-[1.12] tracking-[0.12em] sm:text-5xl md:text-7xl md:tracking-[0.16em]">
            Make every event unforgettable.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/75 md:mt-8 md:text-base md:leading-8">
            Photo booths, graduation photography and more, for weddings, corporate events, birthdays and university celebrations across Sri Lanka.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
            <Link href="#services" className="bg-white px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition duration-300 hover:-translate-y-1 hover:bg-[#9b5b2b] hover:text-white md:px-8 md:text-xs">
              Our Services
            </Link>
            <Link href="/graduation" className="border border-white px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-black md:px-8 md:text-xs">
              Book Graduation Photos
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 right-5 z-30 flex gap-3 md:bottom-10 md:right-10">
        <button onClick={prev} aria-label="Previous slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-white backdrop-blur-md transition hover:bg-white hover:text-black md:h-12 md:w-12"><ArrowLeft size={18} /></button>
        <button onClick={next} aria-label="Next slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 text-white backdrop-blur-md transition hover:bg-white hover:text-black md:h-12 md:w-12"><ArrowRight size={18} /></button>
      </div>
      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2 md:bottom-10">
        {heroImages.map((_, i) => (
          <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => setActive(i)} className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
        ))}
      </div>
    </section>
  );
}
