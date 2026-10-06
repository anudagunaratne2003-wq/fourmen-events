"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

/** Shows the result of an action (the ?msg= our server actions redirect with) as a card pinned to the
 *  corner of the screen, so it is seen wherever the page is scrolled. Mounted once in the root layout. */
export default function Toast() {
  const params = useSearchParams();
  const msg = params.get("msg");
  const key = msg ? `${params.get("t") ?? ""}|${msg}` : null;
  const [shown, setShown] = useState<{ key: string; msg: string } | null>(null);
  const [seen, setSeen] = useState<string | null>(null);

  // A new message arrived: remember it (this is React's "adjust state while rendering" pattern).
  if (key && msg && key !== seen) {
    setSeen(key);
    setShown({ key, msg });
  }

  useEffect(() => {
    if (!shown) return;
    // Take the message out of the address bar so a refresh or a shared link does not show it again.
    const url = new URL(window.location.href);
    if (url.searchParams.has("msg")) {
      url.searchParams.delete("msg");
      url.searchParams.delete("t");
      window.history.replaceState(window.history.state, "", url);
    }
    const timer = setTimeout(() => setShown(null), 8000);
    return () => clearTimeout(timer);
  }, [shown]);

  if (!shown) return null;
  return (
    <div className="pointer-events-none fixed inset-x-4 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}>
      <div role="status" aria-live="polite" key={shown.key}
        className="pointer-events-auto flex w-full max-w-md animate-[toast-in_.25s_ease-out] items-start gap-3 border-l-4 border-[#9b5b2b] bg-white px-4 py-3 text-sm text-black/80 shadow-2xl ring-1 ring-black/10">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#9b5b2b]" aria-hidden="true" />
        <p className="flex-1 leading-6">{shown.msg}</p>
        <button type="button" onClick={() => setShown(null)} aria-label="Dismiss" className="shrink-0 text-black/40 hover:text-black">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
