import styles from "./SiteFooter.module.css";

// The "LightMetrics" link is rendered separately as the footer brand (below).
const LINKS = [
  { label: "RideView", href: "https://www.lightmetrics.co/solution" },
  { label: "Terms & Conditions", href: "https://www.lightmetrics.co/terms-conditions" },
  { label: "Privacy Policy", href: "https://www.lightmetrics.co/privacy-policy" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <hr className={styles.divider} />

      <h2 className={styles.wordmark}>LM Labs</h2>

      <hr className={styles.divider} />

      <div className={styles.bottomBar}>
        <a
          href="https://www.lightmetrics.co/"
          target="_blank"
          rel="noreferrer"
          className={styles.brand}
        >
          LightMetrics
        </a>
        <nav className={styles.links}>
          {LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className={styles.link}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
