"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./SiteHeader.module.css";

function LogoMark() {
  return (
    <svg width="40" height="23" viewBox="0 0 32 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 8C2 4.5 5 2 8 2C10.5 2 12 4 12.5 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M30 8C30 4.5 27 2 24 2C21.5 2 20 4 19.5 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M12 9.5H20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="1.5" y="9" width="9" height="6.5" rx="3.25" fill="currentColor" />
      <rect x="21.5" y="9" width="9" height="6.5" rx="3.25" fill="currentColor" />
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Home", href: "#hero-section" },
  { label: "About", href: "#aboutusnavbar" },
  { label: "Experiments", href: "#experiments" },
];

export function SiteHeader() {
  const [onLight, setOnLight] = useState(false);
  const [activeHref, setActiveHref] = useState("#hero-section");
  // While a nav link is clicked, the page jumps/scrolls to its target. Suppress
  // the scroll-spy until this timestamp so it can't briefly re-highlight a link
  // the click is scrolling *past* (e.g. Home when clicking About from the top).
  const spyLockUntil = useRef(0);

  useEffect(() => {
    const heroEl = document.getElementById("hero-section");
    // Mirror Hero.tsx's scroll progress, which is measured over the hero's
    // *scrollable* range (offsetHeight − viewport), not its full height. Its
    // video-frame background transitions dark→light across 62%–90% of that
    // range; flip the header to its light treatment at 80% so nav text stays
    // readable and is already black by the time the #about anchor (90%) is
    // reached — whether by scrolling or by clicking the About nav link.
    const scrollRange = (heroEl?.offsetHeight ?? window.innerHeight) - window.innerHeight;
    const threshold = scrollRange * 0.8;

    const onScroll = () => {
      const scrollY = window.scrollY;
      setOnLight(scrollY > threshold);

      // A click owns the highlight until its scroll settles — don't fight it.
      if (Date.now() < spyLockUntil.current) return;

      // Scroll-spy: highlight the last nav target whose anchor has passed the
      // probe line (~40% down the viewport).
      const probe = scrollY + window.innerHeight * 0.4;
      let current = NAV_LINKS[0].href;
      for (const link of NAV_LINKS) {
        const el = document.querySelector<HTMLElement>(link.href);
        if (el && el.offsetTop <= probe) current = link.href;
      }
      setActiveHref(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn(styles.header, onLight && styles.onLight)}>
      <a href="/" className={styles.logo}>
        <LogoMark />
        <span>LM Labs</span>
      </a>

      <nav className={styles.nav}>
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={cn(styles.navLink, activeHref === link.href && styles.navLinkActive)}
            onClick={() => {
              // Highlight immediately, and hold it while the jump settles.
              setActiveHref(link.href);
              spyLockUntil.current = Date.now() + 800;
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <a
        href="https://lightmetrics.co/"
        target="_blank"
        rel="noreferrer"
        className={styles.contactButton}
      >
        Visit LightMetrics
      </a>
    </header>
  );
}
