/**
 * useExternalFeatures — fetches and tracks features for one external source.
 *
 * Re-fetches when:
 *   1. The hook mounts.
 *   2. A WebSocket "data_changed" event for `data_type === "external"` and
 *      `data.source === source` arrives via `wsRefreshTrigger`.
 *   3. The browser tab becomes visible after being hidden (mobile reconnect).
 *
 * Throttles re-fetch when the tab is hidden — saves battery on backgrounded tabs.
 *
 * @param {string} source           - external source id (e.g. "oref_alert")
 * @param {boolean} enabled         - skip fetching when false (layer hidden)
 * @param {number} wsRefreshTrigger - increment to force a refresh
 */

import { useEffect, useRef, useState } from "react";
import { fetchExternalFeatures } from "../api/externalApi";

export function useExternalFeatures(source, enabled, wsRefreshTrigger) {
  const [features, setFeatures] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled || !source) return;

    let cancelled = false;

    async function load() {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setIsLoading(true);
      try {
        const rows = await fetchExternalFeatures(source);
        if (cancelled) return;
        setFeatures(rows);
        setLastSyncedAt(new Date());
        setError("");
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          inFlightRef.current = false;
        }
      }
    }

    load();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [source, enabled, wsRefreshTrigger]);

  return { features, lastSyncedAt, error, isLoading };
}
