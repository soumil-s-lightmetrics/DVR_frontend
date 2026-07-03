"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import styles from "./Pill.module.css";

export function Pill({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <motion.button
      className={`${styles.pill} ${active ? styles.active : ""}`}
      onClick={onClick}
      type="button"
      whileHover={{ scale: active ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ position: "relative" }}
    >
      {active && (
        <motion.span
          layoutId="pill-active-bg"
          className={styles.activeBg}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className={styles.label}>{children}</span>
    </motion.button>
  );
}
