'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { SuccessStoryItem } from '@/types/admin';

export default function PublicSuccessStoriesPage() {
  const [stories, setStories] = useState<SuccessStoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await adminService.getPublicSuccessStories();
        setStories(data);
      } catch (err) {
        console.error('Failed to load success stories', err);
      } finally {
        setLoading(false);
      }
    }
    loadStories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Inspiring Journeys
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Voices of Achievement & Inclusion
        </h1>
        <p className="text-slate-600 text-base sm:text-lg">
          Authentic stories of persons with disabilities who prepared, persevered, and secured rewarding careers across government departments, PSUs, and inclusive private enterprises.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-slate-600 text-sm">Loading success stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <p className="text-slate-500">Stories are being updated. Check back shortly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <article
              key={story.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {story.sector}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold">
                    ✓ Verified Placement
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {story.candidate_name}
                </h2>
                <p className="text-sm font-semibold text-blue-700 mt-0.5">
                  {story.job_title}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  {story.organization_name}
                </p>

                <div className="space-y-3 text-xs leading-relaxed text-slate-700 pt-3 border-t border-slate-100">
                  <div>
                    <strong className="block text-slate-900 mb-0.5 font-bold">The Journey:</strong>
                    <p className="text-slate-600">{story.journey}</p>
                  </div>

                  <div>
                    <strong className="block text-slate-900 mb-0.5 font-bold">Challenges Navigated:</strong>
                    <p className="text-slate-600">{story.challenges_faced}</p>
                  </div>

                  <div>
                    <strong className="block text-slate-900 mb-0.5 font-bold">Support Provided:</strong>
                    <p className="text-slate-600">{story.how_support_helped}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <span className="block text-[11px] font-bold uppercase text-slate-500">Final Outcome:</span>
                <span className="block text-xs font-extrabold text-slate-900 mt-0.5">
                  {story.outcome}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Encouragement CTA */}
      <div className="bg-blue-900 text-white rounded-2xl p-8 sm:p-10 text-center shadow-lg space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to begin your employment journey?</h2>
        <p className="text-blue-200 max-w-xl mx-auto text-sm sm:text-base">
          Join thousands of candidates preparing with accessible mock tests, clear vacancy notifications, and dedicated job coaches.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/register"
            className="px-6 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-lg shadow transition text-sm"
          >
            Create Your Candidate Profile
          </Link>
          <Link
            href="/jobs"
            className="px-6 py-2.5 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-lg border border-blue-700 transition text-sm"
          >
            Explore PwD Vacancies
          </Link>
        </div>
      </div>
    </div>
  );
}
