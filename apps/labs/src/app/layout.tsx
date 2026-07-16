import type { Metadata } from "next";

// Minimal root layout — intentionally imports NO global CSS and renders no
// chrome, so each route group (site / mounting-verification / dvr-request-flow)
// owns its own styles and layout without bleeding into the others.
export const metadata: Metadata = {
  title: "LM Labs",
  icons: { icon: "/images/lmlabs-favicon.png" },
};

// Every route is meant to require a valid session (see middleware.ts). Without
// this, pages with no dynamic data get prerendered as static HTML with a
// long-lived Cache-Control; on Amplify's CloudFront-fronted compute hosting,
// a cached hit is served straight from the edge and never reaches the origin
// — meaning middleware (and the auth check) never runs at all.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
