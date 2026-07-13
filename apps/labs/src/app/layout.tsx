import type { Metadata } from "next";

// Minimal root layout — intentionally imports NO global CSS and renders no
// chrome, so each route group (site / mounting-verification / dvr-request-flow)
// owns its own styles and layout without bleeding into the others.
export const metadata: Metadata = {
  title: "LM Labs",
  icons: { icon: "/images/lmlabs.webp" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
