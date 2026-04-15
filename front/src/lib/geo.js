/**
 * Geographic utility functions.
 * Pure calculations — no side effects, safe to call anywhere.
 */

/**
 * Calculates the straight-line distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the district of the nearest point (with a known district) to the given coordinates.
 * Used to assign a district to sites that have none stored in the DB.
 *
 * @param {number} targetLat  - Latitude of the target point
 * @param {number} targetLng  - Longitude of the target point
 * @param {Array}  allPoints  - Full list of site points used as the reference set
 * @returns {string|null} District name, or null if no reference points exist
 */
export function findClosestDistrict(targetLat, targetLng, allPoints) {
  const pointsWithDistrict = allPoints.filter(
    (p) => p.district && p.district !== "-" && p.district !== "" && p.lat && p.lng
  );

  if (pointsWithDistrict.length === 0) return null;

  let closestPoint = null;
  let minDistance = Infinity;

  for (const p of pointsWithDistrict) {
    const distance = calculateDistance(targetLat, targetLng, p.lat, p.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = p;
    }
  }

  return closestPoint?.district ?? null;
}
