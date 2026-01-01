import styles from "../styles/Header.module.css";

export default function Header({ title = "OmerOpsMaps", subtitle = "המועצה המקומית עומר" }) {
  return (
    <header className={`${styles.header} safe-top`}>
      <div className={styles.row}>
        <div className={styles.leftIcons}>
          <button className={styles.iconBtn} aria-label="חיפוש">🔎</button>
          <button className={styles.iconBtn} aria-label="התראות">🔔</button>
        </div>

        <div className={styles.text}>
          <div className={styles.title}>{title}</div>
          <div className={styles.sub}>{subtitle}</div>
        </div>

        <div className={styles.avatar}>י</div>
      </div>
    </header>
  );
}
