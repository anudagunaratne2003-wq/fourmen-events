import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return (
    <div className="bg-[#f3eee7]">
      <nav className="border-b border-black/10 bg-white px-5 py-3 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em]">
          <Link href="/admin" className="hover:text-[#9b5b2b]">Payments and bookings</Link>
          <Link href="/admin/events" className="hover:text-[#9b5b2b]">Events</Link>
          <Link href="/admin/photographers" className="hover:text-[#9b5b2b]">Photographers</Link>
          <Link href="/admin/team" className="hover:text-[#9b5b2b]">Admin team</Link>
        </div>
      </nav>
      <main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-10 md:px-12">{children}</main>
    </div>
  );
}
