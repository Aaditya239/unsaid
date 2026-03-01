'use client';

// ============================================
// Authentication Provider
// ============================================
// Wraps the app and handles:
// - Initial auth state check
// - Auto-logout on inactivity
// - Listening for auth events
// ============================================

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Inactivity timeout (default: 5 minutes)
const INACTIVITY_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT || '300000'
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { 
    isAuthenticated, 
    getCurrentUser, 
    logout, 
    updateLastActivity,
    lastActivity 
  } = useAuthStore();
  
  const timeoutRef = useRef<NodeJS.Timeout>();

  // ============================================
  // AUTO-LOGOUT ON INACTIVITY
  // ============================================

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity
    updateLastActivity();

    // Only set timer if authenticated
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        console.log('Auto-logout due to inactivity');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, logout, updateLastActivity]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle to avoid excessive updates
    let throttleTimeout: NodeJS.Timeout;
    const throttledReset = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        resetInactivityTimer();
        throttleTimeout = undefined as any;
      }, 1000); // Throttle to 1 second
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledReset);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // ============================================
  // INITIAL AUTH CHECK
  // ============================================

  useEffect(() => {
    // Check if we have a token and validate it
    const token = localStorage.getItem('accessToken');
    if (token) {
      getCurrentUser().catch(() => {
        // Token invalid, clear it
        localStorage.removeItem('accessToken');
      });
    }
  }, [getCurrentUser]);

  // ============================================
  // AUTH EVENT LISTENERS
  // ============================================

  useEffect(() => {
    // Listen for logout events from API interceptor
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [logout]);

  // ============================================
  // CHECK FOR STALE SESSION ON FOCUS
  // ============================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Check if session has been inactive too long
        const inactiveDuration = Date.now() - lastActivity;
        if (inactiveDuration > INACTIVITY_TIMEOUT) {
          console.log('Session expired while away');
          logout();
        } else {
          // Validate token is still valid
          getCurrentUser().catch(() => {
            logout();
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, lastActivity, logout, getCurrentUser]);

  return <>{children}</>;
}
