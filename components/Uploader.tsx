"use client";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
import { prepareUpload, type UploadKind } from "@/lib/actions/uploads";

export type Uploaded = { path: string; name: string; mime: string; size: number };

type Props = {
  kind: UploadKind; accept: string; multiple?: boolean; maxMB: number;
  label: string;
  /** How many files upload at the same time. */
  parallel?: number;
  /** Runs right after each file lands, so finished files are saved even if a later one fails. Return an error message to flag that file. */
  onEach?: (file: Uploaded) => Promise<string | void>;
  /** Runs once at the end with every file that succeeded. */
  onUploaded?: (files: Uploaded[]) => void | Promise<void>;
};

/** Sends files straight from the browser to storage using a one-time signed link. */
export default function Uploader({ kind, accept, multiple, maxMB, label, parallel = 1, onEach, onUploaded }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function uploadOne(f: File): Promise<Uploaded> {
    if (f.size > maxMB * 1024 * 1024) throw new Error(`${f.name}: larger than ${maxMB} MB.`);
    const t = await prepareUpload({ kind, fileName: f.name });
    if ("error" in t && t.error) throw new Error(`${f.name}: ${t.error}`);
    const { error } = await browserClient().storage.from(t.bucket!).uploadToSignedUrl(t.path!, t.token!, f, { contentType: f.type || undefined });
    if (error) {
      const tooBig = /size|payload|413/i.test(`${error.message} ${(error as { statusCode?: string }).statusCode ?? ""}`);
      throw new Error(`${f.name}: ${tooBig ? "too large for storage. Compress it or split it into smaller files." : "upload failed. Check your connection and try again."}`);
    }
    const up = { path: t.path!, name: f.name, mime: f.type, size: f.size };
    const err = await onEach?.(up);
    if (err) throw new Error(`${f.name}: ${err}`);
    return up;
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setErrors([]); setBusy(true);
    const done: Uploaded[] = [], failed: string[] = [];
    let next = 0;
    const report = () => setStatus(`Uploading… ${done.length + failed.length} of ${files.length} finished`);
    report();
    // A few uploads at once: much faster for big batches without flooding a mobile connection.
    await Promise.all(Array.from({ length: Math.min(parallel, files.length) }, async () => {
      while (next < files.length) {
        const f = files[next++];
        try { done.push(await uploadOne(f)); } catch (err) { failed.push(err instanceof Error ? err.message : `${f.name}: upload failed.`); }
        report();
      }
    }));
    try { if (done.length) await onUploaded?.(done); } catch { failed.push("Saved the files, but could not refresh. Reload the page."); }
    setStatus(done.length ? (done.length === 1 ? `Uploaded: ${done[0].name}` : `${done.length} files uploaded`) : "");
    setErrors(failed);
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div>
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple} onChange={onChange} />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()}
        className="flex w-full items-center justify-center gap-3 border border-dashed border-black/30 bg-white px-4 py-5 text-xs uppercase tracking-[0.18em] text-black/70 transition hover:border-[#9b5b2b] hover:text-[#9b5b2b] disabled:opacity-50">
        <Upload size={16} /> {busy ? "Uploading…" : label}
      </button>
      {status && <p className="mt-2 text-sm text-[#5c3b24]" role="status">{status}</p>}
      {errors.length > 0 && (
        <div className="mt-2 text-sm text-red-700" role="alert">
          <p>{errors.length === 1 ? "1 file was not uploaded:" : `${errors.length} files were not uploaded:`}</p>
          <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5">{errors.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
