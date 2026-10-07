import axios from 'axios';

export const TOKEN_KEY = 'bustrack_token';

const DEFAULT_API_BASE_URL = 'https://bustracking-backend.onrender.com';

function apiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (!configuredUrl) return `${DEFAULT_API_BASE_URL}/api`;

  try {
    const url = new URL(configuredUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    return `${url.toString().replace(/\/$/, '').replace(/\/api$/, '')}/api`;
  } catch {
    console.warn('Invalid VITE_API_URL. Falling back to the production backend URL.');
    return `${DEFAULT_API_BASE_URL}/api`;
  }
}

const api = axios.create({
  baseURL: apiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) =>
  e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server' : e?.message) || 'Something went wrong';

export default api;
