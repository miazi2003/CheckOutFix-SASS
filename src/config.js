const apiBase = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : import.meta.env.VITE_API_BASE_URL;

if (!apiBase) {
  throw new Error('Missing VITE_API_BASE_URL for production build');
}

export const API_BASE = apiBase.replace(/\/+$/, '');
