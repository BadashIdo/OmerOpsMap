/**
 * API client for OmerOpsMap data server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL || 'http://localhost:8000';

// =====================
// AI Agent API
// =====================

/**
 * Send a question to the AI Agent
 * @param {string} query - The user's question
 * @param {string} contextWindow - Chat history formatted as string
 * @param {string} selfLocation - Optional user location
 * @returns {Promise<{final_answer: string, tool_results: object|null}>}
 */
export async function askAiAgent(query, contextWindow = '', selfLocation = '') {
  const response = await fetch(`${AI_AGENT_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      context_window: contextWindow,
      self_location: selfLocation,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'שגיאה בתקשורת עם העוזר החכם');
  }

  return response.json();
}

/**
 * Fetch all permanent sites
 */
export async function fetchPermanentSites() {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites`);
  if (!response.ok) {
    throw new Error(`Failed to fetch permanent sites: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch all active temporary sites
 */
export async function fetchTemporarySites() {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites`);
  if (!response.ok) {
    throw new Error(`Failed to fetch temporary sites: ${response.status}`);
  }
  return response.json();
}

/**
 * Create a new permanent site (admin only)
 */
export async function createPermanentSite(siteData, adminKey) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create permanent site: ${response.status}`);
  }
  return response.json();
}

/**
 * Update a permanent site (admin only)
 */
export async function updatePermanentSite(siteId, siteData, adminKey) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites/${siteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update permanent site: ${response.status}`);
  }
  return response.json();
}

/**
 * Delete a permanent site (admin only)
 */
export async function deletePermanentSite(siteId, adminKey) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites/${siteId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Key': adminKey,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete permanent site: ${response.status}`);
  }
}

/**
 * Create a new temporary site (admin only)
 */
export async function createTemporarySite(siteData, adminKey) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create temporary site: ${response.status}`);
  }
  return response.json();
}

/**
 * Update a temporary site (admin only)
 */
export async function updateTemporarySite(siteId, siteData, adminKey) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites/${siteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update temporary site: ${response.status}`);
  }
  return response.json();
}

/**
 * Delete a temporary site (admin only)
 */
export async function deleteTemporarySite(siteId, adminKey) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites/${siteId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Key': adminKey,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete temporary site: ${response.status}`);
  }
}

/**
 * Get WebSocket URL
 */
export function getWebSocketUrl() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = API_BASE_URL.replace('http://', '').replace('https://', '');
  return `${wsProtocol}//${wsHost}/ws`;
}

// =====================
// Request API Functions
// =====================

/**
 * Submit a new site request (public - anyone can submit)
 */
export async function submitRequest(requestData) {
  const response = await fetch(`${API_BASE_URL}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'שגיאה בשליחת הבקשה');
  }
  return response.json();
}

/**
 * Check request status (public - requires phone for verification)
 */
export async function checkRequestStatus(requestId, phone) {
  const response = await fetch(
    `${API_BASE_URL}/api/requests/status/${requestId}?phone=${encodeURIComponent(phone)}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'לא ניתן למצוא את הבקשה');
  }
  return response.json();
}

/**
 * Get all pending requests (admin only)
 */
export async function getPendingRequests(authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/pending`, {
    headers: authHeader,
  });
  
  if (!response.ok) {
    throw new Error('שגיאה בטעינת הבקשות');
  }
  return response.json();
}

/**
 * Get pending requests count (admin only)
 */
export async function getPendingRequestsCount(authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/count`, {
    headers: authHeader,
  });
  
  if (!response.ok) {
    return { pending_count: 0 };
  }
  return response.json();
}

/**
 * Get all requests with optional status filter (admin only)
 */
export async function getRequests(authHeader, status = null) {
  const url = status 
    ? `${API_BASE_URL}/api/requests?status=${status}`
    : `${API_BASE_URL}/api/requests`;
    
  const response = await fetch(url, {
    headers: authHeader,
  });
  
  if (!response.ok) {
    throw new Error('שגיאה בטעינת הבקשות');
  }
  return response.json();
}

/**
 * Get a single request by ID (admin only)
 */
export async function getRequest(requestId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
    headers: authHeader,
  });
  
  if (!response.ok) {
    throw new Error('בקשה לא נמצאה');
  }
  return response.json();
}

/**
 * Update a request (admin only)
 */
export async function updateRequest(requestId, requestData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(requestData),
  });
  
  if (!response.ok) {
    throw new Error('שגיאה בעדכון הבקשה');
  }
  return response.json();
}

/**
 * Approve a request (admin only)
 */
export async function approveRequest(requestId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/approve`, {
    method: 'POST',
    headers: authHeader,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'שגיאה באישור הבקשה');
  }
  return response.json();
}

/**
 * Reject a request (admin only)
 */
export async function rejectRequest(requestId, reason, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'שגיאה בדחיית הבקשה');
  }
  return response.json();
}

/**
 * Delete a request (admin only)
 */
export async function deleteRequest(requestId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
    method: 'DELETE',
    headers: authHeader,
  });
  
  if (!response.ok) {
    throw new Error('שגיאה במחיקת הבקשה');
  }
}

// =====================
// Admin Sites API (with JWT auth)
// =====================

/**
 * Create a permanent site with JWT auth
 */
export async function createPermanentSiteAuth(siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error('שגיאה ביצירת האתר');
  }
  return response.json();
}

/**
 * Update a permanent site with JWT auth
 */
export async function updatePermanentSiteAuth(siteId, siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites/${siteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error('שגיאה בעדכון האתר');
  }
  return response.json();
}

/**
 * Delete a permanent site with JWT auth
 */
export async function deletePermanentSiteAuth(siteId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/permanent-sites/${siteId}`, {
    method: 'DELETE',
    headers: authHeader,
  });
  
  if (!response.ok) {
    throw new Error('שגיאה במחיקת האתר');
  }
}

/**
 * Create a temporary site with JWT auth
 */
export async function createTemporarySiteAuth(siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error('שגיאה ביצירת האירוע');
  }
  return response.json();
}

/**
 * Update a temporary site with JWT auth
 */
export async function updateTemporarySiteAuth(siteId, siteData, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites/${siteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(siteData),
  });
  
  if (!response.ok) {
    throw new Error('שגיאה בעדכון האירוע');
  }
  return response.json();
}

/**
 * Delete a temporary site with JWT auth
 */
export async function deleteTemporarySiteAuth(siteId, authHeader) {
  const response = await fetch(`${API_BASE_URL}/api/temporary-sites/${siteId}`, {
    method: 'DELETE',
    headers: authHeader,
  });
  
  if (!response.ok) {
    throw new Error('שגיאה במחיקת האירוע');
  }
}

