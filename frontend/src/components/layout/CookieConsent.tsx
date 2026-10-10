'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { initAnalytics, teardownAnalytics } from '@/lib/analytics';

export type CookiePreference = 'accepted' | 'rejected' | null;

export default function CookieConsent() {
  const [preference, setPreference] = useState<CookiePreference>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check saved preference on mount
    const saved = localStorage.getItem('cookie_consent') as CookiePreference;
    if (saved) {
      setPreference(saved);
      if (saved === 'accepted') {
        initAnalytics();
      }
    } else {
      // First time visitor - show consent banner
      setIsOpen(true);
    }

    // Listen for footer "Cookie Settings" trigger
    const handleOpenSettings = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-cookie-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('open-cookie-settings', handleOpenSettings);
    };
  }, []);

  function handleAccept() {
    localStorage.setItem('cookie_consent', 'accepted');
    setPreference('accepted');
    setIsOpen(false);
    initializeAnalytics();
  }

  function handleReject() {
    localStorage.setItem('cookie_consent', 'rejected');
    setPreference('rejected');
    setIsOpen(false);
    teardownAnalytics();
  }

  function initializeAnalytics() {
    // Analytics is strictly gated behind explicit consent
    if (typeof window !== 'undefined') {
      (window as any).__ANALYTICS_ENABLED__ = true;
      // Emit event for analytics listeners
      window.dispatchEvent(new CustomEvent('analytics-consent-granted'));
    }
  }

  function disableAnalytics() {
    if (typeof window !== 'undefined') {
      (window as any).__ANALYTICS_ENABLED__ = false;
      window.dispatchEvent(new CustomEvent('analytics-consent-revoked'));
    }
  }

  if (!isOpen) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie consent preferences"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md text-white border-t-2 border-slate-700 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Plain Language Message */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl" aria-hidden="true">🍪</span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Cookie & Accessibility Preferences
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We use essential cookies to maintain secure sessions and keep your accessibility settings (such as high-contrast mode and text scaling) active. With your permission, we also use privacy-respecting analytics to see which exam materials and job listings help candidates most. No advertising cookies are ever used.
          </p>
          <div className="mt-1.5">
            <Link
              href="/privacy-policy"
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
            >
              Read full details in our Privacy Policy
            </Link>
          </div>
        </div>

        {/* Buttons with Equal Visual Weight */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg border-2 border-slate-400 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-center shadow-sm"
          >
            Reject Non-Essential
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg border-2 border-blue-500 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-center shadow-sm"
          >
            Accept All Cookies
          </button>
        </div>
      </div>
    </aside>
  );
}
