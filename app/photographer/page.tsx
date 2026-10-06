import Link from "next/link";
import { requireRole, getPhotographer } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { fmtDate, fmtTime, firstName, lkr, stageLabel, fullyPaid } from "@/lib/format";
import { portfolioUrl } from "@/lib/storage";
import { publicName } from "@/lib/reveal";
import { PortfolioUploader } from "@/components/ActionUploaders";
import { joinEvent, leaveEvent, createSlots, setSlotStatus, deleteSlot, markShootDone, saveAlbumLink, savePackage, deletePackage, deletePortfolioImage, saveBankDetails } from "@/lib/actions/photographer";
import { btnSmall, btnSmallDark, h2, input, label } from "@/lib/ui";
import SubmitButton from "@/components/SubmitButton";
import BankFields from "@/components/BankFields";

const box = "border border-[#dbcfc1] bg-[#f8f4ef] p-6";
const sec = "mt-14";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ event?: string; msg?: string }> }) {
  const sp = await searchParams;
  const user = await requireRole("photographer");
  const p = await getPhotographer(user);
  if (!p) return <main className="mx-auto max-w-3xl px-5 py-20 text-sm">Your photographer profile is not set up yet. Please contact Fourmen Events.</main>;

  const d = db();
  const { data: links } = await d.from("event_photographers").select("events(id, slug, name, university, event_dates, slot_minutes, status)").eq("photographer_id", p.id);
  const events = (links ?? []).map((l) => l.events as unknown as { id: string; slug: string; name: string; university: string; event_dates: string[]; slot_minutes: number; status: string }).filter(Boolean);
  const ev = events.find((e) => e.id === sp.event) ?? events[0];
  const { data: openEvents } = await d.from("events").select("id, name, university, event_dates").neq("status", "closed").order("created_at", { ascending: false });
  const joinable = (openEvents ?? []).filter((e) => !events.some((x) => x.id === e.id));

  const [{ data: slots }, { data: bookings }, { data: pkgs }, { data: imgs }, { data: bank }] = await Promise.all([
    ev ? d.from("slots").select("*").eq("event_id", ev.id).eq("photographer_id", p.id).order("slot_date").order("start_time") : Promise.resolve({ data: [] as never[] }),
    d.from("bookings").select("*, events(name, university), slots(slot_date, start_time)").eq("photographer_id", p.id).neq("advance_status", "rejected").order("created_at", { ascending: false }),
    d.from("packages").select("*").eq("photographer_id", p.id).order("price_lkr"),
    d.from("portfolio_images").select("id, path").eq("photographer_id", p.id).order("created_at", { ascending: false }),
    d.from("photographer_bank_accounts").select("bank_name, branch, account_name, account_number, updated_at").eq("photographer_id", p.id).maybeSingle(),
  ]);
  const dates = [...new Set((slots ?? []).map((s) => s.slot_date))];

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 md:px-12 md:py-16">
      <h1 className={h2}>Hello, {p.display_name}</h1>
      <p className="mt-2 text-sm text-black/55">Manage your times, packages, portfolio and client albums.</p>
      <p className="mt-2 text-sm text-black/55">Clients see you as <b className="font-medium text-[#9b5b2b]">{publicName(p)}</b>. Fourmen shares your real name and phone with each client after their advance is approved, on dates set by the team.</p>
      {!bank && (
        <a href="#payout" className="mt-4 block border-l-4 border-[#9b5b2b] bg-[#f3eee7] px-4 py-3 text-sm text-black/75 hover:bg-[#ede5da]">
          Add your bank details under <b>Payout details</b> so Fourmen Events can transfer your earnings. →
        </a>
      )}

      {/* ---------- Availability ---------- */}
      <section className={sec} id="availability">
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">My availability</h2>
        {joinable.length > 0 && (
          <div className={`${box} mt-5`}>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#9b5b2b]">Events you can join</p>
            <div className="divide-y divide-black/10 bg-white">
              {joinable.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span><b className="font-semibold">{e.university}</b> <span className="text-black/45">· {e.name}{e.event_dates?.length ? ` · ${e.event_dates.map(fmtDate).join(", ")}` : ""}</span></span>
                  <form action={joinEvent}><input type="hidden" name="event" value={e.id} /><SubmitButton className={btnSmallDark}>Join and add times</SubmitButton></form>
                </div>
              ))}
            </div>
          </div>
        )}
        {!events.length ? <p className="mt-4 text-sm text-black/55">{joinable.length ? "Join an event above to start adding your available times." : "There are no events to join yet."}</p> : (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {events.map((e) => (
                <Link key={e.id} href={`/photographer?event=${e.id}`} className={`border px-4 py-2 text-xs uppercase tracking-[0.14em] ${e.id === ev.id ? "border-black bg-black text-white" : "border-black/20 hover:border-[#9b5b2b]"}`}><b className="font-semibold">{e.university}</b> · {e.name}</Link>
              ))}
              <form action={leaveEvent} className="ml-auto"><input type="hidden" name="event" value={ev.id} /><SubmitButton className={btnSmall} danger confirm={`Leave ${ev.university} · ${ev.name}?`} confirmDetail="Your open time slots for this event are removed and students can no longer book you for it.">Leave this event</SubmitButton></form>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <form action={createSlots} className={`${box} grid gap-3`}>
                <input type="hidden" name="event" value={ev.id} />
                <p className="text-sm text-black/60">Tell us when you can shoot. We split it into {ev.slot_minutes}-minute slots.</p>
                <div><label className={label} htmlFor="date">Date</label><input id="date" name="date" type="date" required defaultValue={ev.event_dates[0]} className={input} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={label} htmlFor="from">From</label><input id="from" name="from" type="time" required defaultValue="08:00" className={input} /></div>
                  <div><label className={label} htmlFor="until">Until</label><input id="until" name="until" type="time" required defaultValue="13:00" className={input} /></div>
                </div>
                <SubmitButton className={btnSmallDark}>Create slots</SubmitButton>
                <p className="text-xs text-black/45">Times you add here are bookable straight away once the event is open.</p>
              </form>
              <div className={box}>
                {!dates.length ? <p className="text-sm text-black/55">No slots yet for this event.</p> : dates.map((dt) => (
                  <div key={dt} className="mb-6 last:mb-0">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#9b5b2b]">{fmtDate(dt)}</p>
                    <div className="divide-y divide-black/10 bg-white">
                      {slots!.filter((s) => s.slot_date === dt).map((s) => (
                        <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                          <span>{fmtTime(s.start_time)} <span className="text-black/40">· {s.status === "booked" ? "Booked by a client" : s.status === "blocked" ? "Marked unavailable" : "Open"}</span></span>
                          {s.status !== "booked" && (
                            <span className="flex gap-2">
                              <form action={setSlotStatus}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="event" value={ev.id} /><input type="hidden" name="status" value={s.status === "open" ? "blocked" : "open"} /><SubmitButton className={btnSmall}>{s.status === "open" ? "Mark unavailable" : "Reopen"}</SubmitButton></form>
                              <form action={deleteSlot}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="event" value={ev.id} /><SubmitButton className={btnSmall}>Remove</SubmitButton></form>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---------- Bookings and album links ---------- */}
      <section className={sec} id="bookings">
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">My bookings and albums</h2>
        {!bookings?.length ? <p className="mt-4 text-sm text-black/55">No bookings yet.</p> : (
          <div className="mt-5 space-y-5">
            {bookings.map((b) => (
              <div key={b.id} className={box}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em]">{b.events?.university}</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">{b.events?.name} · {b.ref}</p>
                    <p className="mt-1 text-lg font-light uppercase tracking-[0.1em]">{firstName(b.client_name)} · {b.package_name}</p>
                    <p className="text-sm text-black/55">{b.slots ? `${fmtDate(b.slots.slot_date)}, ${fmtTime(b.slots.start_time)}` : ""}{b.degree ? ` · ${b.degree}` : ""}</p>
                    {b.notes && <p className="mt-1 text-sm text-black/55">Notes: {b.notes}</p>}
                    <p className="mt-1 text-sm text-black/45">Package {lkr(b.package_price)}. Fourmen coordinates with the client for you.</p>
                  </div>
                  <span className="rounded-full bg-[#9b5b2b]/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#9b5b2b]">{stageLabel(b)}</span>
                </div>
                {b.advance_status === "approved" && (
                  <div className="mt-5 grid gap-5 border-t border-black/10 pt-5 md:grid-cols-2">
                    <div>
                      {!b.shoot_done ? (
                        <form action={markShootDone}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="event" value={sp.event ?? ""} />
                          <SubmitButton className={btnSmallDark} confirm="Mark this shoot as done?" confirmDetail="Use this once the shoot has happened. It keeps your bookings list up to date.">Mark shoot as done</SubmitButton>
                          <p className="mt-2 text-xs text-black/50">{fullyPaid(b) ? "The client has already paid in full." : "The client can pay the balance any time, before or after the shoot."}</p></form>
                      ) : <p className="text-sm text-black/60">Shoot done. {fullyPaid(b) ? "Paid in full. The client can open the album once you add the link." : "Waiting for the client's balance payment."}</p>}
                    </div>
                    <form action={saveAlbumLink} className="grid gap-2">
                      <input type="hidden" name="id" value={b.id} /><input type="hidden" name="event" value={sp.event ?? ""} />
                      <label className={label} htmlFor={`album-${b.id}`}>Edited album share link</label>
                      <input id={`album-${b.id}`} name="album_url" type="url" inputMode="url" defaultValue={b.album_url ?? ""} placeholder="https://drive.google.com/…" className={input} />
                      <label className={label} htmlFor={`note-${b.id}`}>Note for the client (optional, e.g. album password)</label>
                      <input id={`note-${b.id}`} name="album_note" maxLength={500} defaultValue={b.album_note ?? ""} className={input} />
                      <div className="flex flex-wrap items-center gap-3">
                        <SubmitButton className={btnSmallDark}>{b.album_url ? "Update link" : "Save link"}</SubmitButton>
                        {b.album_url && <a href={b.album_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9b5b2b] underline">Test link ↗</a>}
                      </div>
                      <p className="text-xs leading-5 text-black/50">
                        {b.photos_ready_emailed_at ? `The client was emailed that their album is ready on ${fmtDate(b.photos_ready_emailed_at.slice(0, 10))}. ` : b.album_url ? "Saved. The client sees it once they have paid in full, and we email them then. " : ""}
                        Upload the edited photos to Google Drive, Dropbox, OneDrive or similar, create a share link that lets anyone with the link view and download, and paste it here. Only this client sees it, after paying in full. Clear the box and save to remove the link.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Payout details ---------- */}
      <section className={sec} id="payout">
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">Payout details</h2>
        <p className="mb-4 mt-2 max-w-2xl text-sm text-black/55">
          The bank account Fourmen Events transfers your earnings to. Only you and the Fourmen team can see it, never clients.
          We email you whenever these details change.
        </p>
        <form action={saveBankDetails} className={`${box} grid max-w-3xl gap-4`}>
          <BankFields bank={bank} idPrefix="me" />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton className={btnSmallDark} pendingText="Saving…">{bank ? "Update payout details" : "Save payout details"}</SubmitButton>
            {bank?.updated_at && <span className="text-xs text-black/45">Last updated {fmtDate(bank.updated_at.slice(0, 10))}</span>}
          </div>
        </form>
      </section>

      {/* ---------- Packages ---------- */}
      <section className={sec} id="packages">
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">My packages</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {(pkgs ?? []).map((k) => (
            <details key={k.id} className={box}>
              <summary className="cursor-pointer text-lg font-light uppercase tracking-[0.1em]">{k.name} <span className="text-[#9b5b2b]">· {lkr(k.price_lkr)}</span></summary>
              <PackageForm k={k} />
              <form action={deletePackage} className="mt-3"><input type="hidden" name="id" value={k.id} /><SubmitButton className={btnSmall} danger confirm={`Delete the ${k.name} package?`} confirmDetail="Students will no longer be able to choose it. Existing bookings keep their package.">Delete package</SubmitButton></form>
            </details>
          ))}
          <details className={box} open={!pkgs?.length}>
            <summary className="cursor-pointer text-lg font-light uppercase tracking-[0.1em]">+ New package</summary>
            <PackageForm />
          </details>
        </div>
      </section>

      {/* ---------- Portfolio ---------- */}
      <section className={sec} id="portfolio">
        <h2 className="text-xl font-light uppercase tracking-[0.16em]">My portfolio</h2>
        <p className="mb-4 mt-2 text-sm text-black/55">These photos appear on your public profile. Add your best work.</p>
        <PortfolioUploader />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {(imgs ?? []).map((i) => (
            <div key={i.id} className="group relative aspect-square bg-[#f3eee7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portfolioUrl(i.path)} alt="" className="h-full w-full object-cover" />
              <form action={deletePortfolioImage} className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-center opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100"><input type="hidden" name="id" value={i.id} /><SubmitButton className="text-[10px] uppercase tracking-[0.2em] text-white" pendingText="Removing…" danger confirm="Remove this photo from your portfolio?">Remove</SubmitButton></form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function PackageForm({ k }: { k?: { id: string; name: string; price_lkr: number; description: string | null; inclusions: string[] } }) {
  return (
    <form action={savePackage} className="mt-4 grid gap-3">
      {k && <input type="hidden" name="id" value={k.id} />}
      <div><label className={label}>Name</label><input name="name" required defaultValue={k?.name} className={input} placeholder="e.g. Solo Portrait" /></div>
      <div><label className={label}>Price (LKR)</label><input name="price" type="number" min={0} required defaultValue={k?.price_lkr} className={input} /></div>
      <div><label className={label}>Short description</label><input name="description" defaultValue={k?.description ?? ""} className={input} /></div>
      <div><label className={label}>What is included (one per line)</label><textarea name="inclusions" rows={5} defaultValue={k?.inclusions.join("\n")} className={input} placeholder={"30-minute session\n25 edited photos\nOnline gallery"} /></div>
      <SubmitButton className={btnSmallDark}>Save package</SubmitButton>
    </form>
  );
}
