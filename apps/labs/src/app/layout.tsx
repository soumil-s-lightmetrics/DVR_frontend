import type { Metadata } from "next";
import { SiteHeader } from "./SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "LM Labs: LM's home for AI experiments",
  description: "Try our AI experiments and discover LM's newest technologies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
