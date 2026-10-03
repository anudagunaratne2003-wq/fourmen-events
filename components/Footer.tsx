import Link from "next/link";
import { services } from "@/lib/services";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white px-5 py-12 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:justify-between">
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.22em] text-black/55 md:text-xs">
          {services.map((s) => (
            <Link key={s.slug} href={s.href} className="transition hover:text-[#9b5b2b]">{s.title}</Link>
          ))}
          <Link href="/join-us" className="text-[#9b5b2b] transition hover:text-black">Photographers: work with us</Link>
        </div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-black/45 md:text-xs md:tracking-[0.3em]">
          © 2026 Fourmen Events. Crafted for premium memories.
        </p>
      </div>
    </footer>
  );
}
