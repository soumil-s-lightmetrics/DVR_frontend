import styles from "./Footer.module.css";

const GOOGLE_LINKS = ["AI", "Cloud", "Research", "DeepMind"];
const LEGAL_LINKS = ["Privacy", "Terms", "About Google"];

export function Footer({ siteName = "Labs" }: { siteName?: string }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <span className={styles.brand}>{siteName}</span>
          <div className={styles.social}>
            <a href="#" aria-label="Discord" className={styles.iconLink}>◆</a>
            <a href="#" aria-label="Reddit" className={styles.iconLink}>●</a>
            <a href="#" aria-label="X" className={styles.iconLink}>✕</a>
          </div>
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h4 className={styles.heading}>Google</h4>
            <ul>
              {GOOGLE_LINKS.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
          <div className={styles.column}>
            <h4 className={styles.heading}>Legal</h4>
            <ul>
              {LEGAL_LINKS.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <p className={styles.copyright}>© {new Date().getFullYear()} Google</p>
      </div>
    </footer>
  );
}
