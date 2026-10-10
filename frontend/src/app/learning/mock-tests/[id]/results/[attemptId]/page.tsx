'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTestAttempt } from '@/services/learningService';
import { TestAttempt } from '@/types/learning';

export default function MockTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const testId = params?.id as string;
  const attemptId = params?.attemptId as string;

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=/learning/mock-tests/${testId}`);
      return;
    }

    async function loadResult() {
      if (!attemptId) return;
      try {
        const data = await getTestAttempt(attemptId);
        setAttempt(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load test results.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadResult();
    }
  }, [attemptId, testId, user, authLoading, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium text-sm">Evaluating and compiling your scorecard...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Scorecard Not Available</h1>
        <p className="text-sm text-slate-600">{error || 'Could not find this test attempt.'}</p>
        <Link
          href="/learning"
          className="inline-block px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-semibold"
        >
          ← Return to Learning Center
        </Link>
      </div>
    );
  }

  const scorePct = attempt.score_percentage ? parseFloat(attempt.score_percentage) : 0;
  const subjectList = Object.entries(attempt.subject_breakdown || {});

  // Timing accommodation label
  const getTimeModeLabel = (mode: string) => {
    if (mode === 'compensatory') return '1.33x Compensatory Extra Time (PwD Norms)';
    if (mode === 'extended') return '1.5x Relaxed Practice Time';
    if (mode === 'untimed') return 'Untimed Practice Mode';
    return 'Standard Exam Timing (1.0x)';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/learning"
          className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Learning & Mock Tests
        </Link>
      </div>

      {/* PRD RESULT SCORECARD (Section 14 Specification) */}
      <section
        aria-label="Mock Test Result Scorecard"
        className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-6 sm:p-10 space-y-8"
      >
        {/* Scorecard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700 block mb-1">
              Examination Performance Analysis
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Mock Test Result
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {attempt.mock_test.title} • Completed on {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : 'Today'}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                attempt.passed
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                  : 'bg-amber-100 text-amber-950 border-amber-400'
              }`}
            >
              {attempt.passed ? '✓ Benchmark Met (Passed)' : 'Need More Practice'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Timing: {getTimeModeLabel(attempt.time_mode)}
            </span>
          </div>
        </div>

        {/* Big Overall Metric Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 border-2 border-blue-400 p-5 rounded-2xl text-center">
            <span className="text-xs uppercase font-extrabold text-blue-900 tracking-wider block">
              Final Score
            </span>
            <span className="text-3xl sm:text-4xl font-black text-blue-950 block mt-1">
              {scorePct}%
            </span>
            <span className="text-[11px] text-blue-800 font-semibold block mt-1">
              ({attempt.score} / {attempt.mock_test.total_marks} Marks)
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-2xl text-center">
            <span className="text-xs uppercase font-bold text-emerald-800 tracking-wider block">
              Correct Answers
            </span>
            <span className="text-3xl sm:text-4xl font-black text-emerald-950 block mt-1">
              {attempt.correct_count}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium block mt-1">
              Accuracy rate: {attempt.total_questions > 0 ? Math.round((attempt.correct_count / attempt.total_questions) * 100) : 0}%
            </span>
          </div>

          <div className="bg-red-50 border border-red-300 p-5 rounded-2xl text-center">
            <span className="text-xs uppercase font-bold text-red-800 tracking-wider block">
              Incorrect Answers
            </span>
            <span className="text-3xl sm:text-4xl font-black text-red-950 block mt-1">
              {attempt.incorrect_count}
            </span>
            <span className="text-[11px] text-red-700 font-medium block mt-1">
              Negative marks deducted
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-300 p-5 rounded-2xl text-center">
            <span className="text-xs uppercase font-bold text-slate-700 tracking-wider block">
              Unanswered
            </span>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 block mt-1">
              {attempt.unanswered_count}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              Skipped questions
            </span>
          </div>
        </div>

        {/* SUBJECT PERFORMANCE BREAKDOWN (PRD Section 14) */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Subject Performance
            </h2>
            <p className="text-xs text-slate-500">
              Subject-wise percentage breakdown of your responses:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectList.map(([subject, stats]) => (
              <div
                key={subject}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 text-sm">{subject}</span>
                  <span className="font-mono font-extrabold text-sm text-slate-900">
                    {stats.percentage}%
                  </span>
                </div>

                {/* Accessible Progress Bar */}
                <div
                  className="w-full bg-slate-200 rounded-full h-3 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={stats.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${subject} score percentage`}
                >
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      stats.percentage >= 75
                        ? 'bg-emerald-600'
                        : stats.percentage >= 40
                        ? 'bg-blue-600'
                        : 'bg-amber-600'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                  <span>Correct: {stats.correct} / {stats.total}</span>
                  <span>Incorrect: {stats.incorrect}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WEAK SUBJECT PRACTICE RECOMMENDATION (PRD & User Requirement) */}
        {attempt.weak_subject_suggestion && (
          <div
            role="region"
            aria-label="Targeted Practice Recommendation"
            className="p-5 sm:p-6 bg-amber-50 border-2 border-amber-400 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-amber-900 tracking-wider block">
                Targeted Recommendation
              </span>
              <h3 className="text-lg font-bold text-amber-950">
                Recommended: {attempt.weak_subject_suggestion}
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed max-w-xl">
                Your performance indicates that revising core concepts in this subject will produce the highest score improvements in upcoming competitive exams.
              </p>
            </div>

            <Link
              href="/learning"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap shrink-0 text-center"
            >
              Explore Study Materials →
            </Link>
          </div>
        )}
      </section>

      {/* DETAILED QUESTION & SOLUTION REVIEW SECTION */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Comprehensive Solution & Answer Key Review
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Review detailed step-by-step explanations for each question to reinforce your learning:
          </p>
        </div>

        <div className="space-y-6">
          {attempt.questions.map((q, idx) => {
            const recordedAns = attempt.answers.find((a) => String(a.question) === String(q.id));
            const selectedOpt = recordedAns?.selected_option_id?.toUpperCase() || '';
            const correctOpt = q.correct_option_id?.toUpperCase() || '';
            const isCorrect = selectedOpt && selectedOpt === correctOpt;
            const isSkipped = !selectedOpt;

            return (
              <article
                key={q.id}
                className={`p-6 rounded-2xl border-2 space-y-4 ${
                  isCorrect
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isSkipped
                    ? 'border-slate-300 bg-slate-50/40'
                    : 'border-red-300 bg-red-50/20'
                }`}
              >
                {/* Question Status Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-bold text-slate-700">
                    Question {idx + 1} • <span className="text-blue-700 font-semibold">{q.subject}</span>
                  </span>

                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : isSkipped
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-red-100 text-red-900 border-red-300'
                    }`}
                  >
                    {isCorrect ? '✓ Correct (+1 Mark)' : isSkipped ? '⚪ Not Attempted (0 Marks)' : '✕ Incorrect (-0.25)'}
                  </span>
                </div>

                {/* Question Statement */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  {q.question_text}
                </h3>

                {/* Options List with Highlight */}
                <div className="space-y-2 text-xs">
                  {q.options.map((opt) => {
                    const isUserChoice = selectedOpt === opt.id.toUpperCase();
                    const isTheCorrectChoice = correctOpt === opt.id.toUpperCase();

                    let optClass = 'border-slate-200 bg-white text-slate-700';
                    if (isTheCorrectChoice) {
                      optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                    } else if (isUserChoice && !isCorrect) {
                      optClass = 'border-red-400 bg-red-50 text-red-950 font-semibold line-through';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${optClass}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">
                          {opt.id}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isTheCorrectChoice && (
                          <span className="text-[11px] text-emerald-700 font-bold shrink-0">
                            ✓ Correct Option
                          </span>
                        )}
                        {isUserChoice && !isCorrect && (
                          <span className="text-[11px] text-red-700 font-bold shrink-0">
                            (Your Answer)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1">
                    <strong className="text-slate-900 block font-bold">
                      💡 Solution & Explanation:
                    </strong>
                    <p className="leading-relaxed whitespace-pre-line text-slate-700">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200">
        <Link
          href="/learning"
          className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 text-center"
        >
          ← Return to Learning Center
        </Link>

        <Link
          href={`/learning/mock-tests/${testId}`}
          className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition text-center"
        >
          Retake This Mock Test ↺
        </Link>
      </div>
    </div>
  );
}
