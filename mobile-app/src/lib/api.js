// Klien REST untuk Learning Path Service (backend kelompok sendiri).
// Alamat diatur lewat EXPO_PUBLIC_API_URL di mobile-app/.env

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://thehistoryofid.stei.site/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

/** Dipanggil saat token ditolak server (401) agar user otomatis logout. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      e.name === 'AbortError'
        ? 'Server tidak merespons (timeout). Periksa koneksi internet.'
        : `Tidak bisa terhubung ke server.\n${API_URL}`
    );
  } finally {
    clearTimeout(timer);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error;
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw new ApiError(res.status, err?.code || `HTTP_${res.status}`, err?.message || `Request gagal (${res.status})`, err?.details);
  }
  return data;
}

/** Pesan error yang ramah, termasuk detail validasi per field. */
export function errorMessage(error) {
  if (!error) return '';
  if (error.details?.length) return error.details.map((d) => `• ${d.message}`).join('\n');
  return error.message || 'Terjadi kesalahan';
}

export const Api = {
  health: () => request('/health'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: { name, email, password } }),
  me: () => request('/me'),
  updateMe: (changes) => request('/me', { method: 'PUT', body: changes }),
  eras: () => request('/eras'),
  eraChapters: (eraId) => request(`/eras/${eraId}/chapters`),
  chapter: (id) => request(`/chapters/${id}`),
  markWatched: (id) => request(`/chapters/${id}/watched`, { method: 'POST' }),
  quiz: (id) => request(`/chapters/${id}/quiz`),
  submitQuiz: (id, answers) => request(`/chapters/${id}/quiz/submit`, { method: 'POST', body: { answers } }),
  progress: () => request('/me/progress'),
  // Tes awal & tes lompat
  myPlacement: () => request('/me/placement'),
  placement: (retake) => request(`/placement${retake ? '?retake=true' : ''}`),
  submitPlacement: (answers, retake) =>
    request('/placement/submit', { method: 'POST', body: { answers, ...(retake ? { retake: true } : {}) } }),
  testOutQuiz: (eraId) => request(`/eras/${eraId}/test-out`),
  submitTestOut: (eraId, answers) => request(`/eras/${eraId}/test-out`, { method: 'POST', body: { answers } }),
  // Detail tokoh/peristiwa + ringkasan Wikipedia
  item: (id) => request(`/items/${id}`),
};
