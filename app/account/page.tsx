import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/admin";
import { requireUser, homeFor } from "@/lib/auth";
import { fmtDate, fmtTime, stageLabel } from "@/lib/format";
import { h2 } from "@/lib/ui";

export const metadata: Metadata = { title: "My bookings" };

export default async function Account() {
  const user = await requireUser("/account");
  if (user.role !== "client") redirect(homeFor(user.role));
  const { data: bookings } = await db().from("bookings")
    .select("*, events(name, university), slots(slot_date, start_time), photographers(display_name)")
    .eq("client_id", user.id).order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 md:py-20">
      <h1 className={h2}>My bookings</h1>
      <p className="mt-3 text-sm text-black/55">Signed in as {user.email}</p>
      {!bookings?.length ? (
        <div className="mt-10 border border-dashed border-black/20 p-8 text-sm text-black/60">
          You have no bookings yet. <Link href="/graduation" className="text-[#9b5b2b] underline">Book graduation photography</Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {bookings.map((b) => (
            <Link key={b.id} href={`/account/bookings/${b.id}`} className="flex flex-col gap-2 border border-[#dbcfc1] bg-[#f8f4ef] p-5 transition hover:border-[#9b5b2b] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em]">{b.events?.university}</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">{b.events?.name} · {b.ref}</p>
                <p className="mt-1 text-lg font-light uppercase tracking-[0.1em]">{b.package_name}</p>
                <p className="text-sm text-black/55">{b.slots ? `${fmtDate(b.slots.slot_date)}, ${fmtTime(b.slots.start_time)}` : "Time released"}</p>
              </div>
              <span className="w-fit rounded-full bg-[#9b5b2b]/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#9b5b2b]">{stageLabel(b)}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
