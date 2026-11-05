import { AdminRole, AdminUser } from '@fic/shared-types';

const TOKEN_KEY = 'fic_admin_token';
const USER_KEY = 'fic_admin_user';

// Base API URL configurable via environment variable VITE_API_BASE_URL (defaults to empty string for relative proxying)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const getStoredAuth = (): { token: string | null; user: AdminUser | null } => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  let user: AdminUser | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      user = null;
    }
  }
  return { token, user };
};

export const setStoredAuth = (token: string, user: AdminUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { token } = getStoredAuth();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Server returned non-JSON response (${response.status})`);
    }
  } else {
    data = { success: response.ok };
  }

  if (!response.ok || !data.success) {
    // If the token is invalid or expired, clear stale credentials and redirect to login
    if (response.status === 401 || data.error?.includes('session token') || data.error?.includes('Authorization token')) {
      clearStoredAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data.data;
}

