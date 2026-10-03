"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Uploader, { type Uploaded } from "@/components/Uploader";
import { createBooking } from "@/lib/actions/booking";
import { fmtDate, fmtTime, lkr, splitPayment } from "@/lib/format";
import { btnDark, input, label as lbl } from "@/lib/ui";

type Pkg = { id: string; name: string; price: number; description: string | null; inclusions: string[] };
type Slot = { id: string; date: string; start: string };
type Props = {
  eventId: string; photographerId: string; photographerName: string; advance: number;
  payment: string | null; ceremonyNote: string | null; packages: Pkg[]; slots: Slot[];
  user: { name: string; email: string; phone: string } | null;
};

export default function BookingFlow(p: Props) {
  const router = useRouter();
  const path = usePathname();
  const dates = useMemo(() => [...new Set(p.slots.map((s) => s.date))], [p.slots]);
  const [pkgId, setPkgId] = useState("");
  const [date, setDate] = useState(dates[0] ?? "");
  const [slotId, setSlotId] = useState("");
  const [f, setF] = useState({ name: p.user?.name ?? "", phone: p.user?.phone ?? "", email: p.user?.email ?? "", degree: "", notes: "" });
  const [proof, setProof] = useState<Uploaded | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Restore the choice the student made before signing in.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fm-sel");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.p !== p.photographerId) return;
      sessionStorage.removeItem("fm-sel");
      if (p.packages.some((x) => x.id === s.pkg)) setPkgId(s.pkg);
      if (p.slots.some((x) => x.id === s.slot)) { setSlotId(s.slot); setDate(s.date); }
    } catch { /* ignore */ }
  }, [p.photographerId, p.packages, p.slots]);

  const pkg = p.packages.find((x) => x.id === pkgId);
  const slot = p.slots.find((x) => x.id === slotId);
  const ready = !!pkg && !!slot;
  const pay = splitPayment(pkg?.price ?? 0, p.advance);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function signIn(mode: "signup" | "signin") {
    try { sessionStorage.setItem("fm-sel", JSON.stringify({ p: p.photographerId, pkg: pkgId, slot: slotId, date })); } catch { /* ignore */ }
    router.push(`/login?mode=${mode}&next=${encodeURIComponent(path)}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pkg || !slot) return;
    if (!proof) return setError("Upload your advance payment proof first.");
    setBusy(true); setError("");
    const r = await createBooking({ eventId: p.eventId, photographerId: p.photographerId, packageId: pkg.id, slotId: slot.id, ...f, proofPath: proof.path });
    if (r.error || !r.id) { setError(r.error ?? "Something went wrong."); setBusy(false); return; }
    router.push(`/account/bookings/${r.id}?new=1`);
  }

  if (!p.packages.length) return <p className="text-sm text-black/55">{p.photographerName} has not published packages yet.</p>;

  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-lg font-light uppercase tracking-[0.16em]">1. Choose a package</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Packages">
          {p.packages.map((k) => {
            const on = k.id === pkgId;
            return (
              <button key={k.id} role="radio" aria-checked={on} onClick={() => setPkgId(k.id)}
                className={`relative flex flex-col border p-6 text-left transition hover:-translate-y-1 ${on ? "border-[#5c3b24] bg-[#1c120c] text-white shadow-xl" : "border-[#dbcfc1] bg-[#f8f4ef] hover:border-[#9b5b2b]"}`}>
                <span className={`text-[10px] uppercase tracking-[0.3em] ${on ? "text-[#e2b27c]" : "text-[#9b5b2b]"}`}>{on ? "Selected" : "Package"}</span>
                <span className="mt-3 text-xl font-light uppercase tracking-[0.1em]">{k.name}</span>
                <span className={`mt-2 text-2xl font-light tracking-[0.06em] ${on ? "text-[#f0c58f]" : "text-[#9b5b2b]"}`}>{lkr(k.price)}</span>
                {k.description && <span className={`mt-3 text-sm leading-6 ${on ? "text-white/60" : "text-black/55"}`}>{k.description}</span>}
                <span className="mt-5 space-y-3">
                  {k.inclusions.map((x) => (
                    <span key={x} className={`flex gap-3 text-sm leading-6 ${on ? "text-white/75" : "text-black/65"}`}>
                      <CheckCircle2 size={16} className={`mt-1 shrink-0 ${on ? "text-[#d6a06a]" : "text-[#9b5b2b]"}`} />{x}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-light uppercase tracking-[0.16em]">2. Pick a time</h3>
        {p.ceremonyNote && <p className="mt-3 border-l-4 border-[#9b5b2b] bg-[#f3eee7] px-4 py-3 text-sm text-black/70">{p.ceremonyNote}</p>}
        {dates.length === 0 ? (
          <p className="mt-4 text-sm text-black/55">No open times yet. Check back soon, {p.photographerName} adds availability as it is confirmed.</p>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {dates.map((d) => (
                <button key={d} onClick={() => { setDate(d); setSlotId(""); }}
                  className={`border px-4 py-2 text-xs uppercase tracking-[0.15em] ${d === date ? "border-black bg-black text-white" : "border-black/20 bg-white hover:border-[#9b5b2b]"}`}>
                  {fmtDate(d)}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {p.slots.filter((s) => s.date === date).map((s) => (
                <button key={s.id} onClick={() => setSlotId(s.id)} aria-pressed={s.id === slotId}
                  className={`border px-2 py-3 text-sm transition ${s.id === slotId ? "border-[#9b5b2b] bg-[#9b5b2b] text-white" : "border-[#9b5b2b]/50 bg-white hover:bg-[#f3eee7]"}`}>
                  {fmtTime(s.start)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-black/45">First come, first served. A time is yours once you send your booking.</p>
          </>
        )}
      </div>

      {ready && (
        <div>
          <h3 className="text-lg font-light uppercase tracking-[0.16em]">3. Confirm and pay the advance</h3>
          <div className="mt-5 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="h-fit border border-[#dbcfc1] bg-[#f8f4ef] p-6 text-sm leading-7">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#9b5b2b]">Your booking</p>
              <p className="mt-3 font-medium">{p.photographerName} · {pkg!.name}</p>
              <p className="text-black/65">{fmtDate(slot!.date)}, {fmtTime(slot!.start)}</p>
              <div className="mt-4 space-y-1 border-t border-black/10 pt-4">
                <p className="flex justify-between"><span>Package</span><span>{lkr(pkg!.price)}</span></p>
                <p className="flex justify-between font-medium text-[#9b5b2b]"><span>Advance due now</span><span>{lkr(pay.advance)}</span></p>
                <p className="flex justify-between text-black/55"><span>Balance after your shoot (package − advance)</span><span>{lkr(pay.balance)}</span></p>
              </div>
              {p.payment && <p className="mt-4 whitespace-pre-line border-t border-black/10 pt-4 text-black/70">{p.payment}</p>}
            </div>

            {!p.user ? (
              <div className="flex flex-col justify-center gap-4 border border-black/10 bg-white p-6">
                <p className="text-sm leading-7 text-black/65">Create a free account to send your booking. It takes a minute, and your selection is kept.</p>
                <button onClick={() => signIn("signup")} className={btnDark}>Create account to continue</button>
                <button onClick={() => signIn("signin")} className="text-xs uppercase tracking-[0.2em] text-black/55 underline">Already have an account? Sign in</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 border border-black/10 bg-white p-6">
                <div><label className={lbl} htmlFor="n">Full name</label><input id="n" className={input} required value={f.name} onChange={set("name")} /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className={lbl} htmlFor="ph">Phone (WhatsApp)</label><input id="ph" className={input} required value={f.phone} onChange={set("phone")} /></div>
                  <div><label className={lbl} htmlFor="em">Email</label><input id="em" type="email" className={input} required value={f.email} onChange={set("email")} /></div>
                </div>
                <div><label className={lbl} htmlFor="dg">Degree and faculty</label><input id="dg" className={input} required value={f.degree} onChange={set("degree")} /></div>
                <div><label className={lbl} htmlFor="nt">Notes (optional)</label><textarea id="nt" className={`${input} min-h-20`} value={f.notes} onChange={set("notes")} /></div>
                <div>
                  <span className={lbl}>Advance payment proof ({lkr(pay.advance)})</span>
                  <Uploader kind="proof" accept="image/*,application/pdf" maxMB={10} label={proof ? "Replace file" : "Upload receipt or screenshot"} onUploaded={(x) => setProof(x[0])} />
                </div>
                {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
                <button disabled={busy} className={btnDark}>{busy ? "Sending…" : "Send booking"}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
