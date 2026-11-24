const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
let devUserId = 'user-1';

function getStoredToken() {
  return localStorage.getItem('ecosync_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
}

export function setDevUserId(userId) {
  devUserId = userId || 'user-1';
}

export function hasRealToken() {
  return Boolean(getStoredToken());
}

export function notifyPointsUpdated() {
  window.dispatchEvent(new CustomEvent('ecosync:points-updated'));
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else headers.set('x-dev-user-id', devUserId);

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message =
      typeof body === 'object' && body?.error
        ? (typeof body.error === 'object' && body.error?.message ? body.error.message : String(body.error))
        : `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export const appsApi = {
  list: () => apiRequest('/api/apps'),
  create: (app) => apiRequest('/api/apps', { method: 'POST', body: JSON.stringify(app) }),
  remove: (id) => apiRequest(`/api/apps/${id}`, { method: 'DELETE' })
};

export const co2Api = {
  estimateTravel: (data) => apiRequest('/api/co2/travel/estimate', { method: 'POST', body: JSON.stringify(data) }),
  saveTravel: (data) => apiRequest('/api/co2/travel', { method: 'POST', body: JSON.stringify(data) }),
  pendingFood: (data) => apiRequest('/api/co2/food/pending', { method: 'POST', body: JSON.stringify(data) }),
  logFood: (id, data) => apiRequest(`/api/co2/food/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  logs: (status) => apiRequest(`/api/co2/logs${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  summary: () => apiRequest('/api/co2/summary')
};

export const pointsApi = {
  summary: () => apiRequest('/api/points/summary'),
  history: (months = 6) => apiRequest(`/api/points/history?months=${months}`),
  ledger: (limit = 30) => apiRequest(`/api/points/ledger?limit=${limit}`)
};

export const rewardsApi = {
  list: () => apiRequest('/api/rewards'),
  redeem: (id) => apiRequest(`/api/rewards/${id}/redeem`, { method: 'POST' }),
  mine: () => apiRequest('/api/rewards/mine'),
  wallet: () => apiRequest('/api/rewards/wallet'),
  use: (id) => apiRequest(`/api/rewards/wallet/${id}/use`, { method: 'PATCH' })
};
