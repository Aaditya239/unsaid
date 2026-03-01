'use client';

// ============================================
// Emotional State Provider
// ============================================
// Initializes the unified emotional store when
// the user is authenticated. This ensures all
// emotional data is loaded and available across
// the app.
// ============================================

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useEmotionalStore } from '@/stores/emotionalStore';

interface EmotionalProviderProps {
  children: React.ReactNode;
}

export function EmotionalProvider({ children }: EmotionalProviderProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { initialize, reset, isInitialized } = useEmotionalStore();

  // Initialize emotional store when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isInitialized) {
      initialize();
    }
  }, [isAuthenticated, user, isInitialized, initialize]);

  // Reset emotional store when user logs out
  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      reset();
    }
  }, [isAuthenticated, isInitialized, reset]);

  return <>{children}</>;
}
