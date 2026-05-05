/**
 * useExternalFeatures — fetches and tracks features for one external source.
 *
 * Re-fetches when:
 *   1. The hook mounts.
 *   2. A WebSocket "data_changed" event for `data_type === "external"` and
 *      `data.source === source` arrives via `wsRefreshTrigger`.
 *   3. The browser tab becomes visible after being hidden.
 *   4. On a polling interval — keeps `lastSyncedAt` honest even when the
 *      backend sync runs returned no diff and therefore did not broadcast.
 *
 * @param {string} source           - external source id (e.g. "oref_alert")
 * @param {boolean} enabled         - skip fetching when false (layer hidden)
 * @param {number} wsRefreshTrigger - increment to force a refresh
 * @param {number} pollIntervalMs   - default 60_000 (1 min); pass 0 to disable
 */

import { useEffect, useRef, useState } from "react";
import { fetchExternalFeatures } from "../api/externalApi";

const DEFAULT_POLL_MS = 60_000;

export function useExternalFeatures(source, enabled, wsRefreshTrigger, pollIntervalMs = DEFAULT_POLL_MS) {
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
      if (document.visibilityState === "hidden") return;  // skip while tab backgrounded
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

    let pollId = null;
    if (pollIntervalMs > 0) {
      pollId = setInterval(load, pollIntervalMs);
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (pollId) clearInterval(pollId);
    };
  }, [source, enabled, wsRefreshTrigger, pollIntervalMs]);

  return { features, lastSyncedAt, error, isLoading };
}
