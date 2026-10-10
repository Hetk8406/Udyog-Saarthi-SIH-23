'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getJobDetail } from '@/services/jobService';
import { Job } from '@/types/job';

function DemoPortalContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(jobId));

  useEffect(() => {
    async function fetchJob() {
      if (!jobId) return;
      try {
        const data = await getJobDetail(jobId);
        setJob(data);
      } catch {
        // Fallback to generic simulation
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Official Government Look-and-Feel Header */}
      <header className="bg-slate-900 text-white border-b-4 border-amber-500 py-4 px-6 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-xl shrink-0">
              🏛️
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold block">
                Official Recruitment & Examination Service (Simulation)
              </span>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">
                {job ? job.organization.name : 'Central Recruitment & Examination Authority'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-400 text-slate-950 px-2.5 py-1 rounded font-extrabold uppercase">
              Demo Simulation
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Banner Explaining Hand-off */}
        <div
          role="region"
          aria-label="Simulation Notice"
          className="p-5 bg-blue-50 border-2 border-blue-400 rounded-xl shadow-sm text-blue-950 space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            <h2 className="font-bold text-sm sm:text-base">
              Hand-Off to Official Recruitment Portal Demonstrated Successfully
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
            In real-world recruitments, you would now be on the hiring authority&apos;s official portal (such as SSC, UPSC, State PSC, or Banking recruitment sites).
            For this hackathon prototype, this page demonstrates how candidates complete their official filing and return to <strong>Udyog Saarthi</strong> to track their admit card, examination schedules, and results.
          </p>
        </div>

        {/* Mock Application Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block">
              Simulated Registration Acknowledgement
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {loading ? 'Loading vacancy details...' : job ? job.title : 'Online Application Submission Portal'}
            </h3>
            {job && (
              <p className="text-xs font-medium text-slate-600 mt-1">
                Recruitment Cycle 2026-27 • Sector: {job.sector_display} • Location: {job.location_city}, {job.location_state}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Registration / Acknowledgement ID</span>
              <span className="font-mono font-bold text-base text-slate-900 block">
                US-GOV-2026-{jobId ? jobId.slice(0, 8).toUpperCase() : '7842'}
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-1">
              <span className="text-emerald-800 block">Application Filing Status</span>
              <span className="font-bold text-base text-emerald-950 block">
                ✓ Recorded & Initiated
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-800 block">
              PwD Accommodations & Reservation Request Handled:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Candidate disability reservation quota claim verified via Udyog Saarthi profile.</li>
              <li>Compensatory examination time (20 min/hr) & ground-floor test center logged.</li>
              <li>Scribe / reader assistance request acknowledged for admit card generation.</li>
            </ul>
          </div>

          {/* Action Back to Udyog Saarthi Tracker */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-600">
              Your application has also been logged in your Udyog Saarthi application tracker.
            </p>

            <Link
              href="/dashboard/applications"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-md transition"
            >
              ← Back to My Applications Tracker
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DemoPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-slate-600">
          Loading simulated recruitment portal...
        </div>
      }
    >
      <DemoPortalContent />
    </Suspense>
  );
}
