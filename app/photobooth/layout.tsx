import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Booth",
  description: "Sri Lanka's elegant Timberbooth photobooth experience, with print and keepsake packages.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
