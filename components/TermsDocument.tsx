import { TERMS } from "@/lib/terms";
import { fmtDate } from "@/lib/format";

/** The Photographer Terms & Conditions, laid out for reading. */
export default function TermsDocument() {
  return (
    <article className="text-sm leading-7 text-black/75">
      <p className="text-xs uppercase tracking-[0.2em] text-black/45">Version {TERMS.version} · effective {fmtDate(TERMS.effective)}</p>
      <p className="mt-4">{TERMS.intro}</p>
      <ol className="mt-6 space-y-6">
        {TERMS.sections.map((s, i) => (
          <li key={s.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-black">{i + 1}. {s.title}</h3>
            <ol className="mt-2 space-y-2">
              {s.clauses.map((c, j) => (
                <li key={j} className="flex gap-3"><span className="shrink-0 text-black/40 tabular-nums">{i + 1}.{j + 1}</span><span>{c}</span></li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </article>
  );
}
