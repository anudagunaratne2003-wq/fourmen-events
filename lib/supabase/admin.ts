import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Service-role client. Bypasses RLS. Only ever import this from server code,
 *  and only after checking the user's role and ownership of the record. */
export function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
