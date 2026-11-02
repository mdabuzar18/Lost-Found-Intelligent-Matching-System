const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = { ...options.headers };

  // Don't set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText };
    }
    throw new Error(errorData.detail || errorData.message || JSON.stringify(errorData));
  }

  // If 204 No Content
  if (response.status === 204) return null;
  return await response.json();
}

export const api = {
  getStats: () => fetchApi('/stats/'),

  getReports: (params = {}) => {
    const query = new URLSearchParams();
    if (params.report_type) query.append('report_type', params.report_type);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return fetchApi(`/reports/${qs ? `?${qs}` : ''}`);
  },

  getReport: (id) => fetchApi(`/reports/${id}/`),

  createReport: (formData) => fetchApi('/reports/', {
    method: 'POST',
    body: formData,
  }),

  triggerMatch: (reportId) => fetchApi(`/reports/${reportId}/trigger_match/`, {
    method: 'POST',
  }),

  getMatches: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.min_score) query.append('min_score', params.min_score);
    const qs = query.toString();
    return fetchApi(`/matches/${qs ? `?${qs}` : ''}`);
  },

  confirmMatch: (matchId, performedBy = 1) => fetchApi(`/matches/${matchId}/confirm/`, {
    method: 'POST',
    body: JSON.stringify({ performed_by: performedBy }),
  }),

  rejectMatch: (matchId, performedBy = 1, reason = 'Manually rejected by staff') => fetchApi(`/matches/${matchId}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ performed_by: performedBy, reason }),
  }),

  getClaims: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return fetchApi(`/claims/${qs ? `?${qs}` : ''}`);
  },

  createClaim: (claimData) => fetchApi('/claims/', {
    method: 'POST',
    body: JSON.stringify(claimData),
  }),

  approveClaim: (claimId, performedBy = 1, notes = '') => fetchApi(`/claims/${claimId}/approve/`, {
    method: 'POST',
    body: JSON.stringify({ performed_by: performedBy, verification_notes: notes }),
  }),

  rejectClaim: (claimId, performedBy = 1, reason = '') => fetchApi(`/claims/${claimId}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ performed_by: performedBy, reason }),
  }),

  getAuditLogs: () => fetchApi('/audit-logs/'),

  getUsers: () => fetchApi('/users/'),

  createUser: (userData) => fetchApi('/users/', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};
