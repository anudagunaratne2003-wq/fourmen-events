import { NextResponse, type NextRequest } from "next/server";
import { processReveals } from "@/lib/email";

export const maxDuration = 60;

/** Daily job (see vercel.json): emails clients and photographers when a photographer's details are revealed.
 *  Vercel calls it with "Authorization: Bearer <CRON_SECRET>"; any other caller is refused. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await processReveals();
  return NextResponse.json({ ok: true, revealsAnnounced: sent });
}
