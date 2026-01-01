import { useEffect, useState } from "react";
import { loadSitesFromExcel } from "../data/loadSitesFromExcel";

export function useSites() {
  const [points, setPoints] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadSitesFromExcel()
      .then(setPoints)
      .catch((e) => setLoadError(String(e)));
  }, []);

  return { points, loadError };
}
