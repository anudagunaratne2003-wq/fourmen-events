import { redirect } from "next/navigation";

export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  redirect(`/login?mode=signup${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}
