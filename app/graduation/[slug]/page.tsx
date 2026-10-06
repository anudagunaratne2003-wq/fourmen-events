import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/supabase/admin";
import { publicName } from "@/lib/reveal";
import { portfolioUrl } from "@/lib/storage";
import { fmtDate, lkr } from "@/lib/format";
import { eyebrow, h1 } from "@/lib/ui";
import { STATUS, VISIBLE, type EventStatus } from "@/lib/events";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = db();
  const { data: ev } = await d.from("events").select("*").eq("slug", slug).in("status", VISIBLE).maybeSingle();
  if (!ev) notFound();
  const { data: links } = await d.from("event_photographers").select("photographer_id").eq("event_id", ev.id);
  const ids = (links ?? []).map((l) => l.photographer_id);
  const [{ data: phs }, { data: pkgs }, { data: imgs }, { data: slots }] = await Promise.all([
    d.from("photographers").select("id, alias, style").in("id", ids).eq("active", true).not("terms_accepted_at", "is", null).order("alias"),
    d.from("packages").select("photographer_id, price_lkr").in("photographer_id", ids).eq("active", true),
    d.from("portfolio_images").select("photographer_id, path").in("photographer_id", ids).order("created_at", { ascending: false }),
    d.from("slots").select("photographer_id").eq("event_id", ev.id).eq("status", "open").gte("slot_date", new Date().toISOString().slice(0, 10)),
  ]);

  return (
    <main className="bg-white text-black">
      <section className="bg-[#f3eee7] px-5 py-14 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Link href="/graduation" className="text-xs uppercase tracking-[0.2em] text-black/50 hover:text-[#9b5b2b]">← All graduations</Link>
          <p className={`${eyebrow} mt-6`}>Graduation photography</p>
          <h1 className={`${h1} mt-4`}>{ev.university}</h1>
          <p className="mt-3 text-base font-medium uppercase tracking-[0.2em] text-[#9b5b2b] md:text-lg">{ev.name}</p>
          <p className="mt-5 text-sm leading-7 text-black/60">
            {ev.event_dates.map(fmtDate).join(" · ")}{ev.venue ? ` · ${ev.venue}` : ""}<br />Advance to book: {lkr(ev.advance_lkr)}
          </p>
          {STATUS[ev.status as EventStatus].banner && <p className="mt-5 max-w-2xl bg-black px-4 py-3 text-sm text-white">{STATUS[ev.status as EventStatus].banner}</p>}
          {ev.ceremony_note && <p className="mt-5 max-w-2xl border-l-4 border-[#9b5b2b] bg-white px-4 py-3 text-sm text-black/70">{ev.ceremony_note}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-12 md:py-20">
        <h2 className="text-xl font-light uppercase tracking-[0.18em] md:text-2xl">Choose your photographer</h2>
        {!phs?.length ? (
          <p className="mt-6 text-sm text-black/55">Photographers for this event will appear here soon.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {phs.map((p) => {
              const mine = (pkgs ?? []).filter((k) => k.photographer_id === p.id);
              const pics = (imgs ?? []).filter((i) => i.photographer_id === p.id).slice(0, 3);
              const open = (slots ?? []).filter((s) => s.photographer_id === p.id).length;
              return (
                <Link key={p.id} href={`/graduation/${slug}/${p.id}`} className="group flex flex-col border border-[#dbcfc1] bg-[#f8f4ef] p-5 transition hover:-translate-y-1 hover:border-[#9b5b2b] hover:shadow-xl">
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((n) => (
                      <div key={n} className="aspect-square bg-[#e9dfd2]">
                        {pics[n] && (/* eslint-disable-next-line @next/next/no-img-element */
                          <img src={portfolioUrl(pics[n].path)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                  <h3 className="mt-5 text-xl font-light uppercase tracking-[0.12em]">{publicName(p)}</h3>
                  <p className="mt-1 flex-1 text-sm text-black/55">{p.style}</p>
                  <p className="mt-4 text-sm text-black/65">
                    {mine.length ? `From ${lkr(Math.min(...mine.map((k) => k.price_lkr)))} · ${mine.length} package${mine.length > 1 ? "s" : ""}` : "Packages coming soon"}
                  </p>
                  <p className="text-xs text-black/45">{open} open time{open === 1 ? "" : "s"}</p>
                  <span className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9b5b2b]">View portfolio and book</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
