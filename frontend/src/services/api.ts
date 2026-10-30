/// <reference types="vite/client" />
// In production, set VITE_API_URL to your absolute backend URL, e.g.:
// VITE_API_URL=https://cafekhoj-api.onrender.com/api/v1
// Automatically normalizes base so both 'https://.../api/v1' and 'https://...' work without duplicate segments.
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
function getApiBase(): string {
  // Vite's relative API route is proxied locally, but Vercel has no /api
  // backend rewrite. Point production builds at the deployed Django API when
  // VITE_API_URL is not explicitly configured.
  if (!rawApiUrl) {
    return import.meta.env.PROD
      ? 'https://cafekhoj-api.onrender.com/api/v1'
      : '/api/v1';
  }
  const clean = rawApiUrl.replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}
const API_BASE: string = getApiBase();
const PUBLIC_ENDPOINTS_WITHOUT_BEARER = new Set([
  '/auth/login/',
  '/auth/register/',
  '/auth/verify-otp/',
  '/auth/resend-otp/',
  '/auth/password-reset/',
  '/auth/password-reset/confirm/',
  '/health/',
  '/locations/',
]);

function getOrCreateDeviceId(): string {
  let devId = localStorage.getItem('cafekhoj_device_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem('cafekhoj_device_id', devId);
  }
  return devId;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-Id': getOrCreateDeviceId(),
    'X-Device-Name': navigator?.userAgent ? navigator.userAgent.substring(0, 80) : 'Web Client',
    ...(options.headers as Record<string, string>),
  };

  const requestPath = endpoint.split('?')[0];
  const token = PUBLIC_ENDPOINTS_WITHOUT_BEARER.has(requestPath)
    ? null
    : localStorage.getItem('cafekhoj_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    // Attempt token refresh
    const refreshToken = localStorage.getItem('cafekhoj_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          const access = refreshed.access as string | undefined;
          if (!access) {
            throw new Error('The token refresh response did not include an access token.');
          }
          localStorage.setItem('cafekhoj_access_token', access);
          // SimpleJWT can rotate refresh tokens. Persist the replacement so the
          // next refresh does not keep presenting a stale token.
          if (typeof refreshed.refresh === 'string') {
            localStorage.setItem('cafekhoj_refresh_token', refreshed.refresh);
          }
          headers['Authorization'] = `Bearer ${access}`;
          const retryRes = await fetch(url, { ...options, headers });
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => ({}));
            throw new ApiError(errData.detail || errData.error || 'Request failed', retryRes.status, errData);
          }
          return retryRes.json();
        }
      } catch (e) {
        // Clear expired tokens
        localStorage.removeItem('cafekhoj_access_token');
        localStorage.removeItem('cafekhoj_refresh_token');
        localStorage.removeItem('cafekhoj_user');
      }
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    let message = errData.detail || errData.error;
    if (!message) {
      if (Array.isArray(errData)) {
        message = errData[0];
      } else if (typeof errData === 'object' && errData !== null) {
        const firstKey = Object.keys(errData)[0];
        if (firstKey) {
          const val = errData[firstKey];
          message = Array.isArray(val) ? `${val[0]}` : String(val);
        }
      }
    }
    message = message || 'An unexpected error occurred';
    throw new ApiError(message, response.status, errData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth & OTP
  login: (data: any) => request<any>('/auth/login/', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<any>('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  verifyOTP: (email: string, code: string) => request<any>('/auth/verify-otp/', { method: 'POST', body: JSON.stringify({ email, code }) }),
  resendOTP: (email: string) => request<any>('/auth/resend-otp/', { method: 'POST', body: JSON.stringify({ email }) }),
  requestPasswordReset: (email: string) => request<any>('/auth/password-reset/', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmPasswordReset: (data: { email: string; code: string; password: string; confirm_password: string }) =>
    request<any>('/auth/password-reset/confirm/', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me/'),
  updateMe: (data: any) => request<any>('/auth/me/', { method: 'PATCH', body: JSON.stringify(data) }),

  // Operator Device Sessions
  getOperatorDevices: () => request<any[]>('/auth/devices/'),
  deauthorizeDevice: (id: number) => request<any>(`/auth/devices/${id}/deauthorize/`, { method: 'POST' }),

  // Cafes
  getCafes: (params?: Record<string, string | number | boolean | undefined>) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') q.append(k, String(v));
      });
    }
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<any>(`/cafes/${queryStr}`);
  },
  getCafeBySlug: (slug: string) => request<any>(`/cafes/${slug}/`),
  getNearbyCafes: (lat: number, lng: number, radius = 15) =>
    request<any[]>(`/cafes/nearby/?lat=${lat}&lng=${lng}&radius=${radius}`),
  createCafe: (data: any) => request<any>('/cafes/create/', { method: 'POST', body: JSON.stringify(data) }),
  updateCafe: (id: number, data: any) => request<any>(`/cafes/${id}/update/`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Metadata & System
  checkHealth: () => request<{ status: string; database: string; service: string }>('/health/'),
  getCategories: () => request<any[]>('/categories/'),
  getFacilities: () => request<any[]>('/facilities/'),
  getLocations: () => request<any[]>('/locations/'),
  globalSearch: (q: string) => request<any>(`/search/?q=${encodeURIComponent(q)}`),

  // Reviews
  getCafeReviews: (cafeId: number, params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return request<any>(`/cafes/${cafeId}/reviews/${q ? `?${q}` : ''}`);
  },
  submitReview: (cafeId: number, data: { rating: number; review_text: string; visit_date?: string }) =>
    request<any>(`/cafes/${cafeId}/reviews/`, { method: 'POST', body: JSON.stringify(data) }),
  deleteReview: (reviewId: number) => request<void>(`/reviews/${reviewId}/`, { method: 'DELETE' }),
  markReviewHelpful: (reviewId: number) => request<any>(`/reviews/${reviewId}/helpful/`, { method: 'POST' }),
  reportReview: (reviewId: number, data: { reason: string; details?: string }) =>
    request<any>(`/reviews/${reviewId}/report/`, { method: 'POST', body: JSON.stringify(data) }),
  respondReview: (reviewId: number, response_text: string) =>
    request<any>(`/reviews/${reviewId}/respond/`, { method: 'POST', body: JSON.stringify({ response_text }) }),

  // Favourites
  toggleFavourite: (cafeId: number) =>
    request<{ is_favourited: boolean; message: string }>('/favourites/', { method: 'POST', body: JSON.stringify({ cafe_id: cafeId }) }),
  getUserFavourites: () => request<any>('/me/favourites/'),
  getUserReviews: () => request<any>('/me/reviews/'),

  // Business Claims & Subscriptions
  submitClaim: (data: any) => request<any>('/business-claims/', { method: 'POST', body: JSON.stringify(data) }),
  getUserClaims: () => request<any>('/business-claims/'),
  getBusinessDashboard: () => request<any>('/business/dashboard/'),
  getBusinessPromotions: (cafeId?: number) =>
    request<any>(`/business/promotions/${cafeId ? `?cafe_id=${cafeId}` : ''}`),
  createPromotion: (data: any) => request<any>('/business/promotions/', { method: 'POST', body: JSON.stringify(data) }),
  getSubscriptionPlans: () => request<any[]>('/subscription-plans/'),
  inquireSubscription: (data: { cafe_id: number; plan_id: number; payment_method_intent?: string; notes?: string }) =>
    request<any>('/subscriptions/inquire/', { method: 'POST', body: JSON.stringify(data) }),

  // Menu Items
  getMenuItems: (cafeId: number) => request<any[]>(`/menu-items/?cafe_id=${cafeId}`),
  createMenuItem: (data: any) => request<any>('/menu-items/', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: number, data: any) => request<any>(`/menu-items/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMenuItem: (id: number) => request<void>(`/menu-items/${id}/`, { method: 'DELETE' }),

  // Admin Portal Endpoints
  getAdminDashboard: () => request<any>('/admin-api/dashboard/'),
  getAdminReports: () => request<any>('/admin-api/reports/'),
  resolveAdminReport: (id: number, status: string) =>
    request<any>(`/admin-api/reports/${id}/resolve/`, { method: 'POST', body: JSON.stringify({ status }) }),
  reviewAdminClaim: (id: number, decision: 'approve' | 'reject', admin_notes = '', rejection_reason = '') =>
    request<any>(`/admin-api/claims/${id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ decision, admin_notes, rejection_reason }),
    }),
  moderateAdminReview: (id: number, moderation_status: string) =>
    request<any>(`/admin-api/reviews/${id}/moderate/`, {
      method: 'POST',
      body: JSON.stringify({ moderation_status }),
    }),
  getAdminCafes: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return request<any>(`/admin-api/cafes/${q ? `?${q}` : ''}`);
  },
  reviewAdminCafe: (id: number, action: string, admin_notes = '', rejection_reason = '') =>
    request<any>(`/admin-api/cafes/${id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ action, admin_notes, rejection_reason }),
    }),
  syncAdminCafeGoogle: (id: number, google_place_id?: string) =>
    request<any>(`/admin-api/cafes/${id}/sync-google/`, {
      method: 'POST',
      body: JSON.stringify({ google_place_id }),
    }),
  getAdminDeviceRequests: (status?: string) =>
    request<any[]>(`/admin-api/devices/${status ? `?status=${status}` : ''}`),
  reviewAdminDeviceRequest: (id: number, decision: 'approve' | 'reject', admin_notes = '') =>
    request<any>(`/admin-api/devices/${id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ decision, admin_notes }),
    }),
  getAdminNotifications: (is_read?: boolean) =>
    request<any[]>(`/admin-api/notifications/${is_read !== undefined ? `?is_read=${is_read}` : ''}`),
  markAdminNotificationRead: (id: number) =>
    request<any>(`/admin-api/notifications/${id}/read/`, { method: 'POST' }),
  markAllAdminNotificationsRead: () =>
    request<any>('/admin-api/notifications/read-all/', { method: 'POST' }),
  getPlatformAdministrators: () =>
    request<any[]>('/admin-api/administrators/'),
  delegatePlatformAdministrator: (data: { email: string; full_name?: string; notes?: string }) =>
    request<any>('/admin-api/administrators/delegate/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  importCafesCSV: (formData: FormData) => {
    const token = localStorage.getItem('cafekhoj_access_token');
    return fetch(`${API_BASE}/admin-api/import/`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new ApiError(data.error || 'Import failed', res.status, data);
      return data;
    });
  },
  importCafesCSVText: (csv_text: string, dry_run = false) =>
    request<any>('/admin-api/import/', {
      method: 'POST',
      body: JSON.stringify({ csv_text, dry_run }),
    }),

  // Analytics Tracking
  trackEvent: (event_type: string, cafe_id?: number, metadata: Record<string, any> = {}) => {
    let session = sessionStorage.getItem('cafekhoj_session');
    if (!session) {
      session = `sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
      sessionStorage.setItem('cafekhoj_session', session);
    }
    return request<any>('/analytics/track/', {
      method: 'POST',
      body: JSON.stringify({
        event_type,
        cafe: cafe_id || null,
        anonymous_session_id: session,
        metadata,
      }),
    }).catch(() => {}); // silent fail for telemetry
  },
};
