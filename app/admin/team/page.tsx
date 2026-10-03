import { db } from "@/lib/supabase/admin";
import { envAdminEmails, getUser } from "@/lib/auth";
import Flash from "@/components/Flash";
import { addAdminEmail, removeAdminEmail } from "@/lib/actions/admin";
import { btnSmall, btnSmallDark, h2, input, label } from "@/lib/ui";

export default async function TeamAdmin({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const [me, { data: rows }] = await Promise.all([getUser(), db().from("admin_emails").select("email").order("email")]);
  const fixed = envAdminEmails();
  const extra = (rows ?? []).map((r) => r.email as string).filter((e) => !fixed.includes(e.toLowerCase()));
  return (
    <>
      <h1 className={h2}>Admin team</h1>
      <p className="mb-6 mt-2 text-sm text-black/55">
        Anyone signed in with one of these emails gets the admin panel. Photographers are managed on the Photographers page.
      </p>
      <Flash msg={msg} />
      <form action={addAdminEmail} className="flex flex-wrap items-end gap-3 border border-[#dbcfc1] bg-white p-6">
        <div className="min-w-0 flex-1"><label className={label} htmlFor="email">Give admin access to</label><input id="email" name="email" type="email" required className={input} placeholder="name@example.com" /></div>
        <button className={btnSmallDark}>Add admin</button>
      </form>
      <div className="mt-8 divide-y divide-black/10 border border-[#dbcfc1] bg-white">
        {fixed.map((e) => (
          <div key={e} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
            <p>{e}</p><span className="text-xs text-black/45">Set in ADMIN_EMAILS (server config)</span>
          </div>
        ))}
        {extra.map((e) => (
          <div key={e} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
            <p>{e}</p>
            {e.toLowerCase() === me?.email.toLowerCase() ? <span className="text-xs text-black/45">You</span> : (
              <form action={removeAdminEmail}><input type="hidden" name="email" value={e} /><button className={btnSmall}>Remove</button></form>
            )}
          </div>
        ))}
        {!fixed.length && !extra.length && <p className="px-5 py-6 text-sm text-black/45">No admins listed.</p>}
      </div>
    </>
  );
}
