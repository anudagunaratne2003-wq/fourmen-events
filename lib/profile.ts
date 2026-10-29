import "server-only";
import { db } from "@/lib/supabase/admin";
import { SERVICE_FEE_LKR } from "@/lib/format";

/** Shared by the photographer dashboard and the admin "Manage profile" page, so both follow the same rules. */

export type PackageRow = { name: string; base_price_lkr: number; price_lkr: number; description: string | null; inclusions: string[] };

/** Reads the package form. The photographer's own price is entered; the Fourmen fee is always added here. */
export function parsePackageForm(fd: FormData): { row: PackageRow } | { error: string } {
  const name = String(fd.get("name") || "").trim().slice(0, 80);
  const base = Math.round(Number(fd.get("base_price")));
  if (!name || !(base >= 0)) return { error: "Give the package a name and the photographer's price." };
  return {
    row: {
      name, base_price_lkr: base, price_lkr: base + SERVICE_FEE_LKR,
      description: String(fd.get("description") || "").trim().slice(0, 300) || null,
      inclusions: String(fd.get("inclusions") || "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 30),
    },
  };
}

export async function savePackageFor(photographerId: string, packageId: string | null, row: PackageRow) {
  const d = db();
  const { error } = packageId
    ? await d.from("packages").update(row).eq("id", packageId).eq("photographer_id", photographerId)
    : await d.from("packages").insert({ ...row, photographer_id: photographerId });
  return error ? { error: "Could not save the package." } : {};
}

export async function deletePackageFor(photographerId: string, packageId: string) {
  await db().from("packages").delete().eq("id", packageId).eq("photographer_id", photographerId);
}

/** Records an uploaded portfolio photo. The file must sit in that photographer's own folder. */
export async function addPortfolioImageFor(photographerId: string, path: string) {
  if (!path.startsWith(photographerId + "/")) return { error: "Invalid file." };
  await db().from("portfolio_images").insert({ photographer_id: photographerId, path });
  return {};
}

export async function deletePortfolioImageFor(photographerId: string, imageId: string) {
  const d = db();
  const { data: img } = await d.from("portfolio_images").select("id, path").eq("id", imageId).eq("photographer_id", photographerId).maybeSingle();
  if (img) { await d.storage.from("portfolio").remove([img.path]); await d.from("portfolio_images").delete().eq("id", img.id); }
}
