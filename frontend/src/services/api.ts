// Base API client for sending requests to Django backend with HttpOnly cookies & CSRF protection

function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    return 'http://localhost:8000/api';
  }

  throw new Error(
    'NEXT_PUBLIC_API_URL is missing in production environment. Please configure NEXT_PUBLIC_API_URL in your environment variables.'
  );
}

export interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  _isRetry?: boolean;
}

/**
 * Reads the csrftoken cookie set by Django.
 */
export function getCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfTokenPromise: Promise<string | null> | null = null;

/**
 * Returns current CSRF token from cookie or fetches a new one from /api/auth/csrf/
 */
export async function fetchCsrfToken(): Promise<string | null> {
  const existing = getCsrfCookie();
  if (existing) return existing;

  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = (async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/csrf/`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      return data?.csrfToken || getCsrfCookie() || null;
    } catch {
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to rotate refresh token via HttpOnly cookie.
 * Uses a singleton promise to prevent concurrent refresh races.
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const csrfToken = await fetchCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const res = await fetch(`${baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, _isRetry = false, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Allow browser to set boundary for multipart FormData uploads
  if (typeof FormData !== 'undefined' && rest.body instanceof FormData) {
    delete requestHeaders['Content-Type'];
  }

  const method = (rest.method || 'GET').toUpperCase();

  // Attach CSRF token for state-changing HTTP methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = await fetchCsrfToken();
    if (csrfToken) {
      requestHeaders['X-CSRFToken'] = csrfToken;
    }
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: requestHeaders,
      ...rest,
    });
  } catch {
    throw new Error(
      `Cannot connect to backend server at ${url}. Please verify that the backend server is running and accessible.`
    );
  }

  // Handle 401 Unauthorized: Attempt token refresh once before failing
  const isAuthEndpoint =
    endpoint.includes('/auth/token/refresh/') ||
    endpoint.includes('/auth/login/') ||
    endpoint.includes('/auth/register/') ||
    endpoint.includes('/auth/csrf/');

  if (response.status === 401 && !isAuthEndpoint && !_isRetry) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return apiRequest<T>(endpoint, {
        ...options,
        _isRetry: true,
      });
    }

    // Refresh failed: session expired
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth:session-expired', {
          detail: {
            returnTo: window.location.pathname + window.location.search,
          },
        })
      );
    }
  }

  // Parse response body
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.';
    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        if (Array.isArray(val) && val.length > 0) {
          errorMessage = `${firstKey}: ${val[0]}`;
        } else if (typeof val === 'string') {
          errorMessage = `${firstKey}: ${val}`;
        }
      }
    }
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).details = data;
    (error as any).data = data;
    (error as any).isSessionExpired = response.status === 401;
    throw error;
  }

  return data as T;
}
