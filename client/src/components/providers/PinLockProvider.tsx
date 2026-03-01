'use client';

// ============================================
// PIN Lock Provider
// ============================================
// Wraps the app and handles:
// - Auto-lock on inactivity
// - Lock screen display
// ============================================

import { useEffect, useCallback, useRef } from 'react';
import { usePinLockStore } from '@/stores/pinLockStore';
import { useAuthStore } from '@/stores/authStore';
import PinLockScreen from '@/components/auth/PinLockScreen';

// PIN lock timeout (default: 1 minute of inactivity)
const PIN_LOCK_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_PIN_LOCK_TIMEOUT || '60000'
);

interface PinLockProviderProps {
  children: React.ReactNode;
}

export function PinLockProvider({ children }: PinLockProviderProps) {
  const { isLocked, isEnabled, lock, lastUnlockTime } = usePinLockStore();
  const { isAuthenticated } = useAuthStore();
  
  const timeoutRef = useRef<NodeJS.Timeout>();

  // ============================================
  // AUTO-LOCK ON INACTIVITY
  // ============================================

  const resetLockTimer = useCallback(() => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timer if PIN lock is enabled and user is authenticated
    if (isEnabled && isAuthenticated && !isLocked) {
      timeoutRef.current = setTimeout(() => {
        console.log('Auto-lock due to inactivity');
        lock();
      }, PIN_LOCK_TIMEOUT);
    }
  }, [isEnabled, isAuthenticated, isLocked, lock]);

  // Set up activity listeners for PIN lock
  useEffect(() => {
    if (!isEnabled || !isAuthenticated || isLocked) return;

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
    ];

    // Throttle activity updates
    let throttleTimeout: NodeJS.Timeout;
    const throttledReset = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        resetLockTimer();
        throttleTimeout = undefined as any;
      }, 5000); // Throttle to 5 seconds
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initial timer
    resetLockTimer();

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
  }, [isEnabled, isAuthenticated, isLocked, resetLockTimer]);

  // ============================================
  // LOCK ON VISIBILITY CHANGE
  // ============================================

  useEffect(() => {
    if (!isEnabled || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Lock when user switches away
        lock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, isAuthenticated, lock]);

  // ============================================
  // RENDER
  // ============================================

  // Show lock screen if locked
  if (isLocked && isAuthenticated) {
    return <PinLockScreen />;
  }

  return <>{children}</>;
}
