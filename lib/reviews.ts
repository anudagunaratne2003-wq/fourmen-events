import "server-only";
import { db } from "@/lib/supabase/admin";

export type Summary = { avg: number; count: number };

/** Average rating and number of visible reviews for each photographer. */
export async function ratingSummaries(photographerIds: string[]) {
  const map = new Map<string, Summary>();
  if (!photographerIds.length) return map;
  const { data } = await db().from("reviews").select("photographer_id, rating").in("photographer_id", photographerIds).eq("hidden", false);
  for (const r of data ?? []) {
    const s = map.get(r.photographer_id) ?? { avg: 0, count: 0 };
    s.avg = (s.avg * s.count + r.rating) / (s.count + 1);
    s.count += 1;
    map.set(r.photographer_id, s);
  }
  return map;
}

/** Recent visible reviews for a photographer, with the reviewer's first name and university only. */
export async function recentReviews(photographerId: string, limit = 20) {
  const { data } = await db().from("reviews")
    .select("id, rating, comment, created_at, bookings(client_name, events(university))")
    .eq("photographer_id", photographerId).eq("hidden", false)
    .order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r) => {
    const b = r.bookings as unknown as { client_name: string; events: { university: string } | null } | null;
    return { id: r.id, rating: r.rating, comment: r.comment as string | null, created_at: r.created_at as string,
      who: [(b?.client_name ?? "").trim().split(/\s+/)[0] || "Client", b?.events?.university].filter(Boolean).join(" · ") };
  });
}
