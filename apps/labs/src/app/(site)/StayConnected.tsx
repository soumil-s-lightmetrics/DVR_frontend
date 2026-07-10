"use client";

import { motion } from "motion/react";
import { Globe, Linkedin, Youtube } from "lucide-react";
import styles from "./StayConnected.module.css";

const SOCIALS = [
  { label: "Website", href: "https://www.lightmetrics.co/", Icon: Globe },
  { label: "LinkedIn", href: "https://in.linkedin.com/company/lightmetrics", Icon: Linkedin },
  { label: "YouTube", href: "https://www.youtube.com/@lightmetrics9922", Icon: Youtube },
];

const container = {
  rest: {},
  hover: { transition: { staggerChildren: 0.025 } },
};

const letterVariant = {
  rest: { y: 0 },
  hover: { y: -6 },
};

function AnimatedLabel({ text }: { text: string }) {
  return (
    <span className={styles.animLabel} aria-label={text}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden
          className={styles.animChar}
          variants={letterVariant}
          transition={{ type: "spring", stiffness: 500, damping: 16 }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}

export function StayConnected() {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Want to keep up with our work?</h2>

      <div className={styles.follow}>
        <p className={styles.followUs}>Follow us.</p>
        <div className={styles.socials}>
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className={styles.socialLink}
            >
              <Icon className={styles.socialIcon} strokeWidth={1.75} />
            </a>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <motion.a
          href="https://lightmetrics.co/"
          target="_blank"
          rel="noreferrer"
          className={styles.pill}
          initial="rest"
          animate="rest"
          whileHover="hover"
          variants={container}
        >
          <AnimatedLabel text="Visit LightMetrics" />
        </motion.a>
      </div>
    </div>
  );
}
