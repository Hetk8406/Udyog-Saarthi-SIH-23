'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('Application error occurred:', error?.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-700 text-3xl font-black mb-2 shadow-inner">
        !
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
          We encountered an unexpected problem while loading this page. You can try refreshing the page or navigating back to safety.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        >
          Try Again ↺
        </button>
        <Link
          href="/"
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        >
          Return to Home
        </Link>
        <Link
          href="/support"
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
