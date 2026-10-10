import React from 'react';

export default function SuccessStoriesLoading() {
  return (
    <div
      role="status"
      aria-label="Loading success stories"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12"
    >
      <span className="sr-only">Loading achievement and success stories, please wait...</span>

      {/* Header Skeleton */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="h-6 w-36 mx-auto bg-emerald-100 rounded-full animate-pulse" />
        <div className="h-9 w-80 max-w-full mx-auto bg-slate-200 rounded animate-pulse" />
        <div className="h-5 w-96 max-w-full mx-auto bg-slate-100 rounded animate-pulse" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 bg-blue-100 rounded animate-pulse" />
              <div className="h-4 w-28 bg-emerald-100 rounded animate-pulse" />
            </div>
            <div className="h-7 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-blue-100 rounded animate-pulse" />
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
