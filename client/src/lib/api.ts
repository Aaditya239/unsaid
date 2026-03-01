// ============================================
// API Client Configuration
// ============================================
// Axios instance configured for authentication with
// automatic token refresh and error handling.
// ============================================

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Add custom config type for Axios
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for cookies
});

// Request interceptor - adds access token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token is sent via httpOnly cookie automatically
    // For mobile/API clients, we can also send via header
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 1. Immediately bypass if skipAuthRedirect is set
    if (error.response?.status === 401 && originalRequest.skipAuthRedirect) {
      return Promise.reject(error);
    }

    // Skip token refresh for auth routes (login, signup, etc.)
    const isAuthRoute = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/refresh');

    // If error is 401 and we haven't retried yet (and not an auth route)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data.data;

        // Store new token (for mobile clients)
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed
        processQueue(refreshError as Error, null);

        // Skip global logout/redirect if skipAuthRedirect is set
        if (originalRequest.skipAuthRedirect) {
          return Promise.reject(refreshError);
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          // Trigger logout event
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Direct check for 401 without refresh trial (e.g. if refresh token itself is missing or invalid)
    // but ONLY if it wasn't already handled by the logic above.
    // However, the above logic is trial-based. If trial fails, it comes to `catch(refreshError)`.

    return Promise.reject(error);
  }
);

export default api;
