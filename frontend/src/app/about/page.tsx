import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Our Mission & Platform',
  description:
    'Learn about Udyog Saarthi, an inclusive career platform built for Smart India Hackathon 2023 to bridge employment and examination accessibility gaps for Persons with Disabilities.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold mb-4 border border-blue-200">
          Smart India Hackathon 2023 • Problem Statement 1333
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About Udyog Saarthi
        </h1>
        <p className="mt-3 text-lg text-slate-600 leading-relaxed max-w-3xl">
          An accessible career companion empowering Persons with Disabilities (PwDs) across India to discover public and private employment, prepare for competitive exams, and thrive with dignity.
        </p>
      </div>

      {/* Story & Problem */}
      <div className="space-y-10 text-slate-800 leading-relaxed">
        <section aria-labelledby="about-mission">
          <h2 id="about-mission" className="text-2xl font-bold text-slate-900 mb-3">
            Our Mission
          </h2>
          <p className="text-slate-700">
            Employment is not merely a livelihood; it is autonomy, self-reliance, and dignity. Millions of talented Persons with Disabilities in India face severe barriers: inaccessible recruitment portals, convoluted official gazette notifications, lack of assistive exam accommodations, and fragmented support networks.
          </p>
          <p className="text-slate-700 mt-3">
            Udyog Saarthi bridges this divide by delivering a unified, WCAG 2.1 AAA-compatible portal that puts accessibility first in every interaction.
          </p>
        </section>

        {/* Mission Illustration */}
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-3 shadow-sm">
          <Image
            src="/images/inclusion-mission.webp"
            alt="Four core pillars of Udyog Saarthi: Discovery, Preparation, Coaching, and AI Helper"
            width={960}
            height={480}
            loading="lazy"
            className="w-full h-auto rounded-lg object-cover"
          />
        </div>

        {/* 4 Pillars */}
        <section aria-labelledby="about-pillars">
          <h2 id="about-pillars" className="text-2xl font-bold text-slate-900 mb-6">
            Four Core Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-2xl" aria-hidden="true">🎯</span>
              <h3 className="font-bold text-lg text-slate-900 mt-2">Explainable Job Matching</h3>
              <p className="text-sm text-slate-600 mt-2">
                Clear scoring based on skills, education, and location. We explain exactly <em>why</em> an opportunity matched and never use disability type to rule candidates out.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-2xl" aria-hidden="true">🤖</span>
              <h3 className="font-bold text-lg text-slate-900 mt-2">Plain-Language Assistant</h3>
              <p className="text-sm text-slate-600 mt-2">
                Converts dense, bureaucratic 40-page exam notifications into crisp 4-bullet summaries: What is this role? Who can apply? What accommodations exist? What is the deadline?
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-2xl" aria-hidden="true">📝</span>
              <h3 className="font-bold text-lg text-slate-900 mt-2">Accessible Mock Examinations</h3>
              <p className="text-sm text-slate-600 mt-2">
                Full keyboard navigation, customizable timers, scribe accommodation toggles, and subject-wise diagnostic scorecards that pinpoint weak subjects.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-2xl" aria-hidden="true">🤝</span>
              <h3 className="font-bold text-lg text-slate-900 mt-2">Dedicated Job Coaches</h3>
              <p className="text-sm text-slate-600 mt-2">
                Connects candidates and guardians with verified coaches who provide personalized mentoring, application guidance, and workplace readiness advice.
              </p>
            </div>
          </div>
        </section>

        {/* DPDP Act Commitment */}
        <section aria-labelledby="about-privacy" className="p-6 bg-slate-900 text-white rounded-2xl">
          <h2 id="about-privacy" className="text-xl font-bold mb-2 text-white">
            Commitment to Data Dignity &amp; DPDP Act, 2023
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Personal disability and UDID information belongs exclusively to the candidate. We enforce strict role scoping: job coaches only see candidates assigned to them, guardians only see what the candidate explicitly permits, and non-essential cookies run only after explicit consent.
          </p>
        </section>

        {/* CTA */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/jobs"
            className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          >
            Explore Accessible Vacancies →
          </Link>
          <Link
            href="/learning"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
          >
            Practice Mock Tests
          </Link>
        </div>
      </div>
    </div>
  );
}
