'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  function handleOpenCookieSettings() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    }
  }

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Purpose */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/logo-white.svg"
                alt="Udyog Saarthi — Empowering Every Ability"
                width={170}
                height={38}
                className="h-8 w-auto"
              />
              <h2 className="sr-only">Udyog Saarthi</h2>
            </div>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              An accessible employment platform built to assist Persons with Disabilities (PwDs)
              in finding jobs, preparing for competitive exams, and building long-term careers.
            </p>
            <p className="mt-3 text-xs text-amber-400 font-medium">
              Smart India Hackathon 2023 — Problem Statement 1333
            </p>
          </div>

          {/* Column 2: Accessibility Commitment */}
          <div>
            <h2 className="text-white text-base font-semibold">Accessibility</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Designed according to WCAG 2.1 guidelines with high contrast mode, text scaling,
              screen-reader support, and keyboard accessibility.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              <li>• Keyboard navigable (Tab & Enter)</li>
              <li>• Screen reader optimized</li>
              <li>• WCAG AAA contrast compatible</li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div>
            <h2 className="text-white text-base font-semibold">Quick Links</h2>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/learning" className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded">
                  Learning & Mock Tests
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded">
                  Candidate Login
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded">
                  Submit Feedback
                </Link>
              </li>
              <li>
                <Link href="/admin-panel" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded">
                  Admin Console ⚙
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Privacy */}
          <div>
            <h2 className="text-white text-base font-semibold">Legal & Privacy</h2>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Designed with India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act, 2023) in mind.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookieSettings}
                  className="text-left hover:text-white underline-offset-4 hover:underline focus:outline-none focus:ring-1 focus:ring-amber-400 rounded block text-amber-300"
                >
                  Cookie Settings ⚙
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-300">
          <p>© {new Date().getFullYear()} Udyog Saarthi. Developed for accessible and inclusive employment.</p>
        </div>
      </div>
    </footer>
  );
}
