import styles from "./SiteFooter.module.css";

const LINKS = [
  { label: "RideView", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Join the Labs newsletter", href: "#contact" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <hr className={styles.divider} />

      <h2 className={styles.wordmark}>LM Labs</h2>

      <hr className={styles.divider} />

      <div className={styles.bottomBar}>
        <a href="#" className={styles.brand}>
          LightMetrics
        </a>
        <nav className={styles.links}>
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} className={styles.link}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
