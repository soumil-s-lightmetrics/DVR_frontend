"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import styles from "./ExperimentCard.module.css";

export type Category = "create" | "develop" | "explore" | "learn";

export interface ExperimentCardProps {
  category: Category;
  title: string;
  description: string;
  cta: string;
  href?: string;
  target?: string;
  media?: ReactNode;
  // Override the card surface (e.g. a plain white background instead of the
  // category tint). Merged onto the card element's inline style.
  style?: CSSProperties;
}

export function ExperimentCard({ category, title, description, cta, href = "#", target, media, style }: ExperimentCardProps) {
  return (
    <motion.a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      style={style}
      className={`${styles.card} gl-cat-${category}`}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className={styles.media}>{media ?? <div className={styles.mediaPlaceholder} />}</div>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <span className={styles.cta}>{cta} &rarr;</span>
      </div>
    </motion.a>
  );
}
