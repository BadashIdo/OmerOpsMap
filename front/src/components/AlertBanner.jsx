/**
 * AlertBanner — full-width red banner overlaid on top of the map when
 * Pikud Haoref reports an active alert touching Omer.
 *
 * Mobile: sticky to top with safe-area-inset padding (notch).
 * Accessibility: role="alert" + aria-live="assertive" so screen readers
 * announce the change immediately.
 */

import bannerStyles from "../styles/AlertBanner.module.css";

export default function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  // Multiple simultaneous alerts: show the highest-severity one prominently.
  const sorted = [...alerts].sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));
  const primary = sorted[0];

  const title = primary.payload?.title || primary.name || "התרעת פיקוד העורף";
  const description =
    primary.description ||
    primary.payload?.label_he ||
    "היכנסו למרחב המוגן ושהו בו 10 דקות";

  return (
    <div
      className={bannerStyles.banner}
      role="alert"
      aria-live="assertive"
    >
      <span className={`material-symbols-outlined ${bannerStyles.icon}`}>warning</span>
      <div className={bannerStyles.content}>
        <strong className={bannerStyles.title}>{title}</strong>
        <span className={bannerStyles.description}>{description}</span>
        {sorted.length > 1 && (
          <span className={bannerStyles.count}>
            ועוד <bdi>{sorted.length - 1}</bdi> התרעות
          </span>
        )}
      </div>
    </div>
  );
}
