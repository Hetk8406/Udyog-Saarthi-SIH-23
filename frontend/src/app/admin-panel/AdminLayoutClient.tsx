'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?returnTo=%2Fadmin-panel');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white" aria-live="polite">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-400 border-t-transparent mb-3" />
        <p className="ml-3 font-medium">Verifying Administrator Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Guard: strictly require admin role
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            ⛔
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted (403)</h1>
          <p className="mt-2 text-sm text-slate-600">
            You do not have administrative authority to access <code>/admin-panel</code>.
            Only designated platform administrators may view this control console.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold transition"
            >
              Return to User Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition"
            >
              Log in with Admin Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* High-visibility Administrative Header */}
      <header role="banner" className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin-panel"
              className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded p-1"
            >
              <div className="w-8 h-8 rounded bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                AD
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white block leading-tight">
                  Udyog Saarthi
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block leading-none">
                  Central Admin Console
                </span>
              </div>
            </Link>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 ml-2">
              GOVT & PSU MONITOR
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-200 leading-tight">
                {user.full_name}
              </span>
              <span className="block text-[10px] font-mono text-emerald-400">
                ADMIN PRIVILEGES ACTIVE
              </span>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Exit to User Portal
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main id="main-content" role="main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Admin Safety Footer */}
      <footer role="contentinfo" className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          Udyog Saarthi Administrative Engine • All mutation actions are logged in the <strong>Audit Log</strong> for compliance and accountability.
        </p>
      </footer>
    </div>
  );
}
