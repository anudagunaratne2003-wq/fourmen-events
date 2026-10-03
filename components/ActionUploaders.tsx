"use client";
import { useRouter } from "next/navigation";
import Uploader from "@/components/Uploader";
import { submitBalance } from "@/lib/actions/booking";
import { registerPortfolioImage } from "@/lib/actions/photographer";
import { useState } from "react";

export function BalanceUploader({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  return (
    <div>
      <Uploader kind="proof" accept="image/*,application/pdf" maxMB={10} label="Upload balance receipt"
        onUploaded={async (f) => { const r = await submitBalance(bookingId, f[0].path); if (r.error) setErr(r.error); else router.refresh(); }} />
      {err && <p className="mt-2 text-sm text-red-700" role="alert">{err}</p>}
    </div>
  );
}

export function PortfolioUploader() {
  const router = useRouter();
  return (
    <Uploader kind="portfolio" multiple parallel={3} accept="image/*" maxMB={15} label="Add portfolio photos"
      onEach={async (f) => (await registerPortfolioImage(f.path)).error}
      onUploaded={() => router.refresh()} />
  );
}
