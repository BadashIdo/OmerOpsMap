/**
 * WeatherWidget — floating glass chip in the top-start corner (RTL: right).
 *
 * Replaces the previous map marker for openmeteo_weather. A single point of
 * weather data does not belong on the map as a pin; it belongs on screen as
 * a HUD. Tap to expand and reveal humidity, wind, precipitation, last sync.
 *
 * Coexists with the surrounding UI by occupying the empty band beneath the
 * search bar on the start edge. The mirror trigger on the opposite edge
 * (LayersControl on top-end) keeps both elements at the same y-axis without
 * collision.
 */

import { useState } from "react";
import styles from "../styles/WeatherWidget.module.css";

const WEATHER_CODE_TO_EMOJI = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌦️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️",
  80: "🌧️", 81: "🌧️", 82: "⛈️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const WEATHER_CODE_TO_THEME = {
  0: "clear", 1: "clear",
  2: "cloudy", 3: "cloudy",
  45: "fog", 48: "fog",
  51: "rain", 53: "rain", 55: "rain",
  61: "rain", 63: "rain", 65: "rain",
  71: "snow", 73: "snow", 75: "snow",
  80: "rain", 81: "rain", 82: "rain",
  95: "storm", 96: "storm", 99: "storm",
};

function relativeTimeHe(date) {
  if (!date) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `סונכרן לפני ${seconds} שנ׳`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `סונכרן לפני ${minutes} דק׳`;
  const hours = Math.round(minutes / 60);
  return `סונכרן לפני ${hours} שע׳`;
}

export default function WeatherWidget({ feature, lastSyncedAt, isLoading }) {
  const [expanded, setExpanded] = useState(false);

  if (!feature) {
    if (isLoading) {
      return (
        <div className={styles.skeleton} aria-hidden="true">
          <span className={styles.skeletonShimmer} />
        </div>
      );
    }
    return null;
  }

  const payload = feature.payload || {};
  const code = payload.weather_code ?? 0;
  const emoji = WEATHER_CODE_TO_EMOJI[code] || "🌡️";
  const theme = WEATHER_CODE_TO_THEME[code] || "clear";
  const temp = payload.temperature_2m;
  const tempRounded = temp != null ? Math.round(temp) : null;
  const humidity = payload.relative_humidity_2m;
  const wind = payload.wind_speed_10m;
  const precip = payload.precipitation;
  const label = payload.weather_label_he || "—";

  return (
    <div
      className={`${styles.widget} ${styles[`theme_${theme}`]} ${expanded ? styles.expanded : ""}`}
      role="region"
      aria-label="מזג האוויר בעומר"
    >
      <button
        type="button"
        className={styles.chip}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={styles.emoji} aria-hidden="true">{emoji}</span>
        <span className={styles.tempBlock}>
          <bdi className={styles.tempInt}>{tempRounded ?? "—"}</bdi>
          <span className={styles.tempDeg}>°</span>
        </span>
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.labelBlock}>
          <span className={styles.label}>{label}</span>
          <span className={styles.location}>עומר</span>
        </span>
        <span
          className={`material-symbols-outlined ${styles.chevron}`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {expanded && (
        <div className={styles.details}>
          <div className={styles.metricsRow}>
            {humidity != null && (
              <div className={styles.metric}>
                <span className={`material-symbols-outlined ${styles.metricIcon}`}>humidity_percentage</span>
                <span className={styles.metricValue}><bdi>{humidity}%</bdi></span>
                <span className={styles.metricLabel}>לחות</span>
              </div>
            )}
            {wind != null && (
              <div className={styles.metric}>
                <span className={`material-symbols-outlined ${styles.metricIcon}`}>air</span>
                <span className={styles.metricValue}><bdi>{Math.round(wind)}</bdi></span>
                <span className={styles.metricLabel}>קמ״ש</span>
              </div>
            )}
            {precip != null && (
              <div className={styles.metric}>
                <span className={`material-symbols-outlined ${styles.metricIcon}`}>rainy</span>
                <span className={styles.metricValue}><bdi>{precip}</bdi></span>
                <span className={styles.metricLabel}>מ״מ</span>
              </div>
            )}
          </div>
          <div className={styles.footer}>
            <span className={styles.lastSync}>{relativeTimeHe(lastSyncedAt)}</span>
            <span className={styles.poweredBy}>Open-Meteo</span>
          </div>
        </div>
      )}
    </div>
  );
}
