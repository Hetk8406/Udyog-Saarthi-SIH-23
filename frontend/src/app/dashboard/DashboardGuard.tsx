'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLoading from './loading';

export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute loadingSkeleton={<DashboardLoading />}>
      {children}
    </ProtectedRoute>
  );
}
