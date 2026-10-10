'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  loadingSkeleton?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  loadingSkeleton,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const returnTo = search ? `${pathname}${search}` : pathname;
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    if (loadingSkeleton) return <>{loadingSkeleton}</>;
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium text-sm">Verifying your account session...</p>
        </div>
      </div>
    );
  }

  // Prevent flashing protected content before redirect completes
  if (!user) {
    return null;
  }

  // Check role authorization if restricted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            ⛔
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted (403)</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account does not have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
