'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supportService } from '@/services/supportService';
import { getJobs } from '@/services/jobService';
import { CoachCandidate, CoachNote } from '@/types/support';
import { Job } from '@/types/job';

export default function CoachDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [candidates, setCandidates] = useState<CoachCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CoachCandidate | null>(null);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Recommend Job Modal state
  const [showRecModal, setShowRecModal] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [recNote, setRecNote] = useState('');
  const [submittingRec, setSubmittingRec] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnTo=%2Fcoach');
      return;
    }
    if (user && user.role !== 'coach' && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user) {
      loadAssignedCandidates();
    }
  }, [user, authLoading, router]);

  async function loadAssignedCandidates() {
    setLoading(true);
    try {
      const data = await supportService.getCoachCandidates();
      setCandidates(data);
      if (data.length > 0) {
        selectCandidate(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load coach candidates', err);
    } finally {
      setLoading(false);
    }
  }

  async function selectCandidate(cand: CoachCandidate) {
    setSelectedCandidate(cand);
    try {
      const candidateNotes = await supportService.getCoachNotes(cand.id);
      setNotes(candidateNotes);
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCandidate || !noteContent.trim() || submittingNote) return;

    setSubmittingNote(true);
    try {
      const newNote = await supportService.addCoachNote(
        selectedCandidate.id,
        noteTitle || 'Counseling Observation',
        noteContent.trim()
      );
      setNotes([newNote, ...notes]);
      setNoteTitle('');
      setNoteContent('');
      setSuccessMsg('Counseling note recorded successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Failed to save note: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingNote(false);
    }
  }

  async function openRecommendModal() {
    setShowRecModal(true);
    try {
      const res = await getJobs({ page: 1 });
      setAvailableJobs(res.results || []);
      if (res.results && res.results.length > 0) {
        setSelectedJobId(res.results[0].id);
      }
    } catch (err) {
      console.error('Failed to load jobs for recommendation', err);
    }
  }

  async function handleSendRecommendation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCandidate || !selectedJobId || submittingRec) return;

    setSubmittingRec(true);
    try {
      await supportService.recommendJob(selectedCandidate.id, selectedJobId, recNote.trim());
      setShowRecModal(false);
      setRecNote('');
      setSuccessMsg(`Job recommended to ${selectedCandidate.full_name} with instant in-app notification!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      alert('Failed to send job recommendation: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingRec(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-slate-600 font-medium">Verifying coach workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Job Coach Workspace
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Assigned Candidates & Guidance
          </h1>
          <p className="mt-1 text-slate-600 text-sm max-w-2xl">
            Review your assigned candidates&apos; career preferences, record private counseling observations, and recommend suitable accessible opportunities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/support"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Support Tickets Desk
          </Link>
        </div>
      </div>

      {successMsg && (
        <div role="status" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm text-slate-500">Loading assigned candidates...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 font-bold text-xl">
            👥
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Candidates Assigned</h2>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            You do not currently have any candidates assigned to your coach portfolio.
            Per platform rules, you will only see candidates once an assignment is created by administration or via candidate request.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Candidate List */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Your Assigned Candidates ({candidates.length})
            </h2>
            <div className="space-y-2">
              {candidates.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id;
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => selectCandidate(cand)}
                    className={`w-full text-left p-4 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {cand.full_name}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {cand.completion_percentage}% Profile
                      </span>
                    </div>
                    <p className="text-xs text-blue-800 font-medium">
                      {cand.primary_disability}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {cand.city}, {cand.state} • {cand.active_applications_count} Applications
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Candidate Workspace */}
          {selectedCandidate && (
            <div className="lg:col-span-8 space-y-6">
              {/* Candidate Profile Summary Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {selectedCandidate.full_name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedCandidate.email} • {selectedCandidate.phone || 'Phone not provided'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openRecommendModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-700 hover:bg-blue-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    Recommend a Job
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <span className="block font-bold text-slate-700 mb-1">Accessibility Accommodations:</span>
                    {selectedCandidate.accommodation_needs.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {selectedCandidate.accommodation_needs.map((acc, idx) => (
                          <li key={idx}>{acc}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 italic">Standard exam facilities</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <span className="block font-bold text-slate-700 mb-1">Career Preferences:</span>
                    <p className="text-slate-600 capitalize">
                      Sector: {selectedCandidate.preferred_sector}
                    </p>
                    <p className="text-slate-600 capitalize">
                      Work Mode: {selectedCandidate.preferred_work_mode.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Skills tags */}
                {selectedCandidate.skills_summary.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600 mr-1">Skills:</span>
                    {selectedCandidate.skills_summary.map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[11px] font-medium rounded border border-blue-200">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Private Coach Notes Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Private Counseling Notes & Observations
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  These notes are confidential to you and other job coaches; candidates cannot see internal coach notes.
                </p>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label htmlFor="note-title" className="block text-xs font-semibold text-slate-700 mb-1">
                      Note Title
                    </label>
                    <input
                      id="note-title"
                      type="text"
                      placeholder="e.g. Scribe Readiness & Mock Test Feedback"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="note-content" className="block text-xs font-semibold text-slate-700 mb-1">
                      Observation / Strategy <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="note-content"
                      rows={3}
                      placeholder="Record candidate strengths, exam prep status, or support action items..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingNote || !noteContent.trim()}
                      className="px-4 py-1.5 text-xs font-semibold rounded bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {submittingNote ? 'Saving...' : 'Save Counseling Note'}
                    </button>
                  </div>
                </form>

                {/* Existing Notes List */}
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No notes recorded yet for this candidate.</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="border-l-4 border-blue-600 bg-slate-50 pl-4 pr-3 py-3 rounded-r-lg">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{n.content}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Recorded by: {n.coach_name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommend Job Modal */}
      {showRecModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rec-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 id="rec-modal-title" className="text-lg font-bold text-slate-900">
                Recommend Job to {selectedCandidate?.full_name}
              </h3>
              <button
                type="button"
                onClick={() => setShowRecModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendRecommendation} className="mt-4 space-y-4">
              <div>
                <label htmlFor="select-job" className="block text-xs font-semibold text-slate-800 mb-1">
                  Select Opportunity <span className="text-red-600">*</span>
                </label>
                <select
                  id="select-job"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {availableJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.organization.name} ({j.location_city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rec-note" className="block text-xs font-semibold text-slate-800 mb-1">
                  Personal Recommendation Note
                </label>
                <textarea
                  id="rec-note"
                  rows={3}
                  placeholder="e.g. This role has excellent wheelchair accessibility facilities and matches your reasoning mock test score."
                  value={recNote}
                  onChange={(e) => setRecNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRecModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRec || !selectedJobId}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {submittingRec ? 'Sending...' : 'Send Recommendation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
