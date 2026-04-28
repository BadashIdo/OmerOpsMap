/**
 * Feedback API — public submit + admin management.
 *
 * - submitFeedback is public (guests too); no auth header.
 * - All other functions require an admin JWT auth header.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

/** Public — anyone (including guests) submits a feedback. */
export async function submitFeedback(payload) {
  const response = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("שגיאה בשליחת המשוב");
  return response.json();
}

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== "") q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Admin — list feedback with optional filters. */
export async function listFeedback(authHeader, filters = {}) {
  const url = `${API_BASE_URL}/api/feedback${buildQuery(filters)}`;
  const response = await fetch(url, { headers: authHeader });
  if (!response.ok) throw new Error("שגיאה בטעינת המשובים");
  return response.json();
}

/** Admin — count of feedback with status=new (for the tab badge). */
export async function getFeedbackCountNew(authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/feedback/count-new`, {
    headers: authHeader,
  });
  if (!response.ok) throw new Error("שגיאה בטעינת ספירת המשובים החדשים");
  return response.json();
}

/** Admin — fetch one feedback by id. */
export async function getFeedback(id, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/feedback/${id}`, {
    headers: authHeader,
  });
  if (!response.ok) throw new Error("שגיאה בטעינת המשוב");
  return response.json();
}

/** Admin — update feedback (content / status / admin notes). */
export async function updateFeedback(id, payload, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/feedback/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("שגיאה בעדכון המשוב");
  return response.json();
}

/** Admin — delete feedback. */
export async function deleteFeedback(id, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/feedback/${id}`, {
    method: "DELETE",
    headers: authHeader,
  });
  if (!response.ok) throw new Error("שגיאה במחיקת המשוב");
}

/** Admin — manually add a feedback (e.g. recorded by phone). May include status + admin_notes. */
export async function createFeedbackAsAdmin(payload, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/feedback/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("שגיאה ביצירת המשוב");
  return response.json();
}
