import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessible Employment & Exam Preparation for Persons with Disabilities',
  description:
    'Discover government, PSU, and inclusive private jobs with disability reservations. Practice mock tests, get exam accommodations, and receive dedicated job coach support.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-4 border border-blue-200">
          <span>Smart India Hackathon Problem Statement 1333</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Accessible Career Opportunities for <span className="text-blue-700">Persons with Disabilities</span>
        </h1>
        <p className="mt-4 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          From finding government, PSU, and inclusive private jobs to mock exams, accommodation assistance,
          and dedicated job coaching — your complete career companion.
        </p>

        {/* Primary Action Button (Homepage Single Clear CTA: Create Profile) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all transform hover:-translate-y-0.5"
          >
            Create Profile →
          </Link>
          <Link
            href="/jobs"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-200 transition"
          >
            Explore Jobs
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-base border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200 transition"
          >
            Log In
          </Link>
        </div>

        {/* Main Hero Image */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white p-3 sm:p-4">
          <Image
            src="/images/hero-illustration.webp"
            alt="Overview of accessible employment pathways, mock tests, and coaching support"
            width={800}
            height={450}
            priority
            className="w-full h-auto rounded-xl object-cover"
          />
        </div>
      </section>

      {/* Demo Credentials Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-800 font-bold text-base">Demo Credentials for Quick Testing (Phase 1):</span>
          </div>
          <p className="text-xs text-amber-900 mb-4">
            You can immediately log in with any of these pre-seeded demo accounts using password{' '}
            <code className="bg-amber-200 px-1 py-0.5 rounded font-mono font-bold">Password123!</code>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-amber-200">
              <span className="font-bold text-slate-800 block">Candidate</span>
              <code className="text-slate-600 block mt-1 break-all">candidate@demo.com</code>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-200">
              <span className="font-bold text-slate-800 block">Guardian</span>
              <code className="text-slate-600 block mt-1 break-all">guardian@demo.com</code>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-200">
              <span className="font-bold text-slate-800 block">Job Coach</span>
              <code className="text-slate-600 block mt-1 break-all">coach@demo.com</code>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-200">
              <span className="font-bold text-slate-800 block">Administrator</span>
              <code className="text-slate-600 block mt-1 break-all">admin@demo.com</code>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xl mb-4">
              1
            </div>
            <h2 className="text-lg font-bold text-slate-900">Equal Job Discovery</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Explore verified vacancies in Government ministries, PSUs, and equal-opportunity private firms,
              complete with detailed accessibility and accommodation criteria.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xl mb-4">
              2
            </div>
            <h2 className="text-lg font-bold text-slate-900">Accessible Exam Prep</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Prepare with accessible study materials, model question papers, and flexible mock examinations
              tailored to candidate accommodation profiles.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xl mb-4">
              3
            </div>
            <h2 className="text-lg font-bold text-slate-900">Dedicated Support</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Receive assistance for exam scribes, logistics, and personalized guidance from certified
              job coaches and counsellors throughout your hiring journey.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
