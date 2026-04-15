import { useEffect, useState } from "react";
import { fetchTemporarySites } from "../api/sitesApi";

export function useTemporarySites(shouldRefresh) {
  const [temporarySites, setTemporarySites] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadTemporarySites = async () => {
    try {
      setIsLoading(true);
      const sites = await fetchTemporarySites();
      setTemporarySites(sites);
      setLoadError("");
    } catch (e) {
      console.error("Error loading temporary sites:", e);
      setLoadError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemporarySites();
  }, [shouldRefresh]);

  return { temporarySites, loadError, isLoading, reload: loadTemporarySites };
}

