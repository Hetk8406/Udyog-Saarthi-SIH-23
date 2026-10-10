import React from 'react';

export default function JobDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading job details"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      <span className="sr-only">Loading job details, please wait...</span>

      {/* Back button skeleton */}
      <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />

      {/* Job Hero Skeleton */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="h-8 sm:h-10 w-4/5 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-slate-200 rounded animate-pulse" />
          </div>

          <div className="flex sm:flex-col gap-3">
            <div className="h-11 w-32 bg-blue-200 rounded-lg animate-pulse" />
            <div className="h-11 w-28 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Key Info Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="h-6 w-44 bg-slate-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-20 w-full bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
