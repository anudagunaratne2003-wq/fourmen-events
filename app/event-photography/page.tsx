import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Event Photography (coming soon)" };
export default function Page() {
  return <ComingSoon slug="event-photography" />;
}
