'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getJobDetail, toggleSaveJob } from '@/services/jobService';
import { Job } from '@/types/job';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/analytics';

const ApplyModal = dynamic(() => import('@/components/applications/ApplyModal'), {
  ssr: false,
});
const JobExplainerModal = dynamic(() => import('@/components/jobs/JobExplainerModal'), {
  ssr: false,
});

interface JobDetailClientProps {
  initialJob?: Job | null;
  jobId: string;
}

export default function JobDetailClient({ initialJob, jobId }: JobDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(initialJob || null);
  const [loading, setLoading] = useState<boolean>(!initialJob);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(initialJob?.is_saved || false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isApplyOpen, setIsApplyOpen] = useState<boolean>(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return;
      if (initialJob && initialJob.id === jobId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getJobDetail(jobId);
        setJob(data);
        setIsSaved(data.is_saved);
      } catch (err: any) {
        setError(err.message || 'Job vacancy not found.');
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [jobId, initialJob]);

  async function handleToggleSave() {
    if (!user) {
      alert('Please log in as a candidate to bookmark jobs.');
      return;
    }
    setSaving(true);
    try {
      const res = await toggleSaveJob(jobId);
      setIsSaved(res.saved);
      if (res.saved) {
        trackEvent('job_saved', { jobId });
      }
    } catch {
      alert('Unable to bookmark job.');
    } finally {
      setSaving(false);
    }
  }

  // Calculate deadline urgency
  const calculateDeadline = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      formatted: deadline.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      diffDays,
      isExpired: diffDays < 0,
      isUrgent: diffDays <= 7,
    };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium">Loading vacancy details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Vacancy Not Found</h1>
        <p className="text-sm text-slate-600">{error || 'The job you requested does not exist or has expired.'}</p>
        <Link
          href="/jobs"
          className="inline-block px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-semibold"
        >
          ← Back to All Vacancies
        </Link>
      </div>
    );
  }

  const deadline = calculateDeadline(job.application_deadline);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
        >
          ← Back to All Jobs
        </Link>
      </div>

      {/* PROMINENT DEADLINE BANNER */}
      <section
        role="alert"
        aria-label="Application deadline notice"
        className={`p-5 sm:p-6 rounded-xl border-2 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          deadline.isExpired
            ? 'bg-red-50 border-red-500 text-red-950'
            : deadline.isUrgent
            ? 'bg-amber-50 border-amber-500 text-amber-950'
            : 'bg-blue-50 border-blue-500 text-blue-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-inner shrink-0">
            ⏰
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wide block opacity-90">
              Official Application Deadline
            </span>
            <span className="text-xl sm:text-2xl font-black block leading-tight">
              {deadline.formatted}
            </span>
            <span className="text-xs font-medium block mt-0.5">
              {deadline.isExpired
                ? 'Applications for this recruitment cycle are now closed.'
                : deadline.diffDays === 0
                ? '⚠️ TODAY is the final date to submit applications!'
                : `Application window closes in ${deadline.diffDays} day${deadline.diffDays > 1 ? 's' : ''}.`}
            </span>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsExplainerOpen(true)}
            className="px-3.5 py-2.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold text-xs shadow-sm transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <span>🤖 Explain in Plain Words</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSave}
            disabled={saving}
            className={`px-4 py-2.5 rounded-lg border font-bold text-xs shadow-sm transition ${
              isSaved
                ? 'bg-amber-400 text-slate-900 border-amber-500 font-extrabold'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isSaved ? '★ Saved' : '☆ Save Job'}
          </button>

          {job.is_applied ? (
            <Link
              href="/dashboard/applications"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-md transition inline-flex items-center gap-1.5"
            >
              <span>✓ Already Applied</span>
              <span className="opacity-90">• Track Status →</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                setIsApplyOpen(true);
              }}
              disabled={deadline.isExpired}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg font-bold text-xs shadow-md transition"
            >
              {deadline.isExpired ? 'Application Closed' : 'Review & Apply →'}
            </button>
          )}
        </div>
      </section>

      {/* Job Title & Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            {job.sector_display}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {job.work_mode_display}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {job.job_type_display}
          </span>
          {job.is_demo_data && (
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Demo Simulation Data
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {job.title}
          </h1>
          <p className="mt-1 text-base text-slate-700 font-semibold">
            {job.organization.name}
            {job.organization.verified && (
              <span className="ml-2 inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Verified Recruiting Agency
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            📍 Location: {job.location_city}, {job.location_state} • Total Vacancies: {job.vacancies_total} (PwD Reserved: {job.vacancies_pwd_reserved})
          </p>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="block text-[11px] text-slate-500 font-bold uppercase">Salary / Pay Scale</span>
            <span className="block text-sm font-extrabold text-slate-900 mt-0.5">{job.salary_display}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="block text-[11px] text-slate-500 font-bold uppercase">Education Required</span>
            <span className="block text-sm font-extrabold text-slate-900 mt-0.5">{job.minimum_education_display}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="block text-[11px] text-slate-500 font-bold uppercase">Min Experience</span>
            <span className="block text-sm font-extrabold text-slate-900 mt-0.5">
              {job.experience_required_months === 0 ? 'Freshers Eligible' : `${job.experience_required_months} Months`}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="block text-[11px] text-slate-500 font-bold uppercase">Exam / Test Date</span>
            <span className="block text-sm font-extrabold text-slate-900 mt-0.5">
              {job.exam_date ? new Date(job.exam_date).toLocaleDateString('en-IN') : 'To Be Announced'}
            </span>
          </div>
        </div>
      </div>

      {/* ACCESSIBILITY & ACCOMMODATIONS PROVIDED */}
      <section
        aria-labelledby="accessibility-facilities-title"
        className="bg-emerald-50/60 p-6 sm:p-7 rounded-xl border border-emerald-200 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">♿</span>
          <h2 id="accessibility-facilities-title" className="text-lg font-bold text-emerald-950">
            Guaranteed Accessibility Facilities &amp; Examination Accommodations
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
          The recruiting authority has confirmed the availability of the following accommodations at test centers and workplace premises:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {job.accessibility_facilities && job.accessibility_facilities.length > 0 ? (
            job.accessibility_facilities.map((fac, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300 shadow-sm flex items-center gap-1.5"
              >
                <span className="text-emerald-700">✓</span> {fac}
              </span>
            ))
          ) : (
            <span className="text-xs text-emerald-800 italic">
              Standard accommodations per RPwD Act guidelines available upon application request.
            </span>
          )}
        </div>
      </section>

      {/* RESERVATION & ELIGIBILITY */}
      <section
        aria-labelledby="eligibility-title"
        className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200 shadow-sm space-y-4"
      >
        <h2 id="eligibility-title" className="text-lg font-bold text-slate-900">
          PwD Category Reservations &amp; Quota
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          This recruitment includes <strong>{job.vacancies_pwd_reserved} reserved vacancies</strong> for candidates belonging to the following recognized disability categories:
        </p>
        <div className="flex flex-wrap gap-2">
          {job.eligible_disabilities && job.eligible_disabilities.length > 0 ? (
            job.eligible_disabilities.map((cat, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200"
              >
                • {cat}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">Open to all recognized disability categories.</span>
          )}
        </div>
      </section>

      {/* JOB DESCRIPTION & RESPONSIBILITIES */}
      <section
        aria-labelledby="desc-title"
        className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200 shadow-sm space-y-6"
      >
        <div>
          <h2 id="desc-title" className="text-lg font-bold text-slate-900 mb-2">
            Job Role &amp; Overview
          </h2>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {job.description}
          </div>
        </div>

        {job.responsibilities && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">Key Job Responsibilities</h3>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.responsibilities}
            </div>
          </div>
        )}
      </section>

      {/* OFFICIAL NOTIFICATION LINK */}
      <section
        aria-labelledby="official-link-title"
        className="bg-slate-100 p-5 rounded-xl border border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
      >
        <div>
          <h2 id="official-link-title" className="font-bold text-slate-900 text-sm">
            Official Recruitment Gazette / Notification
          </h2>
          <p className="text-slate-600 mt-0.5">
            Always verify official age relaxations, quotas, and terms on the recruiting authority&apos;s portal.
          </p>
        </div>
        {job.official_application_url && (
          <a
            href={
              job.is_demo_data || job.official_application_url.includes('example.gov.in')
                ? `/demo-portal?jobId=${job.id}`
                : job.official_application_url
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shrink-0 text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Visit Official Portal ↗
          </a>
        )}
      </section>

      {/* MODALS */}
      <ApplyModal
        job={job}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={() => {
          setIsApplyOpen(false);
          setJob((prev) => (prev ? { ...prev, is_applied: true } : null));
        }}
      />

      <JobExplainerModal
        jobId={job.id}
        jobTitle={job.title}
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </div>
  );
}
