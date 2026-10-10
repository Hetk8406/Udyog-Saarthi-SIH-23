'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getMockTestDetail, startTestAttempt } from '@/services/learningService';
import { MockTest, TimeModeType } from '@/types/learning';

export default function MockTestInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [test, setTest] = useState<MockTest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<TimeModeType>('compensatory');
  const [starting, setStarting] = useState<boolean>(false);

  useEffect(() => {
    async function loadTest() {
      if (!id) return;
      try {
        const data = await getMockTestDetail(id);
        setTest(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load mock test details.');
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [id]);

  async function handleStartTest() {
    if (!user) {
      router.push(`/login?next=/learning/mock-tests/${id}`);
      return;
    }

    setStarting(true);
    setError(null);
    try {
      const attempt = await startTestAttempt(id, timeMode);
      router.push(`/learning/mock-tests/${id}/take?attemptId=${attempt.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start examination attempt.');
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium">Loading examination details...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Mock Examination Not Found</h1>
        <p className="text-sm text-slate-600">{error || 'This test is currently unavailable.'}</p>
        <Link
          href="/learning"
          className="inline-block px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-semibold"
        >
          ← Back to Mock Tests
        </Link>
      </div>
    );
  }

  const getTimeMultiplierLabel = (mode: TimeModeType) => {
    if (mode === 'standard') return `${test.duration_minutes} minutes (1.0x)`;
    if (mode === 'compensatory') return `${Math.round(test.duration_minutes * 1.33)} minutes (1.33x Compensatory)`;
    if (mode === 'extended') return `${Math.round(test.duration_minutes * 1.5)} minutes (1.5x Relaxed)`;
    return 'Untimed (No Timer)';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/learning"
          className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Learning Center
        </Link>
      </div>

      {/* Test Title Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            {test.category_display}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            Simulation Test
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {test.title}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed">
          {test.description}
        </p>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Total Questions</span>
            <strong className="text-base text-slate-900 block mt-0.5">{test.question_count} MCQs</strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Total Marks</span>
            <strong className="text-base text-slate-900 block mt-0.5">{test.total_marks} Marks</strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block">Passing Benchmark</span>
            <strong className="text-base text-slate-900 block mt-0.5">{test.passing_percentage}%</strong>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
            <span className="text-blue-800 font-semibold block">Base Duration</span>
            <strong className="text-base text-blue-950 block mt-0.5">{test.duration_minutes} Mins</strong>
          </div>
        </div>
      </div>

      {/* ACCESSIBILITY TIMER ADJUSTMENT SETTINGS (Core Requirement) */}
      <section
        aria-labelledby="timing-settings-heading"
        className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-blue-300 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <div>
            <h2 id="timing-settings-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Accessibility Timing Accommodations
            </h2>
            <p className="text-xs text-slate-600">
              Under DoPT / MSJE competitive exam norms, candidates with benchmark disabilities are entitled to compensatory extra time. Select the pace that best supports your access needs:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              mode: 'compensatory' as TimeModeType,
              title: 'Compensatory Extra Time (+20 min/hr)',
              desc: 'Official PwD examination standard (1.33x speed). Recommended for all benchmark disability practice.',
              badge: 'Recommended',
            },
            {
              mode: 'standard' as TimeModeType,
              title: 'Standard Examination Time (1.0x)',
              desc: 'Official non-extended examination speed for candidates practicing rapid time-pressure drills.',
              badge: 'Strict',
            },
            {
              mode: 'extended' as TimeModeType,
              title: 'Relaxed Practice Time (1.5x)',
              desc: 'Gives 50% additional time to read questions using magnification or speech synthesizers.',
              badge: 'Extended',
            },
            {
              mode: 'untimed' as TimeModeType,
              title: 'Untimed Practice Mode (Timer Off)',
              desc: 'No countdown timer. Ideal for self-paced study, screen reader beginners, or stress-free practice.',
              badge: 'Untimed',
            },
          ].map((item) => (
            <label
              key={item.mode}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between space-y-2 ${
                timeMode === item.mode
                  ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-medium shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="time-mode"
                    value={item.mode}
                    checked={timeMode === item.mode}
                    onChange={() => setTimeMode(item.mode)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <strong className="text-xs sm:text-sm">{item.title}</strong>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 pl-6">{item.desc}</p>
            </label>
          ))}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
          <span>Active Test Session Allotted Time:</span>
          <strong className="text-blue-900 font-bold">{getTimeMultiplierLabel(timeMode)}</strong>
        </div>
      </section>

      {/* Official Instructions */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
          Examination Instructions & Guidelines
        </h2>

        <div className="prose text-xs sm:text-sm text-slate-700 space-y-2 whitespace-pre-line leading-relaxed">
          {test.instructions}
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
          <strong>Accessible Keyboard Navigation Notice:</strong>
          <p>
            You can select answers using the `1`, `2`, `3`, `4` keys or click/tap.
            Use `Alt + N` for Next Question, `Alt + P` for Previous Question, and `Alt + M` to Mark for Review.
          </p>
        </div>
      </section>

      {/* Start Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
        <p className="text-xs text-slate-500">
          Your answers are saved automatically as you navigate between questions.
        </p>

        <button
          type="button"
          onClick={handleStartTest}
          disabled={starting}
          className="px-8 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition"
        >
          {starting ? 'Preparing Test Environment...' : 'Start Mock Examination →'}
        </button>
      </div>
    </div>
  );
}
