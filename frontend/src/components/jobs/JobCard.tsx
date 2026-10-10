'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Job } from '@/types/job';
import { toggleSaveJob } from '@/services/jobService';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/analytics';

interface JobCardProps {
  job: Job;
  onSavedChange?: (jobId: string, isSaved: boolean) => void;
}

export default function JobCard({ job, onSavedChange }: JobCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState<boolean>(job.is_saved);
  const [saving, setSaving] = useState<boolean>(false);

  // Format days until deadline
  const getDeadlineInfo = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    // Normalize to date without time
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Expired on ${deadline.toLocaleDateString()}`, isUrgent: true, isExpired: true };
    }
    if (diffDays === 0) {
      return { text: 'Last Day to Apply Today!', isUrgent: true, isExpired: false };
    }
    if (diffDays <= 7) {
      return { text: `Closes in ${diffDays} day${diffDays > 1 ? 's' : ''}! (${deadline.toLocaleDateString()})`, isUrgent: true, isExpired: false };
    }
    return { text: `Deadline: ${deadline.toLocaleDateString()} (${diffDays} days left)`, isUrgent: false, isExpired: false };
  };

  const deadlineInfo = getDeadlineInfo(job.application_deadline);

  // Sector Badge Colors
  const getSectorBadge = (sector: string) => {
    switch (sector) {
      case 'government':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'psu':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'private':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  async function handleToggleSave() {
    if (!user) {
      alert('Please log in as a candidate to save and bookmark jobs.');
      return;
    }

    setSaving(true);
    try {
      const res = await toggleSaveJob(job.id);
      setIsSaved(res.saved);
      if (res.saved) {
        trackEvent('job_saved', { jobId: job.id });
      }
      if (onSavedChange) {
        onSavedChange(job.id, res.saved);
      }
    } catch {
      alert('Unable to save job. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      aria-labelledby={`job-title-${job.id}`}
      className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between relative"
    >
      <div>
        {/* Top badges: Sector, Work mode, Demo notice */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className={`px-2.5 py-0.5 rounded-full border ${getSectorBadge(job.sector)}`}>
              {job.sector_display}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {job.work_mode_display}
            </span>
            {job.is_demo_data && (
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] uppercase font-bold border border-amber-300">
                Demo Vacancy
              </span>
            )}
            {job.is_applied && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                ✓ Applied
              </span>
            )}
          </div>

          {/* Bookmark / Save Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={saving}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title} for later`}
            className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg border text-sm font-semibold inline-flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              isSaved
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span aria-hidden="true" className="mr-1">
              {isSaved ? '★' : '☆'}
            </span>
            <span className="text-xs">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Job Title & Organization */}
        <h3 id={`job-title-${job.id}`} className="text-lg font-bold text-slate-900 leading-snug">
          <Link href={`/jobs/${job.id}`} className="hover:text-blue-700 hover:underline">
            {job.title}
          </Link>
        </h3>
        <p className="text-sm font-semibold text-slate-700 mt-1">
          {job.organization.name} • <span className="text-slate-500 font-normal">{job.location_city}, {job.location_state}</span>
        </p>

        {/* Highlights: Salary & PwD Vacancies */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-700">
          {job.salary_display && (
            <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <strong>Salary:</strong> {job.salary_display}
            </div>
          )}
          <div className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-blue-900">
            <strong>Reserved for PwD:</strong> {job.vacancies_pwd_reserved} post{job.vacancies_pwd_reserved > 1 ? 's' : ''}
          </div>
        </div>

        {/* Short description */}
        <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Key Accessibility Provisions Chips */}
        {job.accessibility_facilities && job.accessibility_facilities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {job.accessibility_facilities.slice(0, 2).map((fac, idx) => (
              <span key={idx} className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                ✓ {fac}
              </span>
            ))}
            {job.accessibility_facilities.length > 2 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{job.accessibility_facilities.length - 2} more accommodations
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Deadline Notice & Action */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Visible Deadline Badge */}
        <div
          className={`text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1.5 ${
            deadlineInfo.isUrgent
              ? 'bg-red-100 text-red-900 border border-red-300'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}
        >
          <span aria-hidden="true">⏰</span>
          <span>{deadlineInfo.text}</span>
        </div>

        <Link
          href={`/jobs/${job.id}`}
          className="min-h-[44px] inline-flex items-center justify-center text-xs font-bold text-blue-700 hover:text-blue-900 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-center transition"
        >
          View Full Details →
        </Link>
      </div>
    </article>
  );
}
