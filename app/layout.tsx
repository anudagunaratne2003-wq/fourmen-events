import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Fourmen Events", template: "%s · Fourmen Events" },
  description: "Photo booths, graduation photography and event experiences across Sri Lanka.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-black">
        <SiteNav user={user ? { role: user.role, name: user.name } : null} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
