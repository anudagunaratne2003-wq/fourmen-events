import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Photographer dashboard" };
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireRole("photographer");
  return children;
}
