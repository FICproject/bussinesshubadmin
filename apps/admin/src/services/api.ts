import { AdminRole, AdminUser } from '@fic/shared-types';

const TOKEN_KEY = 'fic_admin_token';
const USER_KEY = 'fic_admin_user';

// Base API URL configurable via environment variable VITE_API_BASE_URL (defaults to Render backend in production, or relative / empty for dev proxy)
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://fic-businesshub-backend.onrender.com' : '')
).replace(/\/+$/, '');

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

export async function apiFetch<T = any>(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
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

  const timeoutMs = options.timeoutMs ?? 25000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (fetchErr: any) {
    if (fetchErr.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please check backend connection and retry.`);
    }
    throw new Error(fetchErr.message || 'Network error: could not connect to server.');
  } finally {
    clearTimeout(timeoutId);
  }

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
    throw new Error(data.details || data.error || data.message || 'Request failed');
  }

  // If data has an inner data object, preserve success & message properties while returning the payload
  if (data.data !== undefined && data.data !== null) {
    if (typeof data.data === 'object' && !Array.isArray(data.data)) {
      return {
        success: true,
        message: data.message,
        ...data.data,
      };
    }
    return data.data;
  }

  return data;
}


function parseFilenameFromDispositionHeader(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const simpleMatch = disposition.match(/filename="?([^";\r\n]+)"?/i);
  return simpleMatch?.[1] || fallback;
}

export async function fetchAdminDocumentBlob(
  documentId: string,
  options?: { variant?: 'preview' | 'thumbnail' | 'original'; action?: 'view' | 'download' }
): Promise<{
  blobUrl: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  checksum: string | null;
  variantServed: string | null;
}> {
  const { token } = getStoredAuth();
  const action = options?.action || 'view';
  const variantQuery =
    action === 'view' ? `?variant=${encodeURIComponent(options?.variant || 'preview')}` : '';
  const url = `${API_BASE_URL}/api/admin/documents/${encodeURIComponent(documentId)}/${action}${variantQuery}`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Failed to load document (${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const fileName = parseFilenameFromDispositionHeader(
    response.headers.get('Content-Disposition'),
    `${documentId}`
  );
  return {
    blobUrl,
    blob,
    mimeType: response.headers.get('Content-Type') || blob.type || 'application/octet-stream',
    fileName,
    checksum: response.headers.get('X-Original-Checksum-Sha256'),
    variantServed: response.headers.get('X-Document-Variant')
  };
}

export async function downloadAdminOriginalDocument(
  documentId: string,
  fallbackFileName?: string
): Promise<void> {
  const res = await fetchAdminDocumentBlob(documentId, { action: 'download' });
  const link = document.createElement('a');
  link.href = res.blobUrl;
  link.download = fallbackFileName || res.fileName || documentId;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(res.blobUrl), 15000);
}
