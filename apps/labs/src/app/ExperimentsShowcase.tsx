"use client";

import { motion } from "motion/react";
import { Terminal, BarChart3 } from "lucide-react";
import { ExperimentCard, type ExperimentCardProps } from "@lmlabs/ui";

// URL of the deployed mounting-verification app. In dev it runs on :3001;
// set NEXT_PUBLIC_MOUNTING_VERIFICATION_URL in prod (e.g. its Amplify domain).
const MOUNTING_VERIFICATION_URL =
  process.env.NEXT_PUBLIC_MOUNTING_VERIFICATION_URL || "http://localhost:3001";

// URL of the deployed dvr-request-flow app. In dev it runs on :3002;
// set NEXT_PUBLIC_DVR_REQUEST_URL in prod (e.g. its Amplify domain).
const DVR_REQUEST_URL =
  process.env.NEXT_PUBLIC_DVR_REQUEST_URL || "http://localhost:3002";

const FEATURED: ExperimentCardProps[] = [
  {
    category: "create",
    title: "Agentic DVR Requests",
    description: "Request dashcam DVR videos through a chat agent — describe the trip and it fetches the footage for you.",
    cta: "Try it now",
    href: DVR_REQUEST_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/dvr-request.svg"
        alt="Requesting DVR videos via chat"
        className="h-full w-full object-cover"
      />
    ),
  },
  {
    category: "explore",
    title: "Video Intelligence",
    description: "Search and question hours of cabin and road video in plain language — e.g. find drivers not wearing a safety vest — and surface the exact clips instantly.",
    cta: "Try it now",
    href: "https://videorag.sdo.lightmetrics.co/",
    target: "_blank",
    style: { background: "#ffffff" },
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/video-intelligence.svg"
        alt="Searching video with a chatbot in plain language"
        className="h-full w-full object-cover"
      />
    ),
  },
  {
    category: "explore",
    title: "Mounting Verification",
    description: "Upload a dashcam image and instantly check if the camera is mounted correctly for video evidence and ADAS.",
    cta: "Try it now",
    href: MOUNTING_VERIFICATION_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/mounting-verification.svg"
        alt="Dashcam mounting preview"
        className="h-full w-full object-cover"
      />
    ),
  },
  {
    category: "create",
    title: "Jules",
    description: "An async coding agent that fixes bugs and ships features while you focus elsewhere.",
    cta: "Try it now",
    media: (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-900 to-black p-6">
        <div className="flex h-full w-[80%] flex-col overflow-hidden rounded-2xl border-4 border-white/20 bg-neutral-950 shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <Terminal className="h-3 w-3 text-emerald-400" />
            <span className="h-2 w-16 rounded-full bg-white/15" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-3 font-mono">
            <div className="h-2 w-1/3 rounded-full bg-purple-400/80" />
            <div className="h-2 w-2/3 rounded-full bg-emerald-400/80" />
            <div className="h-2 w-1/2 rounded-full bg-sky-400/80" />
            <div className="h-2 w-3/4 rounded-full bg-white/25" />
            <div className="h-2 w-2/5 rounded-full bg-emerald-400/80" />
          </div>
        </div>
      </div>
    ),
  },
  {
    category: "create",
    title: "Vantage",
    description: "An AI-powered tool for understanding complex data at a glance.",
    cta: "Learn more",
    media: (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 p-6">
        <div className="flex h-full w-[78%] flex-col overflow-hidden rounded-2xl border-4 border-neutral-900/90 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
            <span className="h-2 w-14 rounded-full bg-neutral-200" />
          </div>
          <div className="flex flex-1 items-end gap-2">
            {[40, 65, 45, 80, 55].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-sky-300"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

const CARD_WIDTH = 340;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};

export function ExperimentsShowcase() {
  const topRow = FEATURED.slice(0, 2);
  const bottomRow = FEATURED.slice(2, 5);

  return (
    <section id="experiments" className="relative pt-8 pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-0 h-[416px] w-[416px] rounded-full bg-indigo-300/50 blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-[480px] w-[480px] rounded-full bg-emerald-300/45 blur-[90px]"
      />

      <p className="relative z-10 mb-4 text-center text-lg text-[var(--gl-color-on-surface-subtle)]">
        Join us from day one.
      </p>
      <h2 className="relative z-10 mb-20 text-center text-[12rem] font-medium leading-tight text-black sm:text-[11rem]">
        Own the first experience
      </h2>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 mx-auto flex max-w-[1760px] flex-col items-center gap-8 px-10"
      >
        <div className="flex flex-nowrap justify-center gap-6">
          {topRow.map((f) => (
            <motion.div key={f.title} variants={item} className="flex" style={{ width: CARD_WIDTH }}>
              <ExperimentCard {...f} />
            </motion.div>
          ))}
        </div>
        <div className="flex flex-nowrap justify-center gap-6">
          {bottomRow.map((f) => (
            <motion.div key={f.title} variants={item} className="flex" style={{ width: CARD_WIDTH }}>
              <ExperimentCard {...f} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
