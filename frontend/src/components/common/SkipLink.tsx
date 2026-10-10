'use client';

import React from 'react';

/**
 * Accessible Skip Link allowing keyboard and screen reader users
 * to jump directly to the primary page content.
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-amber-400 focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded-md focus:font-semibold focus:shadow-lg focus:outline focus:outline-2 focus:outline-slate-900"
    >
      Skip to main content
    </a>
  );
}
