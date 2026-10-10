'use client';

import React from 'react';
import { StatusHistoryItem, ApplicationStatusType } from '@/types/application';

interface StatusTimelineProps {
  currentStatus: ApplicationStatusType;
  currentStatusDisplay: string;
  history: StatusHistoryItem[];
}

export default function StatusTimeline({
  currentStatus,
  currentStatusDisplay,
  history,
}: StatusTimelineProps) {
  // Key milestone stages in the normal hiring lifecycle
  const milestoneStages = [
    { key: 'applied_or_submitted', label: 'Applied', matches: ['applied', 'submitted'] },
    { key: 'admit_card', label: 'Admit Card', matches: ['admit_card_released'] },
    { key: 'exam', label: 'Examination', matches: ['exam_scheduled', 'exam_attended', 'result_published'] },
    { key: 'interview', label: 'Interview', matches: ['interview_scheduled', 'interview_attended'] },
    { key: 'selection', label: 'Selection / Placed', matches: ['selected', 'placed'] },
  ];

  // Helper to determine stage state
  const getStageState = (matches: string[]) => {
    if (matches.includes(currentStatus)) return 'current';

    // If currentStatus is further along
    const allOrder = [
      'saved',
      'app_started',
      'applied',
      'submitted',
      'admit_card_released',
      'exam_scheduled',
      'exam_attended',
      'result_published',
      'interview_scheduled',
      'interview_attended',
      'selected',
      'placed',
    ];
    const currentIndex = allOrder.indexOf(currentStatus);
    const maxMatchIndex = Math.max(...matches.map((m) => allOrder.indexOf(m)));

    if (currentIndex > maxMatchIndex && currentIndex !== -1) return 'completed';
    return 'upcoming';
  };

  const isTerminalNegative = ['rejected', 'withdrawn', 'expired'].includes(currentStatus);

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Recruitment Journey Progress
        </h4>
        {isTerminalNegative && (
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 capitalize">
            Status: {currentStatus}
          </span>
        )}
      </div>

      {/* Visual Step Progress Bar */}
      {!isTerminalNegative && (
        <ol className="grid grid-cols-5 gap-1 text-center" aria-label="Application milestone progress">
          {milestoneStages.map((stage, idx) => {
            const state = getStageState(stage.matches);
            return (
              <li key={stage.key} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 border-2 transition ${
                    state === 'current'
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                      : state === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 text-slate-400 border-slate-300'
                  }`}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {state === 'completed' ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-[11px] leading-tight font-medium ${
                    state === 'current'
                      ? 'font-bold text-blue-900'
                      : state === 'completed'
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Chronological History Log */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
        <h5 className="text-xs font-bold text-slate-800">Milestone Audit Log:</h5>
        {history && history.length > 0 ? (
          <ul className="space-y-2.5 text-xs text-slate-700 divide-y divide-slate-200">
            {history.map((item) => (
              <li key={item.id} className="pt-2 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-slate-900">
                    → {item.to_status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{item.note}</p>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Recorded by: {item.changed_by_name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">No milestone history logged yet.</p>
        )}
      </div>
    </div>
  );
}
