/**
 * External integrations API — live data layers (TomTom, oref, weather, etc).
 *
 * Public read endpoint requires no auth. Manual sync trigger is admin-only.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

/**
 * Fetch external features for a given source. Pass `since` (ISO string) to
 * limit to features fetched after a timestamp (cuts payload on poll).
 */
export async function fetchExternalFeatures(source, { kind, since, includeStale = true } = {}) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (kind) params.set("kind", kind);
  if (since) params.set("since", since);
  if (!includeStale) params.set("include_stale", "false");

  const url = `${API_BASE_URL}/api/external-features${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch external features: ${response.status}`);
  return response.json();
}

/**
 * Trigger an immediate sync for a given source. Admin-only.
 * @param {string} source     - one of EXTERNAL_LAYERS[].id
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function triggerSyncAuth(source, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/integrations/${source}/sync`, {
    method: "POST",
    headers: authHeader,
  });
  if (!response.ok) throw new Error(`שגיאה בסנכרון ${source}: ${response.status}`);
  return response.json();
}

/** List recent integration runs for ops visibility. Admin + subadmin. */
export async function fetchIntegrationRunsAuth(authHeader, { source, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  params.set("limit", String(limit));
  const url = `${API_BASE_URL}/api/integrations/runs?${params}`;
  const response = await fetch(url, { headers: authHeader });
  if (!response.ok) throw new Error(`Failed to fetch runs: ${response.status}`);
  return response.json();
}
