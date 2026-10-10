'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Job } from '@/types/job';
import { submitApplication } from '@/services/applicationService';
import { ApplicationTypeEnum } from '@/types/application';
import { useAuth } from '@/context/AuthContext';
import { applicationSchema, formatZodErrors, FormErrors, ApplicationFormData } from '@/lib/validations';
import { trackEvent } from '@/lib/analytics';
import { getDocuments } from '@/services/documentService';
import { CandidateDocument } from '@/types/document';

interface ApplyModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({ job, isOpen, onClose, onSuccess }: ApplyModalProps) {
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1); // 1 = Accommodations & Notes, 2 = Review Step
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>(
    job.accessibility_facilities || []
  );
  const [candidateNotes, setCandidateNotes] = useState('');
  const [candidateDocuments, setCandidateDocuments] = useState<CandidateDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors<ApplicationFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      const focusFirstElement = () => {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      };
      requestAnimationFrame(focusFirstElement);
      const timer = setTimeout(focusFirstElement, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }
        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      trackEvent('application_started', { jobId: job.id });
      setLoadingDocs(true);
      getDocuments()
        .then((docs) => {
          setCandidateDocuments(docs);
          // By default auto-select active resumes
          const resumeIds = docs.filter((d) => d.document_type === 'resume').map((d) => d.id);
          setSelectedDocumentIds(resumeIds);
        })
        .catch(() => {})
        .finally(() => setLoadingDocs(false));
    }
  }, [isOpen, job.id]);

  if (!isOpen) return null;

  // Distinguish whether job is internal or external
  // Government / PSU jobs with external portal URLs are typically external redirects
  const isExternalJob = Boolean(
    job.official_application_url &&
    (job.sector === 'government' || job.sector === 'psu' || job.official_application_url.includes('http'))
  );

  const applicationType: ApplicationTypeEnum = isExternalJob ? 'external_redirect' : 'internal';

  const accommodationOptions = [
    'Scribe for Examinations',
    'Compensatory Extra Time (20 min/hr)',
    'Sign Language Interpreter',
    'Ground Floor Exam Hall / Ramp Access',
    'Screen Reader Software Workstation',
    'Magnified Large-Print Question Paper',
    'Wheelchair Accessible Desk',
    'Quiet Sensory Room for Exam',
  ];

  const handleToggleAccommodation = (item: string) => {
    setSelectedAccommodations((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleToggleDocument = (id: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  async function handleConfirmSubmit() {
    setError(null);
    setSubmitting(true);

    try {
      await submitApplication({
        job_id: job.id,
        application_type: applicationType,
        accommodations_requested: selectedAccommodations,
        candidate_notes: candidateNotes,
        document_ids: selectedDocumentIds,
      });

      // If it was an external job, open official portal in a new tab now
      if (isExternalJob) {
        // If demo vacancy or dummy placeholder domain, route to the accessible demo portal simulation
        const targetUrl =
          job.is_demo_data ||
          job.official_application_url?.includes('example.gov.in') ||
          job.official_application_url?.includes('example.com')
            ? `/demo-portal?jobId=${job.id}`
            : job.official_application_url;

        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }

      onSuccess();
    } catch (err: any) {
      let rawMsg = err.message || 'Unable to submit application.';
      if (Array.isArray(rawMsg)) rawMsg = rawMsg.join(' ');
      if (typeof rawMsg === 'string' && rawMsg.startsWith("['") && rawMsg.endsWith("']")) {
        rawMsg = rawMsg.slice(2, -2);
      }
      setError(rawMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
              Step {step} of 2: {step === 1 ? 'Accommodations & Preferences' : 'Review & Confirm'}
            </span>
            <h2 id="apply-modal-title" className="text-lg font-bold text-slate-900">
              Apply for {job.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close apply dialog"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className={`p-4 rounded-xl border text-xs font-medium space-y-2 ${
                error.toLowerCase().includes('already recorded')
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {error.toLowerCase().includes('already recorded') ? 'ℹ️' : '⚠️'}
                </span>
                <strong className="text-sm">
                  {error.toLowerCase().includes('already recorded')
                    ? 'Application Already Recorded'
                    : 'Application Notice'}
                </strong>
              </div>
              <p className="leading-relaxed">
                {error.toLowerCase().includes('already recorded')
                  ? 'You have already recorded an application for this vacancy. Your application is saved in your Udyog Saarthi tracking pipeline.'
                  : error}
              </p>
              {error.toLowerCase().includes('already recorded') && (
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href="/dashboard/applications"
                    className="inline-block px-3.5 py-2 bg-blue-700 text-white rounded-lg font-bold text-xs hover:bg-blue-800 shadow-sm"
                  >
                    View in Applications Tracker →
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-block px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Select accommodations and add notes */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Process Type Notice */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isExternalJob
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}
              >
                {isExternalJob ? (
                  <>
                    <strong className="block mb-1">Official External Recruitment Portal:</strong>
                    This vacancy requires completion on the hiring authority&apos;s official website.
                    After reviewing accommodations here, we will redirect you to the official portal and log this application in your Udyog Saarthi tracker so you can monitor milestones.
                  </>
                ) : (
                  <>
                    <strong className="block mb-1">Direct Portal Application:</strong>
                    Your application and requested accommodations will be recorded and forwarded directly to the hiring employer.
                  </>
                )}
              </div>

              {/* Accommodations Checklist */}
              <div>
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                  Select Required Accommodations & Assistance for this Role:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {accommodationOptions.map((acc, idx) => (
                    <label
                      key={acc}
                      htmlFor={`acc-opt-${idx}`}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                        selectedAccommodations.includes(acc)
                          ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        id={`acc-opt-${idx}`}
                        type="checkbox"
                        checked={selectedAccommodations.includes(acc)}
                        onChange={() => handleToggleAccommodation(acc)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{acc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Candidate Notes */}
              <div>
                <label htmlFor="notes" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Tracking Notes or Roll No. <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  value={candidateNotes}
                  onChange={(e) => {
                    setCandidateNotes(e.target.value);
                    if (fieldErrors.candidate_notes) setFieldErrors({ ...fieldErrors, candidate_notes: undefined });
                  }}
                  aria-invalid={!!fieldErrors.candidate_notes}
                  aria-describedby={fieldErrors.candidate_notes ? 'notes-error' : undefined}
                  placeholder="e.g. Any specific test center requests or external reference code if known..."
                  className={`w-full px-3 py-2 border rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.candidate_notes
                      ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                      : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
                {fieldErrors.candidate_notes && (
                  <p id="notes-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                    {fieldErrors.candidate_notes}
                  </p>
                )}
              </div>

              {/* Supporting Documents Selection */}
              <div>
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                  Attach Profile Documents ({selectedDocumentIds.length} selected):
                </span>
                {loadingDocs ? (
                  <p className="text-xs text-slate-500 italic">Loading documents...</p>
                ) : candidateDocuments.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                    <p>No documents uploaded yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      You can add resumes and training certificates in your{' '}
                      <a href="/dashboard/profile" className="text-blue-700 underline font-medium">
                        Profile Builder
                      </a>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidateDocuments.map((doc) => {
                      const isChecked = selectedDocumentIds.includes(doc.id);
                      return (
                        <label
                          key={doc.id}
                          htmlFor={`doc-attach-${doc.id}`}
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition text-xs ${
                            isChecked
                              ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            id={`doc-attach-${doc.id}`}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleDocument(doc.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 shrink-0 mr-2"
                          />
                          <span className="truncate flex-1 font-medium">{doc.original_filename}</span>
                          <span className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {doc.document_type}
                            </span>
                            <span className="text-[10px] text-slate-500">{doc.formatted_size}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW STEP (PRD / User Requirement) */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
                  1. Candidate & Contact Review
                </h3>
                <p><strong>Name:</strong> {user?.full_name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
                  2. Job Vacancy Details
                </h3>
                <p><strong>Position:</strong> {job.title}</p>
                <p><strong>Organization:</strong> {job.organization.name}</p>
                <p><strong>Sector:</strong> {job.sector_display} ({job.work_mode_display})</p>
                <p><strong>Deadline:</strong> {new Date(job.application_deadline).toLocaleDateString()}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
                  3. Requested Accommodations ({selectedAccommodations.length})
                </h3>
                {selectedAccommodations.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {selectedAccommodations.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">None selected.</p>
                )}
                {candidateNotes && (
                  <p className="pt-1 text-slate-600"><strong>Notes:</strong> {candidateNotes}</p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
                  4. Attached Supporting Documents ({selectedDocumentIds.length})
                </h3>
                {selectedDocumentIds.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {candidateDocuments
                      .filter((d) => selectedDocumentIds.includes(d.id))
                      .map((d) => (
                        <li key={d.id} className="truncate">
                          <span className="font-medium">{d.original_filename}</span>{' '}
                          <span className="text-[10px] text-slate-500">
                            ({d.document_type.toUpperCase()}, {d.formatted_size})
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No documents attached.</p>
                )}
              </div>

              {/* Plain-Language Declaration */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                <strong>Honest Application Notice:</strong>
                {isExternalJob ? (
                  <span>
                    {' '}You are recording your application for official tracking. Udyog Saarthi never claims to fabricate external government submissions.
                  </span>
                ) : (
                  <span>
                    {' '}Your application will be submitted directly to {job.organization.name}.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                ← Back to Edit
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  const result = applicationSchema.safeParse({ candidate_notes: candidateNotes });
                  if (!result.success) {
                    const errs = formatZodErrors<ApplicationFormData>(result.error);
                    setFieldErrors(errs);
                    const el = document.getElementById('notes');
                    if (el) el.focus();
                    return;
                  }
                  setStep(2);
                }}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold shadow-sm"
              >
                Review Application →
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {submitting
                  ? 'Submitting...'
                  : isExternalJob
                  ? 'Confirm & Proceed to Official Portal ↗'
                  : 'Submit Application Now ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
