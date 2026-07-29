"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { ExperimentCard, type ExperimentCardProps } from "@lmlabs/ui";

// Both experiments now live inside this same app under path prefixes, so these
// are relative routes (full-page <a> navigation keeps each app's CSS isolated).
const MOUNTING_VERIFICATION_URL = "/mounting-verification";
const DVR_REQUEST_URL = "/dvr-request-flow";
// Video Intelligence portal is embedded (iframed) under this app rather than
// linking out to its separate deployment (videorag.sdo.lightmetrics.co).
const VIDEO_INTELLIGENCE_URL = "/video-intelligence";
const MCP_URL = "/mcp";
// Talk to Data links out to the existing RideView reports dashboard rather than
// a page inside this app.
const TALK_TO_DATA_URL = "https://dashboard.lightmetrics.co/reports?tab=overview";
// Agentic LISA is embedded (iframed) under this app, like Video Intelligence.
const AGENTIC_LISA_URL = "/agentic-lisa";

const FEATURED: ExperimentCardProps[] = [
  {
    category: "create",
    title: "Agentic DVR",
    subtitle: "Video requests, without the hunt.",
    description: "Find the right trip and pull the footage you need in a few plain-language steps.",
    cta: "Try it now",
    href: DVR_REQUEST_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/experiments/agentic-dvr.jpg"
        alt="Requesting DVR videos via chat"
        className="h-full w-full object-contain border-b border-[var(--gl-color-border)] bg-white"
      />
    ),
  },
  {
    category: "explore",
    title: "Video Search",
    subtitle: "Describe it, and find it.",
    description: "Video RAG that surfaces the clips you're looking for from a plain-language description — no filters, no tags.",
    cta: "Try it now",
    href: VIDEO_INTELLIGENCE_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/experiments/video-search.jpg"
        alt="Searching video with a chatbot in plain language"
        className="h-full w-full object-contain border-b border-[var(--gl-color-border)] bg-white"
      />
    ),
  },
  {
    category: "explore",
    title: "AI-Assisted Installation",
    subtitle: "Get the camera view right the first time.",
    description: "AI guides installers in near real-time, confirming whether the camera is positioned correctly before they leave the vehicle.",
    cta: "Try it now",
    href: MOUNTING_VERIFICATION_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/experiments/ai-assisted-installation.jpg"
        alt="Dashcam mounting preview"
        className="h-full w-full object-contain border-b border-[var(--gl-color-border)] bg-white"
      />
    ),
  },
  {
    category: "create",
    title: "Agentic LISA",
    subtitle: "Just ask your fleet data anything.",
    description: "A conversational assistant for discovering what matters — safety, coaching, camera health, and more — without digging through dashboards.",
    cta: "Try it now",
    href: AGENTIC_LISA_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/experiments/agentic-lisa.jpg"
        alt="Conversational assistant answering fleet data questions"
        className="h-full w-full object-contain border-b border-[var(--gl-color-border)] bg-white"
      />
    ),
  },
  {
    category: "create",
    title: "Breaking the Silos",
    subtitle: "Your data, in the AI tool you already use.",
    description: "RideView MCP lets your users bring their favorite AI assistant to their fleet data.",
    cta: "Learn more",
    href: MCP_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/experiments/breaking-the-silos.jpg"
        alt="Databases and LightMetrics AI combined via MCP"
        className="h-full w-full object-contain border-b border-[var(--gl-color-border)] bg-white"
      />
    ),
  },
  {
    category: "create",
    title: "Talk to Data",
    subtitle: "Build your own reports",
    description: "Create custom reports from your fleet data using plain-language.",
    cta: "Try it now",
    href: TALK_TO_DATA_URL,
    target: "_blank",
    media: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/experiments/talk-to-data.png"
        alt="Building custom fleet reports in plain language"
        className="h-full w-full object-contain border-b border-[var(--gl-color-border)] bg-white"
      />
    ),
  },
];

const CARD_WIDTH = 340;

// Every showcase card shares a plain white surface (no category tint) and
// Agentic LISA's (category "create") pink CTA color, regardless of the card's
// own category. --gl-cat-fill drives the "Try it now" link color.
const CARD_STYLE = {
  background: "#ffffff",
  "--gl-cat-fill": "#F267EB",
} as CSSProperties;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};

export function ExperimentsShowcase() {
  const topRow = FEATURED.slice(0, 3);
  const bottomRow = FEATURED.slice(3, 6);

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

      <p className="relative z-10 -mt-[200px] mb-4 text-center text-lg text-[var(--gl-color-on-surface-subtle)]">
        Join us from day one.
      </p>
      <h2 className="relative z-10 mx-auto mb-20 max-w-[130rem] px-8 text-center text-[3rem] font-medium leading-tight text-black sm:text-[5.25rem]">
        Discover our latest experiments and help
        <br />
        shape the future of fleet safety
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
              <ExperimentCard {...f} style={CARD_STYLE} />
            </motion.div>
          ))}
        </div>
        <div className="flex flex-nowrap justify-center gap-6">
          {bottomRow.map((f) => (
            <motion.div key={f.title} variants={item} className="flex" style={{ width: CARD_WIDTH }}>
              <ExperimentCard {...f} style={CARD_STYLE} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
