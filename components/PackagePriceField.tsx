"use client";
import { useState } from "react";
import { lkr, SERVICE_FEE_LKR } from "@/lib/format";
import { input, label } from "@/lib/ui";

/** The photographer types their own price; the price clients see (plus the Fourmen fee) updates as they type. */
export default function PackagePriceField({ base, idPrefix }: { base?: number | null; idPrefix: string }) {
  const [value, setValue] = useState(base != null ? String(base) : "");
  const n = Math.round(Number(value));
  const valid = value !== "" && n >= 0;
  return (
    <div>
      <label className={label} htmlFor={`${idPrefix}-base`}>Your package price (LKR), what you receive</label>
      <input id={`${idPrefix}-base`} name="base_price" type="number" min={0} step={100} required inputMode="numeric"
        value={value} onChange={(e) => setValue(e.target.value)} className={input} placeholder="e.g. 18000" />
      <p className="mt-2 text-sm text-black/60" aria-live="polite">
        {valid
          ? <>Clients see <b className="text-[#9b5b2b]">{lkr(n + SERVICE_FEE_LKR)}</b>, which includes the {lkr(SERVICE_FEE_LKR)} Fourmen Events service fee.</>
          : <>A {lkr(SERVICE_FEE_LKR)} Fourmen Events service fee is added to your price.</>}
      </p>
    </div>
  );
}
