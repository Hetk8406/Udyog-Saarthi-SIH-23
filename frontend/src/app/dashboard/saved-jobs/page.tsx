'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSavedJobs, toggleSaveJob } from '@/services/jobService';
import { SavedJobItem } from '@/types/job';

export default function SavedJobsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [savedList, setSavedList] = useState<SavedJobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    async function loadData() {
      try {
        const data = await getSavedJobs();
        setSavedList(data);
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  async function handleRemove(jobId: string) {
    setRemovingId(jobId);
    try {
      await toggleSaveJob(jobId);
      setSavedList((prev) => prev.filter((item) => item.job.id !== jobId));
    } catch {
      alert('Unable to remove saved job.');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium">Loading your bookmarked vacancies...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <Link href="/dashboard" className="text-xs font-semibold text-blue-700 hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            My Saved Jobs ({savedList.length})
          </h1>
          <p className="text-sm text-slate-600">
            Keep track of vacancies you want to review or apply for before deadlines close.
          </p>
        </div>

        <div>
          <Link
            href="/jobs"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
          >
            Explore More Jobs →
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {savedList.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ★
          </div>
          <h2 className="text-base font-bold text-slate-800">No saved vacancies yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you discover an opening you like, click the &quot;Save&quot; star on any job card to save it here.
          </p>
          <Link
            href="/jobs"
            className="inline-block px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
          >
            Browse Job Directory
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedList.map(({ id, job, saved_at }) => (
            <div
              key={id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                    {job.sector_display}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {job.work_mode_display}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  <Link href={`/jobs/${job.id}`} className="hover:text-blue-700 hover:underline">
                    {job.title}
                  </Link>
                </h3>
                <p className="text-xs text-slate-600">
                  {job.organization.name} • {job.location_city}, {job.location_state}
                </p>
                <div className="text-xs font-bold text-red-700">
                  ⏰ Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={removingId === job.id}
                  onClick={() => handleRemove(job.id)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {removingId === job.id ? 'Removing...' : 'Remove'}
                </button>
                <Link
                  href={`/jobs/${job.id}`}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold"
                >
                  View Vacancy →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
