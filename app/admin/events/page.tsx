import { db } from "@/lib/supabase/admin";
import { fmtDate, lkr } from "@/lib/format";
import { saveEvent, setEventPhotographers, setEventStatus } from "@/lib/actions/admin";
import { STATUS, type EventStatus } from "@/lib/events";
import { btnSmall, btnSmallDark, h2, input, label } from "@/lib/ui";
import SubmitButton from "@/components/SubmitButton";

type Ev = { id: string; slug: string; university: string; name: string; venue: string | null; event_dates: string[]; advance_lkr: number; slot_minutes: number; payment_instructions: string | null; ceremony_note: string | null; status: string; reveal_name_on: string | null; reveal_phone_on: string | null };

function EventForm({ e, bookings = 0 }: { e?: Ev; bookings?: number }) {
  return (
    <form action={saveEvent} className="mt-4 grid gap-3 md:grid-cols-2">
      {e && <input type="hidden" name="id" value={e.id} />}
      <div><label className={label}>University</label><input name="university" required defaultValue={e?.university} className={input} /></div>
      <div><label className={label}>Event name</label><input name="name" required defaultValue={e?.name} className={input} placeholder="Convocation 2026" /></div>
      <div><label className={label}>Web address (slug){e && " · changing it breaks links already shared"}</label><input name="slug" required defaultValue={e?.slug} className={input} placeholder="uoc-convocation-2026" /></div>
      <div><label className={label}>Venue</label><input name="venue" defaultValue={e?.venue ?? ""} className={input} /></div>
      <div><label className={label}>Dates (YYYY-MM-DD, separated by commas){e && " · removing a date keeps its slots"}</label><input name="dates" defaultValue={e?.event_dates.join(", ")} className={input} placeholder="2026-11-14, 2026-11-15" /></div>
      <div className="grid grid-cols-2 gap-3">
        {e && bookings > 0 && <p className="col-span-2 text-xs text-[#9b5b2b]">{bookings} existing booking{bookings === 1 ? "" : "s"} keep their original advance. Changes apply to new bookings and new slots.</p>}
        <div><label className={label}>Advance (LKR)</label><input name="advance" type="number" min={0} defaultValue={e?.advance_lkr ?? 5000} className={input} /></div>
        <div><label className={label}>Slot length (min)</label><input name="slot_minutes" type="number" min={10} max={240} defaultValue={e?.slot_minutes ?? 45} className={input} /></div>
      </div>
      <div className="md:col-span-2"><label className={label}>Payment instructions (bank details)</label><textarea name="payment" rows={3} defaultValue={e?.payment_instructions ?? ""} className={input} /></div>
      <div className="md:col-span-2"><label className={label}>Notice for students (e.g. ceremony times not announced yet). Leave empty for none.</label><input name="ceremony" defaultValue={e?.ceremony_note ?? ""} className={input} /></div>
      <div className="md:col-span-2 grid gap-3 border-t border-black/10 pt-3 sm:grid-cols-2">
        <p className="text-xs text-black/50 sm:col-span-2">Clients see each photographer&apos;s stage name. Their real name and phone are shown to a client only after that client&apos;s advance is approved and these dates arrive. Leave empty to keep them hidden. You can override per booking on the Payments page.</p>
        <div><label className={label}>Reveal photographer names on</label><input name="reveal_name_on" type="date" defaultValue={e?.reveal_name_on ?? ""} className={input} /></div>
        <div><label className={label}>Reveal photographer phone numbers on</label><input name="reveal_phone_on" type="date" defaultValue={e?.reveal_phone_on ?? ""} className={input} /></div>
      </div>
      <div><label className={label}>Status</label>
        <select name="status" defaultValue={e?.status ?? "draft"} className={input}>{(Object.keys(STATUS) as EventStatus[]).map((k) => <option key={k} value={k}>{STATUS[k].label} ({STATUS[k].admin.toLowerCase()})</option>)}</select></div>
      <div className="flex items-end"><SubmitButton className={btnSmallDark}>{e ? "Save changes" : "Create event"}</SubmitButton></div>
    </form>
  );
}

export default async function EventsAdmin() {
  const d = db();
  const [{ data: events }, { data: phs }, { data: links }, { data: bks }] = await Promise.all([
    d.from("events").select("*").order("created_at", { ascending: false }),
    d.from("photographers").select("id, display_name, terms_accepted_at").eq("active", true).order("display_name"),
    d.from("event_photographers").select("event_id, photographer_id"),
    d.from("bookings").select("event_id").neq("advance_status", "rejected"),
  ]);
  const bookingCount = (id: string) => (bks ?? []).filter((b) => b.event_id === id).length;
  return (
    <>
      <h1 className={h2}>Graduation events</h1>
      <p className="mb-6 mt-2 text-sm text-black/55">Add a new university here. No code changes needed.</p>
      <details className="border border-[#dbcfc1] bg-white p-6" open={!events?.length}>
        <summary className="cursor-pointer text-lg font-light uppercase tracking-[0.1em]">+ New event</summary>
        <EventForm />
      </details>
      <div className="mt-6 space-y-4">
        {(events ?? []).map((e) => {
          const chosen = new Set((links ?? []).filter((l) => l.event_id === e.id).map((l) => l.photographer_id));
          return (
            <div key={e.id} className="border border-[#dbcfc1] bg-white p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div><p className="text-lg font-semibold uppercase tracking-[0.1em]">{e.university}</p><p className="text-xs uppercase tracking-[0.2em] text-[#9b5b2b]">{e.name}</p></div>
                <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${e.status === "open" ? "bg-green-700 text-white" : e.status === "paused" ? "bg-amber-600 text-white" : "bg-black/10 text-black/60"}`}>{STATUS[e.status as EventStatus]?.label ?? e.status}</span>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-black/65 sm:grid-cols-2">
                <div><dt className="inline text-black/45">Dates: </dt><dd className="inline">{e.event_dates.length ? e.event_dates.map(fmtDate).join(" · ") : "not set"}</dd></div>
                <div><dt className="inline text-black/45">Venue: </dt><dd className="inline">{e.venue || "not set"}</dd></div>
                <div><dt className="inline text-black/45">Advance: </dt><dd className="inline">{lkr(e.advance_lkr)}</dd></div>
                <div><dt className="inline text-black/45">Slot length: </dt><dd className="inline">{e.slot_minutes} min</dd></div>
                <div><dt className="inline text-black/45">Page: </dt><dd className="inline">/graduation/{e.slug}</dd></div>
                <div><dt className="inline text-black/45">Bookings: </dt><dd className="inline">{bookingCount(e.id)}</dd></div>
              </dl>
              <StatusControls e={e} />
              <details className="group mt-5 border-t border-black/10 pt-4">
              <summary className={`${btnSmall} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}><span className="group-open:hidden">Edit details (dates, advance, venue, bank details…)</span><span className="hidden group-open:inline">Close editor</span></summary>
              <EventForm e={e} bookings={bookingCount(e.id)} />
              <form action={setEventPhotographers} className="mt-6 border-t border-black/10 pt-5">
                <input type="hidden" name="event" value={e.id} />
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#9b5b2b]">Photographers shooting this event</p>
                <div className="flex flex-wrap gap-4">
                  {(phs ?? []).map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="photographer" value={p.id} defaultChecked={chosen.has(p.id)} /> {p.display_name}{!p.terms_accepted_at && <span className="text-xs text-amber-700">(terms not accepted, hidden from clients)</span>}</label>
                  ))}
                  {!phs?.length && <span className="text-sm text-black/45">Add photographers first.</span>}
                </div>
                <SubmitButton className={`${btnSmallDark} mt-4`}>Save photographers</SubmitButton>
              </form>
              </details>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** One-click booking controls plus the notice line students see on the event page. */
function StatusControls({ e }: { e: Ev }) {
  const actions: { to: EventStatus; text: string; dark?: boolean }[] = [
    { to: "open", text: "Open bookings", dark: true },
    { to: "paused", text: "Pause bookings" },
    { to: "upcoming", text: "Opening soon" },
    { to: "closed", text: "Close event" },
    { to: "draft", text: "Hide (draft)" },
  ];
  return (
    <form action={setEventStatus} className="mt-4 grid gap-3">
      <input type="hidden" name="id" value={e.id} />
      <p className="text-xs text-black/50">Now: <b className="font-medium text-black/70">{STATUS[e.status as EventStatus]?.admin ?? e.status}</b>. Existing bookings are never affected.</p>
      <div>
        <label className={label} htmlFor={`notice-${e.id}`}>Notice shown to students (leave empty for none)</label>
        <input id={`notice-${e.id}`} name="notice" maxLength={300} defaultValue={e.ceremony_note ?? ""} className={input} placeholder="e.g. Ceremony times not announced yet. We will confirm your exact time by WhatsApp." />
      </div>
      <div className="flex flex-wrap gap-2">
        {/* First in the form so pressing Enter in the notice box only saves the notice; shown last. */}
        <SubmitButton name="status" value="" className={`${btnSmall} order-last border-black/30 text-black/60`}>Save notice only</SubmitButton>
        {actions.filter((a) => a.to !== e.status).map((a) => (
          <SubmitButton key={a.to} name="status" value={a.to} className={a.dark ? btnSmallDark : btnSmall}
            confirm={a.to === "closed" ? `Close ${e.university} · ${e.name}?` : a.to === "draft" ? `Hide ${e.university} · ${e.name} from the public?` : undefined}
            confirmDetail="Students will no longer see it or be able to book. Existing bookings are not affected." danger={a.to === "closed"}>{a.text}</SubmitButton>
        ))}
      </div>
    </form>
  );
}
