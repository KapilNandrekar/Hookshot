const BASE_URL = 'http://localhost:5001';

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = localStorage.getItem('hookshot_token');

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }

  if (res.status === 401 && path !== '/api/auth/login') {
    localStorage.removeItem('hookshot_token');
    window.location.href = '/login';
  }

  return { status: res.status, headers: res.headers, data };
}

export const api = {
  signup: (email, password) => request('/api/auth/signup', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),

  listEndpoints: () => request('/api/endpoints'),
  createEndpoint: (url) => request('/api/endpoints', { method: 'POST', body: { url } }),
  patchEndpoint: (id, body) => request(`/api/endpoints/${id}`, { method: 'PATCH', body }),
  deleteEndpoint: (id) => request(`/api/endpoints/${id}`, { method: 'DELETE' }),

  listEvents: () => request('/api/events'),
  sendEvent: (type, data, idempotencyKey) =>
    request('/api/events', { method: 'POST', body: { type, data }, headers: { 'Idempotency-Key': idempotencyKey } }),

  systemHealth: () => request('/api/debug/cache-stats'),
};
