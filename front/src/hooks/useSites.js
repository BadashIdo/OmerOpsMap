/**
 * useSites — fetches and normalizes permanent sites from the API.
 *
 * Handles three transformations before returning data to the UI:
 *  1. Maps raw API field names (snake_case) to the camelCase shape the app expects.
 *  2. Filters out entries with invalid or missing coordinates.
 *  3. Assigns the nearest known district to any site that has none stored in the DB
 *     (geographic proximity via Haversine — see lib/geo.js).
 *
 * @param {number} shouldRefresh - Increment this value to trigger a re-fetch
 *                                 (e.g., after a WebSocket "data_changed" event).
 * @returns {{ points, loadError, isLoading, reload }}
 *   points     — normalized, validated, district-fixed site array
 *   loadError  — error string if the last fetch failed, else ""
 *   isLoading  — true while a fetch is in flight
 *   reload     — call manually to force an immediate re-fetch
 */

import { useEffect, useState } from "react";
import { fetchPermanentSites } from "../api/sitesApi";
import { findClosestDistrict } from "../lib/geo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true only if lat/lng form a valid WGS84 coordinate pair. */
function isValidCoordinate(lat, lng) {
  if (lat == null || lng == null) return false;
  if (lat === 0 && lng === 0) return false;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Maps the raw API response shape to the internal site shape expected by the UI. */
function transformSite(site) {
  return {
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
  };
}

/**
 * Assigns a district to every site that has none (empty, null, or "-"),
 * using the district of the geographically nearest site that has one.
 */
function fixMissingDistricts(points) {
  const needsFix = points.some(
    (p) => !p.district || p.district === "-" || p.district.trim() === ""
  );
  if (!needsFix) return points;

  return points.map((p) => {
    if (!p.district || p.district === "-" || p.district.trim() === "") {
      const closest = findClosestDistrict(p.lat, p.lng, points);
      return closest ? { ...p, district: closest } : p;
    }
    return p;
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSites(shouldRefresh) {
  const [points, setPoints] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadSites() {
    try {
      setIsLoading(true);
      const raw = await fetchPermanentSites();
      const transformed = raw.map(transformSite);
      const valid = transformed.filter((s) => isValidCoordinate(s.lat, s.lng));
      const withDistricts = fixMissingDistricts(valid);
      setPoints(withDistricts);
      setLoadError("");
    } catch (e) {
      console.error("Error loading sites:", e);
      setLoadError(String(e));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSites();
  }, [shouldRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  return { points, loadError, isLoading, reload: loadSites };
}
