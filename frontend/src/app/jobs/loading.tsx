import React from 'react';

export default function JobsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading job opportunities"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      <span className="sr-only">Loading available job listings, please wait...</span>

      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="h-7 w-20 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-7 w-24 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-7 w-28 bg-slate-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Job Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
            </div>

            <div className="flex gap-2 flex-wrap pt-2">
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
            </div>

            <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
              <div className="h-9 w-24 bg-blue-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
