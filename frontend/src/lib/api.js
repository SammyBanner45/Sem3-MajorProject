const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Shared API fetch utility per contract
 * @param {string} path - Endpoint path (e.g. '/api/tasks' or 'api/tasks') or full URL
 * @param {RequestInit & { token?: string }} [options] - Fetch options
 * @returns {Promise<any>}
 */
export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    token: customToken,
    ...rest
  } = options;

  const authToken = customToken ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('ecosync_token') : null);

  const resolvedHeaders = {
    ...headers,
  };

  if (authToken && !resolvedHeaders['Authorization'] && !resolvedHeaders['authorization']) {
    resolvedHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  let finalBody = body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;

  if (body && typeof body === 'object' && !isFormData && !isBlob) {
    finalBody = JSON.stringify(body);
    if (!resolvedHeaders['Content-Type'] && !resolvedHeaders['content-type']) {
      resolvedHeaders['Content-Type'] = 'application/json';
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${API_URL}${normalizedPath}`;

  const response = await fetch(url, {
    method,
    headers: resolvedHeaders,
    body: finalBody,
    ...rest,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data !== null
      ? (data.error?.message || data.error || data.message)
      : data;
    const message = typeof errorMessage === 'string' && errorMessage
      ? errorMessage
      : response.statusText || `HTTP ${response.status} request failed`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    if (response.status === 401 && typeof window !== 'undefined') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ecosync_token');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
      }
      window.dispatchEvent(new Event('ecosync:unauthorized'));
    }
    throw error;
  }

  return data;
}

export default apiFetch;
