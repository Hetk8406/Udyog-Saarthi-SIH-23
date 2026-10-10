'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import JobCard from '@/components/jobs/JobCard';
import JobFilters from '@/components/jobs/JobFilters';
import { getJobs } from '@/services/jobService';
import { Job, JobFilterParams } from '@/types/job';

export default function JobsDirectoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<JobFilterParams>({
    sector: 'all',
    work_mode: 'all',
    education: 'all',
    disability: 'all',
    page: 1,
  });

  const loadJobs = useCallback(async (filterParams: JobFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobs(filterParams);
      setJobs(data.results);
      setTotalCount(data.count);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs(filters);
  }, [filters, loadJobs]);

  const handleFilterChange = (newFilters: JobFilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const defaultFilters: JobFilterParams = {
      search: '',
      location: '',
      sector: 'all',
      work_mode: 'all',
      education: 'all',
      disability: 'all',
      page: 1,
    };
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCount / 9);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 uppercase">
              Opportunity Directory
            </span>
            <span className="text-xs text-amber-900 font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Demo Openings
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Find Accessible Jobs & Vacancies
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Browse verified opportunities across Government Ministries, PSUs, and Equal-Opportunity Private Employers with explicit disability reservations and workplace accommodations.
          </p>
        </div>

        <div className="text-right shrink-0">
          <Link
            href="/dashboard/saved-jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition"
          >
            <span>★</span>
            <span>View Saved Jobs</span>
          </Link>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Results List */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <JobFilters
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          totalCount={totalCount}
        />

        {/* Results Container */}
        <main className="flex-1 space-y-4">
          <h2 className="sr-only">Available Job Vacancies</h2>
          {/* Results Summary Bar */}
          <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
            <span>
              Showing <strong className="text-slate-900">{jobs.length}</strong> of{' '}
              <strong className="text-slate-900">{totalCount}</strong> active vacancies
            </span>
            {filters.sector && filters.sector !== 'all' && (
              <span className="font-semibold text-blue-700">
                Filtered: {filters.sector.toUpperCase()}
              </span>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="status" aria-live="polite">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-10 bg-slate-100 rounded"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div role="alert" className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <p className="text-sm font-bold text-red-900">Unable to load job postings.</p>
              <p className="text-xs text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => loadJobs(filters)}
                className="px-4 py-2 bg-red-700 text-white rounded-md text-xs font-bold hover:bg-red-800"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && jobs.length === 0 && (
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                🔍
              </div>
              <h2 className="text-base font-bold text-slate-800">No matching vacancies found</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No vacancies matched your selected filters. Try broadening your keywords, choosing &quot;All Sectors&quot;, or clearing your location search.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-lg hover:bg-blue-800"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Jobs Grid */}
          {!loading && !error && jobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <nav aria-label="Pagination" className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between mt-6">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                ← Previous Page
              </button>

              <span className="text-xs text-slate-600 font-medium">
                Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next Page →
              </button>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
