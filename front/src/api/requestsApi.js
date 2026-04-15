/**
 * Requests API — submitting and managing site-change requests.
 *
 * Public functions (submitRequest, checkRequestStatus) need no auth.
 * Admin functions require a JWT auth header from getAuthHeader() in AuthContext.
 *
 * Base URL is set via the VITE_API_URL environment variable
 * (defaults to http://localhost:8001 for local development).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/**
 * Submit a new site request. Anyone (including guests) can call this.
 * @param {Object} requestData - Form data from RequestForm
 */
export async function submitRequest(requestData) {
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "שגיאה בשליחת הבקשה");
  }
  return response.json();
}

/**
 * Check the status of a previously submitted request.
 * Requires the submitter's phone number for verification.
 * @param {string} requestId
 * @param {string} phone
 */
export async function checkRequestStatus(requestId, phone) {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/status/${requestId}?phone=${encodeURIComponent(phone)}`
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "לא ניתן למצוא את הבקשה");
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/**
 * Get all pending requests.
 * @param {Object} authHeader - { Authorization: "Bearer <token>" }
 */
export async function getPendingRequests(authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/pending`, {
    headers: authHeader,
  });
  if (!response.ok) throw new Error("שגיאה בטעינת הבקשות");
  return response.json();
}

/**
 * Get the count of pending requests (used for the admin badge).
 * @param {Object} authHeader
 */
export async function getPendingRequestsCount(authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/count`, {
    headers: authHeader,
  });
  if (!response.ok) return { pending_count: 0 };
  return response.json();
}

/**
 * Get all requests, optionally filtered by status.
 * @param {Object}      authHeader
 * @param {string|null} status - e.g. "pending", "approved", "rejected"
 */
export async function getRequests(authHeader, status = null) {
  const url = status
    ? `${API_BASE_URL}/api/requests?status=${status}`
    : `${API_BASE_URL}/api/requests`;
  const response = await fetch(url, { headers: authHeader });
  if (!response.ok) throw new Error("שגיאה בטעינת הבקשות");
  return response.json();
}

/**
 * Get a single request by ID.
 * @param {string|number} requestId
 * @param {Object}        authHeader
 */
export async function getRequest(requestId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
    headers: authHeader,
  });
  if (!response.ok) throw new Error("בקשה לא נמצאה");
  return response.json();
}

/**
 * Update a request's data.
 * @param {string|number} requestId
 * @param {Object}        requestData - Updated fields
 * @param {Object}        authHeader
 */
export async function updateRequest(requestId, requestData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(requestData),
  });
  if (!response.ok) throw new Error("שגיאה בעדכון הבקשה");
  return response.json();
}

/**
 * Approve a request — creates a new site from the request data.
 * @param {string|number} requestId
 * @param {Object}        authHeader
 */
export async function approveRequest(requestId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/approve`, {
    method: "POST",
    headers: authHeader,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "שגיאה באישור הבקשה");
  }
  return response.json();
}

/**
 * Reject a request with an optional reason.
 * @param {string|number} requestId
 * @param {string}        reason    - Explanation shown to the requester
 * @param {Object}        authHeader
 */
export async function rejectRequest(requestId, reason, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "שגיאה בדחיית הבקשה");
  }
  return response.json();
}

/**
 * Permanently delete a request.
 * @param {string|number} requestId
 * @param {Object}        authHeader
 */
export async function deleteRequest(requestId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
    method: "DELETE",
    headers: authHeader,
  });
  if (!response.ok) throw new Error("שגיאה במחיקת הבקשה");
}
