import styles from "./Header.module.css";

export interface HeaderProps {
  logo?: string;
  navItems?: { label: string; href: string }[];
}

const DEFAULT_NAV = [
  { label: "About", href: "#about" },
  { label: "Experiments", href: "#experiments" },
  { label: "Stay connected", href: "#connect" },
];

export function Header({ logo = "Labs", navItems = DEFAULT_NAV }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>{logo}</a>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.social}>
          <a href="#" aria-label="Discord" className={styles.iconLink}>◆</a>
          <a href="#" aria-label="Reddit" className={styles.iconLink}>●</a>
          <a href="#" aria-label="X" className={styles.iconLink}>✕</a>
        </div>
      </div>
    </header>
  );
}
