"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import styles from "./Hero.module.css";

export function Hero() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  // Raw scroll progress arrives in discrete wheel/trackpad steps, which makes
  // transforms mapped straight off it feel juddery. Run it through a spring so
  // every derived value glides between steps instead of snapping.
  const progress = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 42,
    mass: 0.4,
    restDelta: 0.0005,
  });

  // Headline is fully visible by default (no fade-in) and holds for a long
  // stretch of scroll before it fades out as the video shrinks.
  const textOpacity = useTransform(progress, [0, 0.5, 0.62], [1, 1, 0]);

  const scrollCueOpacity = useTransform(progress, [0, 0.42, 0.48], [1, 1, 0]);

  const scale = useTransform(progress, [0.62, 0.9], [1, 0.34]);
  const borderRadius = useTransform(progress, [0.62, 0.9], [0, 28]);
  const overlayOpacity = useTransform(progress, [0.62, 0.78], [0.35, 0]);
  const frameBackground = useTransform(
    progress,
    [0.62, 0.9],
    ["#0b0b0c", "#F3EFEA"]
  );

  const aboutOpacity = useTransform(progress, [0.75, 0.95], [0, 1]);
  const aboutY = useTransform(progress, [0.75, 0.95], [20, 0]);

  return (
    <div ref={wrapperRef} id="hero-section" className={styles.wrapper}>
      {/* Stable scroll anchor for the "About" nav link — positioned at the
          scroll depth where the about copy is fully revealed. Kept as a direct
          child of the (relative) wrapper so its offsetTop is constant, unlike
          the absolutely-positioned about block inside the sticky container. */}
      <div id="about" aria-hidden className={styles.aboutAnchor} />
      <motion.div className={styles.sticky} style={{ backgroundColor: frameBackground }}>
        <motion.div className={styles.videoFrame} style={{ scale, borderRadius }}>
          <video className={styles.video} src="/videos/herovideo.mp4" autoPlay muted loop playsInline />
          <motion.div className={styles.overlay} style={{ opacity: overlayOpacity }} />

          <motion.div className={styles.caption} style={{ opacity: textOpacity }}>
            <span className={styles.eyebrow}>LM Labs</span>
            <h1 className={styles.title}>Where bold ideas become real AI experiments</h1>
            <p className={styles.subtitle}>
              We build, test, and ship experimental AI products in the open.
            </p>
          </motion.div>

          <motion.div className={styles.scrollCue} style={{ opacity: scrollCueOpacity }}>
            <span>Scroll to explore</span>
            <motion.span
              className={styles.scrollTick}
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>

        <motion.div className={styles.about} style={{ opacity: aboutOpacity, y: aboutY }}>
          <p className={styles.aboutEyebrow}>We build in the open.</p>
          <p className={styles.aboutCopy}>
            LM Labs is where our AI experiments come to life — anyone can watch an idea go from
            prototype to product. Every experiment here runs on the same models and infrastructure
            that power our shipped products, shaped by feedback from trusted testers before it ever
            reaches millions of users.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
