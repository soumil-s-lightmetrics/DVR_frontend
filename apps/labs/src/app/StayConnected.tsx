"use client";

import { motion } from "motion/react";
import { Globe, Linkedin, Twitter } from "lucide-react";
import styles from "./StayConnected.module.css";

const SOCIALS = [
  { label: "Website", href: "https://example.com", Icon: Globe },
  { label: "LinkedIn", href: "https://www.linkedin.com", Icon: Linkedin },
  { label: "Twitter", href: "https://twitter.com", Icon: Twitter },
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
      <h2 className={styles.title}>Stay connected for early access to our new experiments</h2>

      <div className={styles.actions}>
        <motion.a
          href="#connect"
          className={styles.pill}
          initial="rest"
          animate="rest"
          whileHover="hover"
          variants={container}
        >
          <AnimatedLabel text="Sign up for the Labs newsletter" />
        </motion.a>
        <motion.a
          href="#contact"
          className={styles.pill}
          initial="rest"
          animate="rest"
          whileHover="hover"
          variants={container}
        >
          <AnimatedLabel text="Work with us" />
        </motion.a>
      </div>

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
  );
}
