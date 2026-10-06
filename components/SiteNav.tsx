"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { services } from "@/lib/services";
import { signOut } from "@/lib/actions/session";
import SubmitButton from "@/components/SubmitButton";

type NavUser = { role: "client" | "photographer" | "admin"; name: string } | null;
const account = {
  admin: { href: "/admin", label: "Admin" },
  photographer: { href: "/photographer", label: "My work" },
  client: { href: "/account", label: "My bookings" },
};

export default function SiteNav({ user }: { user: NavUser }) {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const overlay = path === "/" && !scrolled;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setMenu(false); setOpen(false); }, [path]);

  const text = overlay ? "text-white/85 hover:text-white" : "text-black/70 hover:text-black";
  const link = `text-xs font-medium uppercase tracking-[0.25em] transition ${text}`;
  const acct = user ? account[user.role] : null;
  // One account button: "Sign in" when signed out (the login page also offers Create account),
  // otherwise the role's area: Admin, My work or My bookings.
  const acctBtn = `px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    overlay ? "bg-white text-black hover:bg-[#f0c58f]" : "bg-black text-white hover:bg-[#9b5b2b]"
  }`;

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 px-5 py-3 transition-colors duration-300 md:px-12 md:py-4 ${
          overlay ? "bg-transparent" : "border-b border-black/10 bg-white/95 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6">
          <Link href="/" aria-label="Fourmen Events home" className="relative block h-12 w-24 md:h-16 md:w-32">
            <NextImage
              src="/fourmen-logo.png" alt="Fourmen Events" fill priority
              className={`object-contain object-left ${overlay ? "brightness-0 invert" : "brightness-0"}`}
            />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <Link href="/" className={link}>Home</Link>
            <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
              <button className={`${link} flex items-center gap-1`} aria-expanded={open} onClick={() => setOpen(!open)}>
                Services <ChevronDown size={14} />
              </button>
              {open && (
                <div className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3">
                  <div className="border border-black/10 bg-white p-2 shadow-xl">
                    {services.map((s) => (
                      <Link key={s.slug} href={s.href} className="flex items-center justify-between px-4 py-3 text-xs uppercase tracking-[0.15em] text-black/75 hover:bg-[#f3eee7]">
                        {s.title}
                        {!s.live && <span className="rounded-full bg-[#9b5b2b]/10 px-2 py-0.5 text-[9px] tracking-[0.12em] text-[#9b5b2b]">Soon</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/graduation" className={link}>Graduation</Link>
            <Link href="/photobooth" className={link}>Photobooth</Link>
            <Link href="/#contact" className={link}>Contact</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-5 lg:flex">
              {user ? (
                <>
                  <form action={signOut}><SubmitButton className={link}>Sign out</SubmitButton></form>
                  <Link href={acct!.href} className={acctBtn}>{acct!.label}</Link>
                </>
              ) : (
                <Link href="/login" className={acctBtn}>Sign in</Link>
              )}
            </div>
            <Link
              href="/join-us"
              title="Photographers: work with Fourmen"
              className={`hidden border px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition sm:block md:px-7 md:text-xs ${
                overlay ? "border-white text-white hover:bg-white hover:text-black" : "border-black text-black hover:bg-black hover:text-white"
              }`}
            >
              Join us
            </Link>
            <button className={`lg:hidden ${overlay ? "text-white" : "text-black"}`} aria-label="Menu" onClick={() => setMenu(!menu)}>
              {menu ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {menu && (
          <div className="mt-3 max-h-[80vh] overflow-y-auto border-t border-black/10 bg-white px-1 py-4 text-black lg:hidden">
            <Link href="/" className="block py-3 text-xs uppercase tracking-[0.25em]">Home</Link>
            <p className="pt-3 text-[10px] uppercase tracking-[0.3em] text-black/40">Services</p>
            {services.map((s) => (
              <Link key={s.slug} href={s.href} className="flex items-center justify-between py-3 text-xs uppercase tracking-[0.2em]">
                {s.title}
                {!s.live && <span className="rounded-full bg-[#9b5b2b]/10 px-2 py-0.5 text-[9px] text-[#9b5b2b]">Soon</span>}
              </Link>
            ))}
            <Link href="/#contact" className="block py-3 text-xs uppercase tracking-[0.25em]">Contact</Link>
            <div className="mt-3 flex flex-wrap gap-3 border-t border-black/10 pt-4">
              {user ? (
                <>
                  <Link href={acct!.href} className="bg-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">{acct!.label}</Link>
                  <form action={signOut}><SubmitButton className="px-3 py-3 text-[10px] uppercase tracking-[0.2em] text-black/60">Sign out</SubmitButton></form>
                </>
              ) : (
                <Link href="/login" className="bg-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">Sign in</Link>
              )}
              <Link href="/join-us" className="basis-full pt-2 text-[10px] uppercase tracking-[0.2em] text-[#9b5b2b] underline">Photographers: join us</Link>
            </div>
          </div>
        )}
      </nav>
      {path !== "/" && <div className="h-[72px] md:h-24" />}
    </>
  );
}
