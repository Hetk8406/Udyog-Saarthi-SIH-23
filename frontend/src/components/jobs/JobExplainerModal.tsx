'use client';

import React, { useState } from 'react';
import { jobExplainerService } from '@/services/jobExplainerService';
import { JobExplainerResponse } from '@/types/ai';

interface JobExplainerModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobExplainerModal({
  jobId,
  jobTitle,
  isOpen,
  onClose,
}: JobExplainerModalProps) {
  const [data, setData] = useState<JobExplainerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  React.useEffect(() => {
    if (isOpen && !hasFetched) {
      loadExplanation();
    }
  }, [isOpen]);

  async function loadExplanation(queryText?: string) {
    setLoading(true);
    try {
      const res = await jobExplainerService.explainJob(jobId, queryText || userQuery);
      setData(res);
      setHasFetched(true);
    } catch (err) {
      console.error('Failed to explain job', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomQuerySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userQuery.trim() || loading) return;
    loadExplanation(userQuery.trim());
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="explainer-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide">
              AI Accessibility Assistant
            </span>
            <h2 id="explainer-modal-title" className="text-xl font-extrabold text-slate-900 mt-1">
              Plain-Language Job Breakdown
            </h2>
            <p className="text-xs text-slate-500 font-medium">{jobTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Mandatory Legal & Medical Non-Decision Disclaimer */}
        <div
          role="note"
          aria-label="Legal Notice"
          className="p-3.5 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-xs leading-relaxed text-amber-950 font-medium shadow-xs"
        >
          <strong className="block font-bold text-amber-900 mb-0.5">⚠️ Important Guidance Disclaimer:</strong>
          {data?.legal_disclaimer ||
            'This assistant is an accessibility helper only and cannot make legal, medical, disability, or binding eligibility decisions. Always refer to the official recruitment notification.'}
        </div>

        {loading ? (
          <div className="py-12 text-center" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
            <p className="text-xs text-slate-600 font-semibold">
              Translating job requirements into plain language...
            </p>
          </div>
        ) : data ? (
          <div className="space-y-5 text-xs text-slate-700">
            {/* 1. Plain Language Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Summary in Plain Words</h3>
              <p className="leading-relaxed">{data.plain_language_summary}</p>
            </div>

            {/* 2. Key Eligibility Criteria */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Key Eligibility Checklist</h3>
              <ul className="list-disc list-inside space-y-1 pl-1 bg-white p-3 rounded-lg border border-slate-200">
                {data.eligibility_breakdown.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>

            {/* 3. Step-by-Step Application Instructions */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">How to Apply (Step-by-Step)</h3>
              <div className="space-y-1.5">
                {data.application_steps.map((step, idx) => (
                  <div key={idx} className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-2">
                    <span className="font-bold text-blue-700 shrink-0">✓</span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Official Gazette Notification Link */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Authoritative Source:</span>
              <a
                href={data.official_notification_link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 hover:text-blue-800 font-bold underline"
              >
                Open Official Notification Gazette ↗
              </a>
            </div>

            {/* Follow-up question input */}
            <form onSubmit={handleCustomQuerySubmit} className="pt-3 border-t border-slate-200 space-y-2">
              <label htmlFor="assistant-query" className="block text-xs font-bold text-slate-800">
                Have a specific question about this opening?
              </label>
              <div className="flex gap-2">
                <input
                  id="assistant-query"
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="e.g. Do I need a gazetted scribe form for this examination?"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  disabled={loading || !userQuery.trim()}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs disabled:opacity-50"
                >
                  Ask
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
