'use client';

// ============================================
// Protected Route Component
// ============================================
// Wraps pages that require authentication.
// Redirects to login if user is not authenticated.
// ============================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, getCurrentUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for token
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        // No token, redirect to login
        router.replace('/auth/login');
        return;
      }

      // Validate token with server
      try {
        await getCurrentUser();
        setIsChecking(false);
      } catch {
        // Token invalid
        router.replace('/auth/login');
      }
    };

    checkAuth();
  }, [getCurrentUser, router]);

  // Show loading while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated, render children
  return <>{children}</>;
}
