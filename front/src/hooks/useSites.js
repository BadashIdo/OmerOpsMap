import { useEffect, useState } from "react";
import { fetchPermanentSites } from "../api/dataService";

export function useSites(shouldRefresh) {
  const [points, setPoints] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadSites = async () => {
    try {
      setIsLoading(true);
      const sites = await fetchPermanentSites();
      
      // Transform API response to match expected format
      const transformedSites = sites.map((site) => ({
        id: site.id,
        name: site.name,
        category: site.category || "",
        subCategory: site.sub_category || "",
        type: site.type || "",
        district: site.district || "",
        street: site.street || "",
        houseNumber: site.house_number || "",
        address: `${site.street || ""} ${site.house_number || ""}`.trim(),
        contactName: site.contact_name || "",
        phone: site.phone || "",
        description: site.description || "",
        lat: site.lat,
        lng: site.lng,
      }));
      
      setPoints(transformedSites);
      setLoadError("");
    } catch (e) {
      console.error("Error loading sites:", e);
      setLoadError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, [shouldRefresh]);

  return { points, loadError, isLoading, reload: loadSites };
}
