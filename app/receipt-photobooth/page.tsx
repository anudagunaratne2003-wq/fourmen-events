import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Receipt Photo Booth (coming soon)" };
export default function Page() {
  return <ComingSoon slug="receipt-photobooth" />;
}
