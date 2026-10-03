import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUser, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

/** Lands Google sign-ins, sign-up confirmation links and password reset links. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const safe = safeNext(searchParams.get("next"));
  // "expired": link too old or already used. "browser": a ?code= link opened in a different browser than the one that asked for it.
  const fail = (why: "expired" | "browser" = "expired") =>
    NextResponse.redirect(`${origin}/login?error=${why}${type === "recovery" ? "&mode=forgot" : ""}${safe ? `&next=${encodeURIComponent(safe)}` : ""}`);

  if (searchParams.get("error")) return fail();
  const sb = await createClient();
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return fail(/verifier/i.test(error.message) ? "browser" : "expired");
  } else if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail();
  }
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  const dest = type === "recovery" ? "/reset-password" : safe || homeFor(user.role);
  return NextResponse.redirect(`${origin}${dest}`);
}
