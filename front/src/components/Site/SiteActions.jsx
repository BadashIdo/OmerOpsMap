import styles from "../../styles/SiteActions.module.css";

function has(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

export default function SiteActions({ lat, lng }) {
  const ok = has(lat) && has(lng);

  const googleUrl = ok
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : "";

  const wazeUrl = ok ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17` : "";

  return (
    <div className={styles.navRow}>
      <a
  className={`${styles.navBtn} ${styles.waze}`}
  href={wazeUrl || "#"}
  target="_blank"
  rel="noreferrer"
  aria-disabled={!ok}
  onClick={(e) => {
    if (!ok) e.preventDefault();
  }}
>
  <img
  src="/icons/waze.png"
  alt="Waze"
  className={styles.icon}
/>
Waze
</a>

<a
  className={`${styles.navBtn} ${styles.gmaps}`}
  href={googleUrl || "#"}
  target="_blank"
  rel="noreferrer"
  aria-disabled={!ok}
  onClick={(e) => {
    if (!ok) e.preventDefault();
  }}
>
    
  <img
  src="/icons/google-maps.png"
  alt="Google Maps"
  className={styles.icon}
/>
GOOGLE MAPS
</a>
    </div>
  );
}
