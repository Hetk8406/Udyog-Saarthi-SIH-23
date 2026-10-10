import React from 'react';
import Link from 'next/link';
import { legalConfig } from '@/config/legal';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Understand how Udyog Saarthi protects your personal, disability, and accessibility data in accordance with India’s DPDP Act, 2023.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Draft Notice Banner (Shown until LEGAL_REVIEWED=True in production environment) */}
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
              This document is a plain-language preliminary draft prepared for {legalConfig.organizationName}. It will undergo formal review by qualified legal counsel prior to final public launch. To remove this banner in production, set NEXT_PUBLIC_LEGAL_REVIEWED=true.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Last Updated: <time dateTime="2026-10-09" className="font-semibold text-slate-900">{legalConfig.lastUpdatedDate}</time>
        </p>
        <p className="mt-3 text-base text-slate-700 leading-relaxed">
          Udyog Saarthi is committed to safeguarding your privacy and dignity. This policy explains what information we collect, why we collect it, how it is kept secure, and how you retain full control over your personal data.
        </p>
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-700 text-blue-900 text-xs sm:text-sm rounded-r">
          <strong>DPDP Act Compliance:</strong> This platform is designed in accordance with the principles of the <em>Digital Personal Data Protection Act, 2023 (DPDP Act, 2023)</em> of India, emphasizing lawful consent, purpose limitation, data minimization, and strong individual rights.
        </div>
      </div>

      {/* Main Body */}
      <div className="space-y-8 text-slate-800 text-sm sm:text-base leading-relaxed">
        {/* Section 1 */}
        <section aria-labelledby="section-collect">
          <h2 id="section-collect" className="text-xl font-bold text-slate-900 mb-3">
            1. What Information We Collect
          </h2>
          <p className="mb-3">
            We only collect information that is strictly necessary to assist you with finding accessible jobs, requesting examination accommodations, and preparing for careers.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <strong>Account Information:</strong> Your full name, email address, mobile phone number, and account role (Candidate or Parent/Guardian).
            </li>
            <li>
              <strong>Profile & Professional Details:</strong> Educational qualifications, technical skills, prior work or apprenticeship experience, and employment preferences (preferred sector, work mode, location, expected salary).
            </li>
            <li>
              <strong>Disability & Accessibility Information:</strong> Disability category recognized under the RPwD Act (e.g., Locomotor, Visual, Hearing, Intellectual, Autism, etc.), self-reported Washington Group functional difficulty levels, and specific accommodation requirements (e.g., scribe support, compensatory extra time, wheelchair ramps, screen-reader workstations).
            </li>
            <li>
              <strong>UDID Details:</strong> Your Unique Disability Identity Card (UDID) number and verification status, used solely to confirm eligibility for statutory reservation vacancies.
            </li>
            <li>
              <strong>Uploaded Documents:</strong> Resumes, educational and training certificates, and other supporting career documents uploaded to support your job applications. (Note: UDID certificates are not stored as file uploads; UDID credentials are verified numerically).
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section aria-labelledby="section-why">
          <h2 id="section-why" className="text-xl font-bold text-slate-900 mb-3">
            2. Why We Collect It (Purpose of Processing)
          </h2>
          <p className="mb-2">We process your data exclusively for legitimate assistive purposes:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>To match you with government, PSU, and inclusive private job vacancies that provide the accommodations you need.</li>
            <li>To recommend relevant learning courses and identify weak subjects in practice mock tests.</li>
            <li>To enable your assigned Job Coach to offer tailored career guidance and interview preparation.</li>
            <li>To communicate application deadlines, exam notices, and important service updates.</li>
          </ul>
          <p className="mt-3 font-semibold text-slate-900">
            We never sell, rent, or trade your personal or disability data to data brokers or third-party advertisers.
          </p>
        </section>

        {/* Section 3 */}
        <section aria-labelledby="section-who-sees">
          <h2 id="section-who-sees" className="text-xl font-bold text-slate-900 mb-3">
            3. Who Can See Your Information
          </h2>
          <p className="mb-3">
            We enforce strict role-based access control and confidentiality safeguards:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-bold text-slate-900">You (The Candidate)</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                You have complete visibility and edit access over your profile, preferences, uploaded files, and applications.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-bold text-slate-900">Your Assigned Job Coach</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                A verified coach can only view candidates assigned to them, restricted to career profiles and notes to assist your employment journey.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-bold text-slate-900">Parent / Guardian</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                A registered guardian can only view details that you have explicitly granted them access to through your consent settings.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-bold text-slate-900">System Administrators</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Authorized staff have restricted access strictly for platform maintenance and technical support. Every administrative access event is immutably logged in an audit trail.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-50 border-l-4 border-slate-500 rounded-r text-xs sm:text-sm text-slate-700">
            <strong>Third-Party Processing &amp; AI Explanations:</strong> When you use our optional AI Job Explainer (powered by Google Gemini on the backend), <em>only the public job vacancy description and your question about that vacancy are sent to the AI service</em>. Zero candidate personal data, names, phone numbers, disability classifications, or UDID credentials are ever transmitted to external AI providers.
          </div>
        </section>

        {/* Section 4 */}
        <section aria-labelledby="section-documents">
          <h2 id="section-documents" className="text-xl font-bold text-slate-900 mb-3">
            4. Candidate Documents &amp; Private Storage Protection
          </h2>
          <p className="mb-3">
            When you upload supporting career documents (such as resumes, educational degrees, or skill training certificates), they are protected by comprehensive privacy and encryption protocols:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <strong>Zero Public Access:</strong> Files are stored in private, unlisted cloud storage buckets (AWS S3 or Cloudflare R2) or isolated non-public local storage. Direct public HTTP access and bucket directory listings are permanently blocked.
            </li>
            <li>
              <strong>Expiring Signed URLs:</strong> Documents cannot be viewed via permanent links. All downloads require an authenticated request that generates a temporary, cryptographically signed URL valid for only five (5) minutes.
            </li>
            <li>
              <strong>Strict Role-Based Authorization:</strong> Access is limited exclusively to the candidate, an assigned job coach, a registered guardian (only if you explicitly enable document viewing permissions), and authorized administrators. All unauthorized requests are blocked (HTTP 403 Forbidden).
            </li>
            <li>
              <strong>Security Audit Logging:</strong> Every document download by anyone other than the candidate, as well as all administrative access, is recorded in an immutable security audit log with timestamps and user identification.
            </li>
            <li>
              <strong>Immediate Deletion:</strong> When you delete a document from your profile or close your candidate account, the underlying physical file in storage is permanently purged immediately.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section aria-labelledby="section-retention">
          <h2 id="section-retention" className="text-xl font-bold text-slate-900 mb-3">
            5. How Long We Keep Your Data
          </h2>
          <p>
            Your information is retained for as long as your account remains active on Udyog Saarthi. If you choose to close or delete your account, your personal information, UDID records, and uploaded documents will be permanently purged within thirty (30) days, except for anonymized statistical logs or records required to be retained by statutory legal obligations.
          </p>
        </section>

        {/* Section 6 */}
        <section aria-labelledby="section-rights">
          <h2 id="section-rights" className="text-xl font-bold text-slate-900 mb-3">
            6. Your Rights Under DPDP Act, 2023
          </h2>
          <p className="mb-3">You possess fundamental digital personal data rights:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li><strong>Right to Access:</strong> You can review all personal data stored in your account at any time.</li>
            <li><strong>Right to Correction & Updating:</strong> You can edit and update outdated qualifications, contact details, or accessibility preferences.</li>
            <li><strong>Right to Erasure / Deletion:</strong> You have the right to request full deletion of your profile, test attempts, and uploaded documents.</li>
            <li><strong>Right to Withdraw Consent:</strong> You may revoke consent for guardian access or optional notifications at any time.</li>
            <li><strong>Right to Grievance Redressal:</strong> You can file a grievance with our designated Grievance Officer if you believe your data has been mishandled.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section aria-labelledby="section-cookies">
          <h2 id="section-cookies" className="text-xl font-bold text-slate-900 mb-3">
            7. Cookies and Tracking Technologies
          </h2>
          <p className="mb-2">We use cookies transparently and conservatively:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <strong>Essential Cookies:</strong> Required for secure login sessions, CSRF protection, and persisting your accessibility preferences (e.g., High Contrast Mode, large text sizing). These run automatically.
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Used to understand site performance and visitor trends. These <em>only run after you explicitly click &quot;Accept&quot;</em> on our cookie banner. You can change your preference anytime via the &quot;Cookie Settings&quot; link in the footer.
            </li>
          </ul>
        </section>

        {/* Section 8 */}
        <section aria-labelledby="section-contact">
          <h2 id="section-contact" className="text-xl font-bold text-slate-900 mb-3">
            8. How to Contact Us &amp; Grievance Redressal
          </h2>
          <p className="mb-3">
            For questions about this policy, data deletion requests, or privacy concerns, please contact our designated Grievance Officer:
          </p>
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 font-mono text-xs sm:text-sm text-slate-800">
            <p><strong>Grievance Officer:</strong> {legalConfig.grievanceOfficerName}</p>
            <p><strong>Official Email:</strong> <a href={`mailto:${legalConfig.grievanceOfficerEmail}`} className="text-blue-700 underline">{legalConfig.grievanceOfficerEmail}</a></p>
            <p><strong>Helpline Phone:</strong> {legalConfig.helplinePhone}</p>
            <p><strong>Postal Address:</strong> {legalConfig.postalAddress}</p>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            We endeavor to acknowledge privacy inquiries within 48 hours and resolve formal grievances within thirty (30) days.
          </p>
        </section>
      </div>

      {/* Back to Home CTA */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-bold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 rounded p-1"
        >
          ← Return to Home
        </Link>
        <Link
          href="/terms"
          className="text-sm font-bold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 rounded p-1"
        >
          Read Terms of Service →
        </Link>
      </div>
    </div>
  );
}
