import React from 'react';

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      <span className="sr-only">Loading your dashboard data, please wait...</span>

      {/* Greeting Header Skeleton */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-80 max-w-full bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-blue-100 rounded-lg animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* 2-Column Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border border-slate-100 rounded-lg space-y-2">
                  <div className="h-5 w-2/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded animate-pulse" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
