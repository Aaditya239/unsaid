// ============================================
// Authentication Store (Zustand)
// ============================================
// Global state management for authentication.
// Handles user state, login/logout, and token management.
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api';
import { AxiosError } from 'axios';

type ApiErrorResponse = {
  message?: string;
  error?: string;
  details?: {
    message?: string;
  };
};

const extractApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return (
    axiosError.response?.data?.message ||
    axiosError.response?.data?.error ||
    axiosError.response?.data?.details?.message ||
    fallback
  );
};

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
}

interface AuthActions {
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  updateLastActivity: () => void;
  setUser: (user: User | null) => void;
}

interface SignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type AuthStore = AuthState & AuthActions;

// ============================================
// STORE
// ============================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastActivity: Date.now(),

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Register a new user
       */
      signup: async (data: SignupData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>>(
            '/auth/signup',
            data
          );

          const { user, accessToken } = response.data.data;

          // Store tokens for cross-origin auth
          localStorage.setItem('accessToken', accessToken);
          if (response.data.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
          });
        } catch (error) {
          const message = extractApiErrorMessage(error, 'Signup failed');
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      /**
       * Login user
       */
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>>(
            '/auth/login',
            data
          );

          const { user, accessToken } = response.data.data;

          // Store tokens for cross-origin auth
          localStorage.setItem('accessToken', accessToken);
          if (response.data.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
          });
        } catch (error) {
          const message = extractApiErrorMessage(error, 'Login failed');
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      /**
       * Logout user from current device
       */
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Continue with local logout even if server fails
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      /**
       * Logout from all devices
       */
      logoutAll: async () => {
        try {
          await api.post('/auth/logout-all');
        } catch {
          // Continue with local logout
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      /**
       * Get current authenticated user
       */
      getCurrentUser: async () => {
        set({ isLoading: true });

        try {
          const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
          const { user } = response.data.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            lastActivity: Date.now(),
          });
        } catch {
          // Not authenticated or token expired
          localStorage.removeItem('accessToken');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      /**
       * Clear error message
       */
      clearError: () => set({ error: null }),

      /**
       * Update last activity timestamp
       */
      updateLastActivity: () => set({ lastActivity: Date.now() }),

      /**
       * Set user directly (for external updates)
       */
      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
    }),
    {
      name: 'unsaid-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist necessary fields
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
    }
  )
);

// ============================================
// SELECTORS (for performance optimization)
// ============================================

export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;
