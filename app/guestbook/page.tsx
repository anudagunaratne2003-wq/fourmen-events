import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Audio & Video Guestbook (coming soon)" };
export default function Page() {
  return <ComingSoon slug="guestbook" />;
}
