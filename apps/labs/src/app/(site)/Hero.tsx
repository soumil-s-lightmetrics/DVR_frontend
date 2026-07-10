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
      {/* Scroll target for the "About" nav link. The about copy below is
          absolutely positioned inside the sticky container and only fades in
          near the end of the hero scroll, so a stable anchor sits at the depth
          where that copy is fully revealed, as a direct child of the wrapper. */}
      <div id="aboutusnavbar" aria-hidden className={styles.aboutAnchor} />
      <motion.div className={styles.sticky} style={{ backgroundColor: frameBackground }}>
        <motion.div className={styles.videoFrame} style={{ scale, borderRadius }}>
          <video className={styles.video} src="/videos/herovideo.mp4" autoPlay muted loop playsInline />
          <motion.div className={styles.overlay} style={{ opacity: overlayOpacity }} />

          <motion.div className={styles.caption} style={{ opacity: textOpacity }}>
            <span className={styles.eyebrow}>LM Labs</span>
            <h1 className={styles.title}>Where bold ideas become reality</h1>
            <p className={styles.subtitle}>
              Experience the latest innovations in video telematics
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
            LM Labs is where we test bold ideas early. These are experiments — not final products.
            They may change, may never ship, and may have bugs.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
