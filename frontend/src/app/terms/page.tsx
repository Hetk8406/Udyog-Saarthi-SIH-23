import React from 'react';
import Link from 'next/link';
import { legalConfig } from '@/config/legal';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms and Conditions governing the use of the Udyog Saarthi accessible employment and examination prep portal.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Draft Notice Banner */}
      {!legalConfig.isReviewed && (
        <div
          role="alert"
          aria-label="Legal draft notice"
          className="mb-8 p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-amber-950 flex items-start gap-3 shadow-sm"
        >
          <span className="text-2xl" aria-hidden="true">⚠️</span>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wide text-amber-900">
              Draft — Needs Legal Review Before Launch
            </h2>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              This document is a plain-language draft of the platform terms and conditions. It requires formal legal review and approval before production deployment.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Last Updated: <time dateTime={legalConfig.lastUpdatedDate} className="font-semibold text-slate-900">{legalConfig.lastUpdatedDate}</time>
        </p>
        <p className="mt-3 text-base text-slate-700 leading-relaxed">
          Welcome to {legalConfig.organizationName}. These Terms of Service outline the rules and expectations for using our platform. By registering an account or browsing vacancies, you agree to these terms in full.
        </p>
      </div>

      {/* Main Body */}
      <div className="space-y-8 text-slate-800 text-sm sm:text-base leading-relaxed">
        {/* Section 1 */}
        <section aria-labelledby="section-purpose">
          <h2 id="section-purpose" className="text-xl font-bold text-slate-900 mb-3">
            1. What This Platform Is — And What It Is Not
          </h2>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-950">What Udyog Saarthi Is:</h3>
              <p className="text-xs sm:text-sm text-blue-900 mt-1">
                A non-profit, assistive platform designed to index accessible job opportunities, explain complex exam notifications in plain words, provide practice mock tests, and connect Persons with Disabilities (PwDs) with supportive job coaches.
              </p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-950">What Udyog Saarthi Is NOT:</h3>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-red-900 mt-1">
                <li>
                  <strong>We do not guarantee jobs:</strong> Using this platform or attempting mock tests does not guarantee an interview, selection, or employment with any government department, public sector undertaking, or private employer.
                </li>
                <li>
                  <strong>We do not submit external applications for you:</strong> For government and external employer vacancies, Udyog Saarthi provides guidance and simulation links, but <em>you are solely responsible for completing and submitting your final application on the official recruiting portal</em>.
                </li>
                <li>
                  <strong>We do not make legal or medical eligibility determinations:</strong> AI-powered explainers and matching indicators are assistive tools only and do not constitute legal, medical, or statutory qualification decisions.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section aria-labelledby="section-verify">
          <h2 id="section-verify" className="text-xl font-bold text-slate-900 mb-3">
            2. Mandatory Verification of Official Notifications
          </h2>
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-xs sm:text-sm">
            <p className="font-bold mb-1">Always Refer to the Official Recruitment Gazette / Notification:</p>
            <p>
              While we make every effort to keep job details, reservation quotas, eligibility criteria, and deadlines accurate, official terms set by the recruiting authority (e.g., UPSC, SSC, IBPS, State PSCs) are legally binding. In the event of any conflict between information on Udyog Saarthi and the official recruitment advertisement, <strong>the official notification published by the recruiting body prevails</strong>.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section aria-labelledby="section-account">
          <h2 id="section-account" className="text-xl font-bold text-slate-900 mb-3">
            3. Account Rules & Eligibility
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <strong>Accurate Information:</strong> You agree to provide accurate, current, and complete personal and educational information. You must not misrepresent your disability category or submit forged UDID certificates.
            </li>
            <li>
              <strong>Account Confidentiality:</strong> You are responsible for keeping your password and authentication credentials secure. Do not share your login credentials with unauthorized third parties.
            </li>
            <li>
              <strong>Guardian Assistance:</strong> A registered parent or guardian may assist a candidate only with their explicit knowledge and consent, and must act at all times in the candidate’s best interests.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section aria-labelledby="section-acceptable">
          <h2 id="section-acceptable" className="text-xl font-bold text-slate-900 mb-3">
            4. Acceptable Use Policy
          </h2>
          <p className="mb-2">When using Udyog Saarthi, you agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>Submit fraudulent, deceptive, or offensive content in support tickets, reviews, or job applications.</li>
            <li>Harass, intimidate, or abuse assigned job coaches, administrators, or fellow candidates.</li>
            <li>Use automated bots, web scrapers, or scripts to extract user profiles, job listings, or exam questions without prior written authorization.</li>
            <li>Attempt to bypass rate limits, security throttles, or access controls.</li>
          </ul>
          <p className="mt-3 text-xs sm:text-sm text-slate-600">
            Violation of this acceptable use policy may result in immediate account suspension, cancellation of coach assignments, and reporting to relevant statutory authorities if fraud is detected.
          </p>
        </section>

        {/* Section 5 */}
        <section aria-labelledby="section-ip">
          <h2 id="section-ip" className="text-xl font-bold text-slate-900 mb-3">
            5. Intellectual Property
          </h2>
          <p>
            The software, accessible user interface designs, mock test algorithms, and branding of Udyog Saarthi are protected by applicable intellectual property laws. Public government job descriptions and exam syllabi remain the intellectual property of their respective recruiting agencies.
          </p>
        </section>

        {/* Section 6 */}
        <section aria-labelledby="section-liability">
          <h2 id="section-liability" className="text-xl font-bold text-slate-900 mb-3">
            6. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted under applicable law, Udyog Saarthi and its affiliated developers, contributors, and partners shall not be held liable for any indirect, incidental, special, or consequential damages resulting from inability to access vacancies, missed application deadlines, third-party server downtimes, or recruitment outcomes.
          </p>
        </section>

        {/* Section 7 */}
        <section aria-labelledby="section-contact-terms">
          <h2 id="section-contact-terms" className="text-xl font-bold text-slate-900 mb-3">
            7. Contact & Legal Inquiries
          </h2>
          <p className="mb-3">
            If you have questions regarding these Terms of Service or need assistance, please contact our administrative team:
          </p>
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-1 font-mono text-xs sm:text-sm text-slate-800">
            <p><strong>Organization:</strong> {legalConfig.organizationName}</p>
            <p><strong>Legal & Administrative Team:</strong> <a href={`mailto:${legalConfig.legalEmail}`} className="text-blue-700 underline">{legalConfig.legalEmail}</a></p>
            <p><strong>Support Desk:</strong> <a href={`mailto:${legalConfig.contactEmail}`} className="text-blue-700 underline">{legalConfig.contactEmail}</a></p>
            <p><strong>Postal Address:</strong> {legalConfig.postalAddress}</p>
          </div>
        </section>
      </div>

      {/* Navigation Footer */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-bold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 rounded p-1"
        >
          ← Return to Home
        </Link>
        <Link
          href="/privacy-policy"
          className="text-sm font-bold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 rounded p-1"
        >
          Read Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
