import axios from 'axios';

export const TOKEN_KEY = 'jwt';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    // An expired or invalid token on a protected call: sign out and go to login.
    // (A 401 from the login form itself is just "wrong password", so leave it alone.)
    const url: string = error.config?.url ?? '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthForm && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?expired=1`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
