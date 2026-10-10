import React from 'react';

export default function LearningLoading() {
  return (
    <div
      role="status"
      aria-label="Loading learning center"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      <span className="sr-only">Loading study materials and mock tests, please wait...</span>

      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-60 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <div className="h-9 w-32 bg-blue-100 rounded-lg animate-pulse" />
        <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-6 w-4/5 bg-slate-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-blue-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
