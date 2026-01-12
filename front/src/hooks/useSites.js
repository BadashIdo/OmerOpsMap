import { useEffect, useState } from "react";
import { fetchPermanentSites } from "../api/dataService";

/**
 * מחזיר סיבה למה קואורדינטות לא תקינות (לדיבוג)
 */
function getInvalidReason(lat, lng) {
  if (lat == null || lng == null) return "null/undefined";
  if (lat === 0 && lng === 0) return "both are 0";
  if (typeof lat !== 'number' || typeof lng !== 'number') return "not a number";
  if (!isFinite(lat) || !isFinite(lng)) return "NaN/Infinity";
  if (lat < -90 || lat > 90) return `lat out of range: ${lat}`;
  if (lng < -180 || lng > 180) return `lng out of range: ${lng}`;
  return "unknown";
}

/**
 * בודק אם קואורדינטות תקינות לטווח ישראל
 * @param {number} lat - קו רוחב
 * @param {number} lng - קו אורך
 * @returns {boolean} - true אם הקואורדינטות תקינות
 */
function isValidCoordinate(lat, lng) {
  // בדיקה שהערכים לא null/undefined
  if (lat == null || lng == null) {
    return false;
  }
  
  // בדיקה שהערכים לא 0
  if (lat === 0 && lng === 0) {
    return false;
  }
  
  // בדיקה שהערכים מספרים
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  
  // בדיקה שהערכים לא NaN או Infinity
  if (!isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  
  // בדיקת טווח WGS84 בסיסי - לא מחמיר מדי
  // נבדוק רק שהקואורדינטות בטווח הגיוני של WGS84
  // (לא נבדוק טווח ספציפי של ישראל כי זה עלול להיות מחמיר מדי)
  const validLat = lat >= -90 && lat <= 90;
  const validLng = lng >= -180 && lng <= 180;
  
  return validLat && validLng;
}

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
      
      // Filter out sites with invalid coordinates
      const invalidSites = [];
      const validSites = transformedSites.filter((site) => {
        const isValid = isValidCoordinate(site.lat, site.lng);
        if (!isValid) {
          invalidSites.push({
            id: site.id,
            name: site.name,
            lat: site.lat,
            lng: site.lng,
            reason: getInvalidReason(site.lat, site.lng)
          });
        }
        return isValid;
      });
      
      // Log detailed information about filtered sites
      console.log(`📊 Sites loaded: ${transformedSites.length} total, ${validSites.length} valid, ${invalidSites.length} filtered out`);
      
      if (invalidSites.length > 0) {
        console.group(`⚠️ Filtered out ${invalidSites.length} sites with invalid coordinates:`);
        // Show all invalid sites for debugging
        invalidSites.forEach((site, index) => {
          console.log(`${index + 1}. ID ${site.id}: "${site.name || 'No name'}" - lat: ${site.lat}, lng: ${site.lng} (${site.reason})`);
        });
        console.groupEnd();
        
        // Also log as a table for easier viewing
        console.table(invalidSites.map(site => ({
          ID: site.id,
          Name: site.name || 'No name',
          Lat: site.lat,
          Lng: site.lng,
          Reason: site.reason
        })));
      } else {
        console.log(`✅ All ${transformedSites.length} sites have valid coordinates!`);
      }
      
      // Log summary statistics
      console.log(`\n📈 Summary:`);
      console.log(`  Total sites from API: ${transformedSites.length}`);
      console.log(`  Valid sites: ${validSites.length} (${((validSites.length / transformedSites.length) * 100).toFixed(1)}%)`);
      console.log(`  Invalid sites: ${invalidSites.length} (${((invalidSites.length / transformedSites.length) * 100).toFixed(1)}%)`);
      
      setPoints(validSites);
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
