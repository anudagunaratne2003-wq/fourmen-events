import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { portfolioUrl } from "@/lib/storage";
import { lkr } from "@/lib/format";
import Gallery from "@/components/Gallery";
import BookingFlow from "@/components/BookingFlow";
import { eyebrow, h1 } from "@/lib/ui";
import { publicName } from "@/lib/reveal";
import { STATUS, VISIBLE, type EventStatus } from "@/lib/events";

export default async function PhotographerPage({ params }: { params: Promise<{ slug: string; pid: string }> }) {
  const { slug, pid } = await params;
  const d = db();
  const { data: ev } = await d.from("events").select("*").eq("slug", slug).in("status", VISIBLE).maybeSingle();
  if (!ev) notFound();
  const { data: link } = await d.from("event_photographers").select("event_id").eq("event_id", ev.id).eq("photographer_id", pid).maybeSingle();
  const { data: ph } = await d.from("photographers").select("id, alias, style, bio").eq("id", pid).eq("active", true).not("terms_accepted_at", "is", null).maybeSingle();
  if (!link || !ph) notFound();

  const name = publicName(ph); // real names stay private until the admin reveals them per booking
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: imgs }, { data: pkgs }, { data: slots }, user] = await Promise.all([
    d.from("portfolio_images").select("path, caption").eq("photographer_id", pid).order("created_at", { ascending: false }),
    d.from("packages").select("*").eq("photographer_id", pid).eq("active", true).order("price_lkr"),
    d.from("slots").select("id, slot_date, start_time").eq("event_id", ev.id).eq("photographer_id", pid).eq("status", "open").gte("slot_date", today).order("slot_date").order("start_time"),
    getUser(),
  ]);

  return (
    <main className="bg-white text-black">
      <section className="bg-[#f3eee7] px-5 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Link href={`/graduation/${slug}`} className="text-xs uppercase tracking-[0.2em] text-black/50 hover:text-[#9b5b2b]">← <b className="font-semibold text-black/70">{ev.university}</b> · {ev.name}</Link>
          <p className={`${eyebrow} mt-6`}>Photographer</p>
          <h1 className={`${h1} mt-4`}>{name}</h1>
          {ph.style && <p className="mt-3 text-sm text-black/60">{ph.style}</p>}
          {ph.bio && <p className="mt-4 max-w-2xl text-sm leading-7 text-black/60">{ph.bio}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-12">
        <h2 className="mb-6 text-xl font-light uppercase tracking-[0.18em] md:text-2xl">Portfolio</h2>
        <Gallery name={name} images={(imgs ?? []).map((i) => ({ url: portfolioUrl(i.path), caption: i.caption }))} />
      </section>

      <section className="border-t border-black/10 bg-white px-5 py-14 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-xl font-light uppercase tracking-[0.18em] md:text-2xl">Book {name}</h2>
          {ev.status !== "open" ? (
            <div className="max-w-2xl space-y-3">
              <p className="bg-black px-5 py-4 text-sm text-white">{STATUS[ev.status as EventStatus].banner}</p>
              {ev.ceremony_note && <p className="border-l-4 border-[#9b5b2b] bg-[#f3eee7] px-4 py-3 text-sm text-black/70">{ev.ceremony_note}</p>}
              {!!pkgs?.length && <p className="text-sm text-black/60">Packages from {name}: {pkgs.map((k) => `${k.name} (${lkr(k.price_lkr)})`).join(" · ")}</p>}
            </div>
          ) : <BookingFlow
            eventId={ev.id} photographerId={ph.id} photographerName={name}
            advance={ev.advance_lkr} payment={ev.payment_instructions} ceremonyNote={ev.ceremony_note}
            packages={(pkgs ?? []).map((k) => ({ id: k.id, name: k.name, price: k.price_lkr, description: k.description, inclusions: k.inclusions }))}
            slots={(slots ?? []).map((s) => ({ id: s.id, date: s.slot_date, start: s.start_time }))}
            user={user && user.role === "client" ? { name: user.name, email: user.email, phone: user.phone ?? "" } : null}
          />}
          {user && user.role !== "client" && <p className="mt-6 text-sm text-black/55">You are signed in as {user.role}. Sign in with a client account to book.</p>}
        </div>
      </section>
    </main>
  );
}
