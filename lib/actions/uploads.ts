"use server";
import { getUser, getPhotographer } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";

// Edited photos are no longer stored here: photographers share a link to their own cloud album instead.
export type UploadKind = "proof" | "portfolio";
const BUCKET: Record<UploadKind, string> = { proof: "proofs", portfolio: "portfolio" };
const clean = (n: string) => n.replace(/[^\w.\-]+/g, "_").slice(-80);

/** Checks the caller is allowed to upload, then returns a one-time signed upload target.
 *  The browser sends the file straight to storage, so files never pass through our server. */
export async function prepareUpload(input: { kind: UploadKind; fileName: string }) {
  const user = await getUser();
  if (!user) return { error: "Please sign in first." };
  if (!(input.kind in BUCKET)) return { error: "Uploads of this kind are not supported." };
  const d = db();
  const id = crypto.randomUUID();
  let path = "";

  if (input.kind === "proof") {
    path = `${user.id}/${id}-${clean(input.fileName)}`;
  } else {
    const p = user.role === "photographer" ? await getPhotographer(user) : null;
    if (!p) return { error: "Only photographers can add portfolio photos." };
    path = `${p.id}/${id}-${clean(input.fileName)}`;
  }

  const { data, error } = await d.storage.from(BUCKET[input.kind]).createSignedUploadUrl(path);
  if (error || !data) return { error: "Could not start the upload. Try again." };
  return { bucket: BUCKET[input.kind], path, token: data.token };
}
