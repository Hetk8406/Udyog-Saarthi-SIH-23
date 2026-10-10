import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-8">
      {/* Visual Indicator */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-800 text-3xl font-black mb-2 shadow-inner">
        404
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          We could not find the page you are looking for. It may have been moved, renamed, or is temporarily unavailable.
        </p>
      </div>

      {/* Quick Search for Vacancies */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto">
        <form action="/jobs" method="GET" className="space-y-3">
          <label htmlFor="notfound-search" className="block text-sm font-bold text-slate-800 text-left">
            Looking for an employment opportunity?
          </label>
          <div className="flex gap-2">
            <input
              id="notfound-search"
              name="search"
              type="text"
              placeholder="e.g. Clerk, Assistant, IT"
              className="flex-1 min-h-[44px] px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Primary Navigation Actions */}
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Link
          href="/"
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        >
          ← Return to Home
        </Link>
        <Link
          href="/jobs"
          className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        >
          Explore All Jobs
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
