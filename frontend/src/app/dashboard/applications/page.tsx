'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getApplications, updateApplicationStatus } from '@/services/applicationService';
import { JobApplicationItem, ApplicationStatusType } from '@/types/application';
import StatusTimeline from '@/components/applications/StatusTimeline';

// Milestone options candidates can manually record (PRD Section 12)
const CANDIDATE_ADVANCE_STATUSES: { value: ApplicationStatusType; label: string }[] = [
  { value: 'admit_card_released', label: 'Admit Card Received' },
  { value: 'exam_scheduled', label: 'Exam Scheduled' },
  { value: 'exam_attended', label: 'Exam Attended' },
  { value: 'result_published', label: 'Result Published' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_attended', label: 'Interview Attended' },
  { value: 'selected', label: 'Selected / Offer Received' },
  { value: 'withdrawn', label: 'Withdraw Application' },
];

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<JobApplicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Milestone Update Modal State
  const [selectedAppForUpdate, setSelectedAppForUpdate] = useState<JobApplicationItem | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatusType>('exam_attended');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  async function loadApplications() {
    setLoading(true);
    setError(null);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load applications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  // Handle milestone update submit
  async function handleUpdateStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppForUpdate) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      await updateApplicationStatus(selectedAppForUpdate.id, newStatus, statusNotes);
      // Close modal and refresh list
      setSelectedAppForUpdate(null);
      setStatusNotes('');
      await loadApplications();
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update application status.');
    } finally {
      setUpdating(false);
    }
  }

  // Filter application list
  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'applied') return ['app_started', 'applied', 'submitted'].includes(app.status);
    if (activeFilter === 'exam') return ['admit_card_released', 'exam_scheduled', 'exam_attended'].includes(app.status);
    if (activeFilter === 'interview') return ['result_published', 'interview_scheduled', 'interview_attended'].includes(app.status);
    if (activeFilter === 'selected') return ['selected', 'placed'].includes(app.status);
    if (activeFilter === 'closed') return ['rejected', 'withdrawn', 'expired'].includes(app.status);
    return true;
  });

  const getStatusBadge = (status: ApplicationStatusType) => {
    if (['selected', 'placed'].includes(status)) {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
    if (['rejected', 'withdrawn', 'expired'].includes(status)) {
      return 'bg-slate-100 text-slate-700 border-slate-300';
    }
    if (['interview_scheduled', 'interview_attended'].includes(status)) {
      return 'bg-purple-100 text-purple-900 border-purple-300';
    }
    if (['exam_scheduled', 'exam_attended', 'admit_card_released'].includes(status)) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    return 'bg-blue-100 text-blue-900 border-blue-300';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-500 mb-1" aria-label="Breadcrumb">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900 font-semibold">My Applications</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Track Job Applications
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time stage tracking and milestones for all your internal and government portal job applications.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition shrink-0"
        >
          🔍 Browse More Vacancies
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { key: 'all', label: `All (${applications.length})` },
          { key: 'applied', label: 'Applied / In Review' },
          { key: 'exam', label: 'Examinations' },
          { key: 'interview', label: 'Interviews' },
          { key: 'selected', label: 'Selected / Offers' },
          { key: 'closed', label: 'Closed' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              activeFilter === tab.key
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center" role="status" aria-live="polite">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-slate-600 font-medium text-sm">Loading your applications...</p>
        </div>
      )}

      {error && !loading && (
        <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-900 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredApps.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            📋
          </div>
          <h2 className="text-lg font-bold text-slate-900">No applications found in this stage</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {activeFilter === 'all'
              ? 'You have not applied for any vacancies yet. Explore accessible positions tailored for Persons with Disabilities.'
              : 'There are currently no job applications matching this stage filter.'}
          </p>
          <Link
            href="/jobs"
            className="inline-block px-5 py-2.5 bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-800"
          >
            Explore Jobs & Internships
          </Link>
        </div>
      )}

      {/* Applications List */}
      {!loading && !error && filteredApps.length > 0 && (
        <div className="space-y-6">
          {filteredApps.map((app) => (
            <article
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status_display}
                    </span>

                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {app.application_type_display}
                    </span>

                    <span className="text-xs text-slate-500">
                      Applied: {new Date(app.applied_at || app.updated_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    <Link href={`/jobs/${app.job.id}`} className="hover:text-blue-700 transition">
                      {app.job.title}
                    </Link>
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {app.job.organization?.name} • {app.job.location_city}, {app.job.location_state} ({app.job.work_mode_display})
                  </p>
                </div>

                {/* Milestone Update CTA */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAppForUpdate(app);
                      setNewStatus(app.status);
                      setStatusNotes('');
                      setUpdateError(null);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition"
                  >
                    ✏️ Update Milestone
                  </button>

                  <Link
                    href={`/jobs/${app.job.id}`}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition"
                  >
                    View Job Details
                  </Link>
                </div>
              </div>

              {/* Requested Accommodations & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    Requested Accommodations:
                  </span>
                  {app.accommodations_requested && app.accommodations_requested.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {app.accommodations_requested.map((acc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded font-medium text-[11px]"
                        >
                          ✓ {acc}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500">None specified.</span>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">
                    Applicant Notes & Roll No.:
                  </span>
                  <p className="text-slate-700">
                    {app.candidate_notes ? app.candidate_notes : 'No personal notes attached.'}
                  </p>
                </div>
              </div>

              {/* Progress Timeline Component */}
              <div className="pt-2">
                <StatusTimeline
                  currentStatus={app.status}
                  currentStatusDisplay={app.status_display}
                  history={app.status_history || []}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MILESTONE UPDATE MODAL */}
      {selectedAppForUpdate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="milestone-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Milestone Progression
                </span>
                <h3 id="milestone-modal-title" className="text-base font-bold text-slate-900">
                  Update {selectedAppForUpdate.job.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppForUpdate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-6 space-y-4">
              {updateError && (
                <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs rounded-lg font-medium">
                  {updateError}
                </div>
              )}

              <div>
                <label htmlFor="new-status-select" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  New Status / Milestone:
                </label>
                <select
                  id="new-status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStatusType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
                >
                  {CANDIDATE_ADVANCE_STATUSES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status-notes" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Notes / Details <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="status-notes"
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Received admit card with center in Lucknow; requested scribe confirmed."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                <strong>Audit Trail Notice:</strong> Every status update is recorded in your application history timeline to maintain an honest and accurate recruitment record.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForUpdate(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  {updating ? 'Saving Milestone...' : 'Save Milestone ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
