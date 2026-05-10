import axios from 'axios';

const normalizeApiBaseUrl = (rawValue) => {
  if (!rawValue) {
    return '/api';
  }

  const trimmed = String(rawValue).trim();
  if (!trimmed) {
    return '/api';
  }

  const sanitized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;

  if (/^https?:\/\//i.test(sanitized)) {
    try {
      const parsed = new URL(sanitized);
      if (!parsed.pathname || parsed.pathname === '/') {
        parsed.pathname = '/api';
      }

      return parsed.toString().replace(/\/$/, '');
    } catch {
      return sanitized;
    }
  }

  return sanitized;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  const payload = error?.response?.data;

  if (typeof payload?.error === 'string') {
    return payload.error;
  }

  if (typeof payload?.message === 'string') {
    return payload.message;
  }

  if (typeof payload?.error?.message === 'string') {
    return payload.error.message;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return fallback;
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  update: (id, data) => api.patch(`/alerts/${id}`, data),
  stats: () => api.get('/alerts/stats/dashboard'),
};

export default api;
