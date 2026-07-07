"use client";

import { useEffect, useState } from "react";
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
  { label: "About Us", href: "#about" },
  { label: "Experiments", href: "#experiments" },
];

export function SiteHeader() {
  const [onLight, setOnLight] = useState(false);
  const [activeHref, setActiveHref] = useState("#hero-section");

  useEffect(() => {
    const heroEl = document.getElementById("hero-section");
    const heroHeight = heroEl?.offsetHeight ?? 0;
    // Mirrors Hero.tsx's own scroll progress: its background starts
    // transitioning to a light color at 62% through the hero's scroll range.
    const threshold = heroHeight * 0.6;

    const onScroll = () => {
      const scrollY = window.scrollY;
      setOnLight(scrollY > threshold);

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
          >
            {link.label}
          </a>
        ))}
      </nav>

      <a href="#contact" className={styles.contactButton}>
        Join the Labs newsletter
      </a>
    </header>
  );
}
