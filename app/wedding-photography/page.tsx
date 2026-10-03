import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Wedding Photography (coming soon)" };
export default function Page() {
  return <ComingSoon slug="wedding-photography" />;
}
