"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies text to the clipboard and confirms it, e.g. bank details for a transfer. */
export default function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed"); // clipboard blocked (old browser or insecure page): the text is still selectable
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return (
    <button type="button" onClick={copy} aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${className}`}>
      {state === "copied" ? <Check size={13} /> : <Copy size={13} />}
      {state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : label}
    </button>
  );
}
