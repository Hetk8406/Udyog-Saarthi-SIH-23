'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supportService } from '@/services/supportService';
import { SupportTicket, TICKET_CATEGORIES } from '@/types/support';
import { supportTicketSchema, formatZodErrors, FormErrors, SupportTicketFormData } from '@/lib/validations';
import TurnstileWidget from '@/components/common/TurnstileWidget';

export default function SupportCenterPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    category: 'application_help',
    subject: '',
    description: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors<SupportTicketFormData>>({});
  const [turnstileToken, setTurnstileToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadTickets();
  }, [filterStatus]);

  async function loadTickets() {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? { status: filterStatus } : undefined;
      const data = await supportService.getTickets(params);
      setTickets(data);
    } catch (err: any) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    const result = supportTicketSchema.safeParse(formData);
    if (!result.success) {
      const errs = formatZodErrors<SupportTicketFormData>(result.error);
      setFieldErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const idMap: Record<string, string> = {
        category: 'ticket-category',
        subject: 'ticket-subject',
        description: 'ticket-description',
      };
      const el = document.getElementById(idMap[firstKey] || firstKey);
      if (el) el.focus();
      return;
    }

    setSubmitting(true);
    try {
      const newTicket = await supportService.createTicket({
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        turnstile_token: turnstileToken,
      });
      setShowNewModal(false);
      setFormData({ category: 'application_help', subject: '', description: '' });
      router.push(`/support/tickets/${newTicket.id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to submit support request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Open</span>;
      case 'assigned':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">Assigned</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">Resolved</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">Closed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Support & Help Desk
          </h1>
          <p className="mt-1 text-slate-600 max-w-2xl text-sm sm:text-base">
            Get personalized assistance for job applications, examination centers, scribe requests, and accommodation support from dedicated job coaches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'coach' && (
            <Link
              href="/coach"
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-semibold rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Job Coach Workspace
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-700 hover:bg-blue-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
          >
            + New Support Request
          </button>
        </div>
      </div>

      {/* Quick Help Categories Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-blue-900 mb-1">Exam & Scribe Help</h2>
          <p className="text-xs text-blue-800">Assistance with official scribe forms, compensatory extra time, and center accessibility.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-emerald-900 mb-1">Job Application Guidance</h2>
          <p className="text-xs text-emerald-800">Clarification on PwD reservation certificates, vacancy criteria, and official portal redirects.</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-purple-900 mb-1">Job Coach Counselling</h2>
          <p className="text-xs text-purple-800">1-on-1 career counselling, mock test progress review, and tailored vacancy recommendations.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-amber-900 mb-1">Workplace Accommodation</h2>
          <p className="text-xs text-amber-800">Assistance with assistive software, screen readers, ergonomics, and post-selection joining.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 mb-6">
        <div className="flex space-x-2" role="tablist" aria-label="Support ticket status filters">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
            <button
              key={st}
              role="tab"
              aria-selected={filterStatus === st}
              onClick={() => setFilterStatus(st)}
              className={`py-3 px-4 text-sm font-medium border-b-2 capitalize transition focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-t ${
                filterStatus === st
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="py-12 text-center" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Loading support conversations...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 font-bold text-xl">
            ?
          </div>
          <h3 className="text-base font-semibold text-slate-900">No support requests found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {filterStatus === 'all'
              ? 'You do not have any open support requests. Click "+ New Support Request" if you need assistance.'
              : `No support tickets matching status "${filterStatus}".`}
          </p>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Create Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/support/tickets/${t.id}`}
              className="block bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm rounded-lg p-5 transition focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {getStatusBadge(t.status)}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {t.category_display}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(t.created_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700">
                    {t.subject}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-1 mt-1">
                    {t.description}
                  </p>
                </div>
                <div className="sm:text-right mt-2 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-500">
                  {t.assigned_coach_name ? (
                    <span className="text-blue-700 font-medium">Coach: {t.assigned_coach_name}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                  <span className="mt-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                    {t.message_count} {t.message_count === 1 ? 'msg' : 'msgs'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 id="modal-title" className="text-xl font-bold text-slate-900">
                Open Support Request
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} noValidate className="mt-4 space-y-4">
              {errorMsg && (
                <div role="alert" className="p-3 bg-red-50 text-red-800 text-sm rounded-md border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="ticket-category" className="block text-sm font-semibold text-slate-800 mb-1">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  id="ticket-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  aria-invalid={!!fieldErrors.category}
                  aria-describedby={fieldErrors.category ? 'ticket-category-error' : undefined}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p id="ticket-category-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                    {fieldErrors.category}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">Select the topic that best matches your query.</p>
              </div>

              <div>
                <label htmlFor="ticket-subject" className="block text-sm font-semibold text-slate-800 mb-1">
                  Subject / Summary <span className="text-red-600">*</span>
                </label>
                <input
                  id="ticket-subject"
                  type="text"
                  placeholder="e.g. Need help requesting scribe for SSC CHSL examination"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({ ...formData, subject: e.target.value });
                    if (fieldErrors.subject) setFieldErrors({ ...fieldErrors, subject: undefined });
                  }}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.subject}
                  aria-describedby={fieldErrors.subject ? 'ticket-subject-error' : undefined}
                  className={`w-full px-3 py-2 border rounded-md text-slate-900 text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.subject
                      ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                      : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
                {fieldErrors.subject && (
                  <p id="ticket-subject-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                    {fieldErrors.subject}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="ticket-description" className="block text-sm font-semibold text-slate-800 mb-1">
                  Detailed Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="ticket-description"
                  rows={4}
                  placeholder="Please describe your difficulty or what specific assistance you require..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: undefined });
                  }}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.description}
                  aria-describedby={fieldErrors.description ? 'ticket-description-error' : undefined}
                  className={`w-full px-3 py-2 border rounded-md text-slate-900 text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.description
                      ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                      : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
                {fieldErrors.description && (
                  <p id="ticket-description-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                    {fieldErrors.description}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">Plain language, clear instructions. No sensitive UDID numbers needed.</p>
              </div>

              {/* Cloudflare Turnstile Spam Protection */}
              <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
