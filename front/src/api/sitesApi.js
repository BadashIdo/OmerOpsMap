/**
 * Sites API — reading and managing permanent and temporary map sites.
 *
 * Public functions (fetch*) need no authentication.
 * Admin write functions (*Auth) require a JWT auth header — get it from
 * AuthContext via getAuthHeader() and pass it as the last argument.
 *
 * Base URL is set via the VITE_API_URL environment variable
 * (defaults to http://localhost:8001 for local development).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

// ---------------------------------------------------------------------------
// WebSocket
// ---------------------------------------------------------------------------

/**
 * Returns the WebSocket URL derived from the REST API base URL.
 * Automatically switches protocol: http → ws, https → wss.
 */
export function getWebSocketUrl() {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsHost = API_BASE_URL.replace("http://", "").replace("https://", "");
  return `${wsProtocol}//${wsHost}/ws`;
}

// ---------------------------------------------------------------------------
// Permanent Sites — public reads
// ---------------------------------------------------------------------------

/** Fetch all permanent sites. No auth required. */
export async function fetchPermanentSites() {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites`);
  if (!response.ok) throw new Error(`Failed to fetch permanent sites: ${response.status}`);
  return response.json();
}

// ---------------------------------------------------------------------------
// Permanent Sites — admin writes (JWT)
// ---------------------------------------------------------------------------

/**
 * Create a new permanent site.
 * @param {Object} siteData   - Site fields
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function createPermanentSiteAuth(siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(siteData),
  });
  if (!response.ok) throw new Error("שגיאה ביצירת האתר");
  return response.json();
}

/**
 * Update an existing permanent site.
 * @param {number} siteId     - ID of the site to update
 * @param {Object} siteData   - Updated fields
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function updatePermanentSiteAuth(siteId, siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites/${siteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(siteData),
  });
  if (!response.ok) throw new Error("שגיאה בעדכון האתר");
  return response.json();
}

/**
 * Delete a permanent site.
 * @param {number} siteId     - ID of the site to delete
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function deletePermanentSiteAuth(siteId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites/${siteId}`, {
    method: "DELETE",
    headers: authHeader,
  });
  if (!response.ok) throw new Error("שגיאה במחיקת האתר");
}

// ---------------------------------------------------------------------------
// Temporary Sites — public reads
// ---------------------------------------------------------------------------

/** Fetch all currently active temporary sites. No auth required. */
export async function fetchTemporarySites() {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites`);
  if (!response.ok) throw new Error(`Failed to fetch temporary sites: ${response.status}`);
  return response.json();
}

// ---------------------------------------------------------------------------
// Temporary Sites — admin writes (JWT)
// ---------------------------------------------------------------------------

/**
 * Create a new temporary site / event.
 * @param {Object} siteData   - Event fields (name, priority, start_date, end_date, …)
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function createTemporarySiteAuth(siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(siteData),
  });
  if (!response.ok) throw new Error("שגיאה ביצירת האירוע");
  return response.json();
}

/**
 * Update an existing temporary site.
 * @param {number} siteId     - ID of the event to update
 * @param {Object} siteData   - Updated fields
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function updateTemporarySiteAuth(siteId, siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites/${siteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(siteData),
  });
  if (!response.ok) throw new Error("שגיאה בעדכון האירוע");
  return response.json();
}

/**
 * Delete a temporary site.
 * @param {number} siteId     - ID of the event to delete
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function deleteTemporarySiteAuth(siteId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites/${siteId}`, {
    method: "DELETE",
    headers: authHeader,
  });
  if (!response.ok) throw new Error("שגיאה במחיקת האירוע");
}

/**
 * Fetch all historical temporary sites (admin only).
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function fetchTemporaryHistoryAuth(authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites/history`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...authHeader },
  });
  if (!response.ok) throw new Error(`Failed to fetch history: ${response.status}`);
  return response.json();
}
