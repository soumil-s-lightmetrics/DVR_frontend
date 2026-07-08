import type { Metadata } from "next";
import "./mv.css";

export const metadata: Metadata = {
  title: "Dashcam Mount Analyzer",
  description: "Upload a dashcam image to check if it's mounted correctly.",
};

export default function MountingVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* React 19 hoists this to <head>; mv.css falls back to "Inter". */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      />
      {children}
    </div>
  );
}
