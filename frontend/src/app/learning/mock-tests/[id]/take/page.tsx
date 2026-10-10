'use client';

import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  getTestAttempt,
  saveTestAnswer,
  submitTestAttempt
} from '@/services/learningService';
import { TestAttempt, Question } from '@/types/learning';

function MockTestEngineContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const testId = params?.id as string;
  const attemptId = searchParams.get('attemptId');

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active question index
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Candidate answers map: { [questionId]: { selectedOption: string, isMarked: boolean } }
  const [answersMap, setAnswersMap] = useState<
    Record<string, { selectedOption: string; isMarked: boolean }>
  >({});

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [timerExpired, setTimerExpired] = useState<boolean>(false);

  // Submit modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Saving indicator
  const [savingAnswer, setSavingAnswer] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load attempt data
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=/learning/mock-tests/${testId}`);
      return;
    }

    async function loadAttempt() {
      if (!attemptId) {
        setError('No active test session ID provided.');
        setLoading(false);
        return;
      }

      try {
        const data = await getTestAttempt(attemptId);
        if (data.is_submitted) {
          // Already submitted, redirect to result
          router.replace(`/learning/mock-tests/${testId}/results/${attemptId}`);
          return;
        }

        setAttempt(data);

        // Populate existing answers
        const map: Record<string, { selectedOption: string; isMarked: boolean }> = {};
        data.answers.forEach((ans) => {
          map[String(ans.question)] = {
            selectedOption: ans.selected_option_id,
            isMarked: ans.is_marked_for_review,
          };
        });
        setAnswersMap(map);

        // Calculate timer
        if (data.time_mode === 'untimed') {
          setRemainingSeconds(null);
        } else {
          let multiplier = 1.0;
          if (data.time_mode === 'compensatory') multiplier = 1.33;
          if (data.time_mode === 'extended') multiplier = 1.5;

          const totalAllowedSecs = Math.round(data.mock_test.duration_minutes * 60 * multiplier);
          const remaining = Math.max(0, totalAllowedSecs - data.time_spent_seconds);
          setRemainingSeconds(remaining);
        }
        setTimeSpentSeconds(data.time_spent_seconds);
      } catch (err: any) {
        setError(err.message || 'Unable to load test session.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadAttempt();
    }
  }, [attemptId, testId, user, authLoading, router]);

  // Submit evaluation handler
  const handleSubmitTest = useCallback(async () => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitTestAttempt(attemptId, timeSpentSeconds);
      router.push(`/learning/mock-tests/${testId}/results/${attemptId}`);
    } catch (err: any) {
      alert(err.message || 'Error submitting test attempt.');
      setIsSubmitting(false);
    }
  }, [attemptId, testId, timeSpentSeconds, isSubmitting, router]);

  // Countdown Timer Hook
  useEffect(() => {
    if (loading || !attempt || attempt.is_submitted) return;

    timerRef.current = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);

      if (remainingSeconds !== null) {
        setRemainingSeconds((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, attempt, remainingSeconds]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timerExpired) {
      alert('Time allotted for this mock examination has expired! Submitting your answers now.');
      handleSubmitTest();
    }
  }, [timerExpired, handleSubmitTest]);

  // Save current option selection
  const handleSelectOption = async (optionId: string) => {
    if (!attempt || !attempt.questions[currentIndex]) return;
    const currentQ = attempt.questions[currentIndex];
    const qId = String(currentQ.id);

    const isMarked = answersMap[qId]?.isMarked || false;

    // Optimistic UI update
    setAnswersMap((prev) => ({
      ...prev,
      [qId]: { selectedOption: optionId, isMarked },
    }));

    setSavingAnswer(true);
    try {
      await saveTestAnswer(attempt.id, qId, optionId, isMarked);
    } catch {
      // Handled silently
    } finally {
      setSavingAnswer(false);
    }
  };

  // Toggle Mark for Review
  const handleToggleMarkReview = async () => {
    if (!attempt || !attempt.questions[currentIndex]) return;
    const currentQ = attempt.questions[currentIndex];
    const qId = String(currentQ.id);

    const currentSelection = answersMap[qId]?.selectedOption || '';
    const newMarked = !answersMap[qId]?.isMarked;

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: { selectedOption: currentSelection, isMarked: newMarked },
    }));

    try {
      await saveTestAnswer(attempt.id, qId, currentSelection, newMarked);
    } catch {
      // Handled silently
    }
  };

  // Clear Selection
  const handleClearSelection = async () => {
    if (!attempt || !attempt.questions[currentIndex]) return;
    const currentQ = attempt.questions[currentIndex];
    const qId = String(currentQ.id);

    const isMarked = answersMap[qId]?.isMarked || false;

    setAnswersMap((prev) => ({
      ...prev,
      [qId]: { selectedOption: '', isMarked },
    }));

    try {
      await saveTestAnswer(attempt.id, qId, '', isMarked);
    } catch {
      // Handled silently
    }
  };

  // Accessible Keyboard Shortcuts (1-4 for options, Alt+N for next, Alt+P for prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '1') handleSelectOption('A');
      if (e.key === '2') handleSelectOption('B');
      if (e.key === '3') handleSelectOption('C');
      if (e.key === '4') handleSelectOption('D');

      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (attempt && currentIndex < attempt.questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      }

      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, attempt, answersMap]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium text-sm">Preparing accessible examination session...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Session Error</h1>
        <p className="text-sm text-slate-600">{error || 'Could not load test attempt.'}</p>
        <Link
          href={`/learning/mock-tests/${testId}`}
          className="inline-block px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-semibold"
        >
          ← Return to Instructions
        </Link>
      </div>
    );
  }

  const currentQuestion: Question | undefined = attempt.questions[currentIndex];
  const qId = currentQuestion ? String(currentQuestion.id) : '';
  const currentSelection = answersMap[qId]?.selectedOption || '';
  const isMarked = answersMap[qId]?.isMarked || false;

  // Format timer
  const formatTimer = (secs: number | null) => {
    if (secs === null) return 'Untimed Practice Mode';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate question status summary
  const answeredCount = Object.values(answersMap).filter((a) => a.selectedOption).length;
  const markedCount = Object.values(answersMap).filter((a) => a.isMarked).length;
  const unansweredCount = attempt.questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Accessible Sticky App Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">📝</span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {attempt.mock_test.title}
              </h1>
              <span className="text-xs text-slate-500">
                Question {currentIndex + 1} of {attempt.questions.length}
              </span>
            </div>
          </div>

          {/* TIMER DISPLAY */}
          <div className="flex items-center gap-3">
            <div
              role="timer"
              aria-live="polite"
              className={`px-4 py-2 rounded-xl border font-mono font-bold text-sm sm:text-base flex items-center gap-2 ${
                remainingSeconds === null
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : remainingSeconds <= 300
                  ? 'bg-red-50 border-red-300 text-red-900 animate-pulse'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}
            >
              <span>⏱️</span>
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="min-h-[44px] px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition inline-flex items-center justify-center"
            >
              Finish & Submit Test ✓
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Viewport */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left Column: Active Question & Choices (3 Cols) */}
        <section
          aria-labelledby="question-statement-heading"
          className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6"
        >
          {currentQuestion ? (
            <div className="space-y-6">
              {/* Question Header & Subject Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-900 font-bold rounded-full text-xs">
                    {currentQuestion.subject}
                  </span>
                  <span className="text-xs text-slate-500">
                    Marks: +{currentQuestion.marks} / -{currentQuestion.negative_marks}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMarkReview}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      isMarked
                        ? 'bg-purple-100 border-purple-400 text-purple-900'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isMarked ? '★ Marked for Review' : '☆ Mark for Review'}
                  </button>

                  {savingAnswer && (
                    <span className="text-xs text-slate-400 font-medium">Saving...</span>
                  )}
                </div>
              </div>

              {/* Question Statement */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase text-slate-400 block tracking-wider">
                  Question {currentIndex + 1}
                </span>
                <h2
                  id="question-statement-heading"
                  className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed"
                >
                  {currentQuestion.question_text}
                </h2>
              </div>

              {/* Multiple Choice Options List */}
              <fieldset className="space-y-3 pt-2">
                <legend className="sr-only">Answer choices for question {currentIndex + 1}</legend>
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = currentSelection.toUpperCase() === opt.id.toUpperCase();
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition focus-within:ring-2 focus-within:ring-blue-600 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => handleSelectOption(opt.id)}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {opt.id}
                      </span>
                      <span className="text-sm sm:text-base leading-snug flex-1">
                        {opt.text}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                        (Key: {idx + 1})
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Question not found.</p>
          )}

          {/* Question Action Controls */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              {currentSelection && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50 rounded-lg transition"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="min-h-[44px] px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition inline-flex items-center justify-center"
              >
                ← Previous (Alt+P)
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(attempt.questions.length - 1, prev + 1))
                }
                disabled={currentIndex === attempt.questions.length - 1}
                className="min-h-[44px] px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-40 transition inline-flex items-center justify-center"
              >
                Save & Next (Alt+N) →
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Question Navigator Palette (1 Col) */}
        <aside
          aria-label="Question Navigator Palette"
          className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
        >
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Question Navigator
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Jump directly to any question:
            </p>
          </div>

          {/* Grid of Question Numbers */}
          <div className="grid grid-cols-5 gap-2">
            {attempt.questions.map((q, idx) => {
              const qKey = String(q.id);
              const isAnswered = Boolean(answersMap[qKey]?.selectedOption);
              const isMarkedReview = Boolean(answersMap[qKey]?.isMarked);
              const isCurrent = idx === currentIndex;

              let btnClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              if (isAnswered) {
                btnClass = 'bg-emerald-600 text-white border-emerald-700 font-bold';
              }
              if (isMarkedReview) {
                btnClass = 'bg-purple-600 text-white border-purple-700 font-bold';
              }
              if (isCurrent) {
                btnClass += ' ring-2 ring-offset-2 ring-blue-600 font-black';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Jump to Question ${idx + 1}. Status: ${
                    isAnswered ? 'Answered' : 'Not answered'
                  } ${isMarkedReview ? ', Marked for review' : ''}`}
                  className={`h-9 rounded-xl border text-xs flex items-center justify-center transition ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0"></span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-purple-600 shrink-0"></span>
              <span>Marked for Review ({markedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0"></span>
              <span>Unanswered ({unansweredCount})</span>
            </div>
          </div>
        </aside>
      </main>

      {/* CONFIRM SUBMISSION MODAL */}
      {isSubmitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-700 block">
                Submit Examination
              </span>
              <h3 id="submit-modal-title" className="text-xl font-bold text-slate-900 mt-1">
                Are you ready to submit your test?
              </h3>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Answered</span>
                <strong className="text-base text-emerald-700 block mt-0.5">{answeredCount}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Unanswered</span>
                <strong className="text-base text-slate-800 block mt-0.5">{unansweredCount}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Marked</span>
                <strong className="text-base text-purple-700 block mt-0.5">{markedCount}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Once submitted, your answers will be automatically evaluated, displaying your total score, subject breakdown, and targeted study recommendations.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitTest}
                className="px-5 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {isSubmitting ? 'Evaluating Test...' : 'Yes, Submit Test ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MockTestTakePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-24 px-4 text-center text-sm text-slate-600">
          Loading test engine...
        </div>
      }
    >
      <MockTestEngineContent />
    </Suspense>
  );
}
