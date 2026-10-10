'use client';

import React from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';

export default function AccessibilityBar() {
  const {
    textSize,
    highContrast,
    reducedMotion,
    setTextSize,
    toggleHighContrast,
    toggleReducedMotion,
    resetAccessibility,
  } = useAccessibility();

  return (
    <div
      role="region"
      aria-label="Accessibility settings"
      className="bg-slate-900 text-white text-xs px-4 py-1.5 border-b border-slate-700"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left side label */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-300">Accessibility Tools:</span>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Text Size Controls */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Text sizing">
            <span className="text-slate-300 mr-0.5">Text:</span>
            <button
              type="button"
              onClick={() => setTextSize('normal')}
              aria-pressed={textSize === 'normal'}
              className={`min-h-[38px] min-w-[38px] px-2.5 py-1 rounded-lg font-bold border transition inline-flex items-center justify-center ${
                textSize === 'normal'
                  ? 'bg-amber-400 text-slate-900 border-amber-400'
                  : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setTextSize('large')}
              aria-pressed={textSize === 'large'}
              className={`min-h-[38px] min-w-[38px] px-2.5 py-1 rounded-lg font-bold border transition text-sm inline-flex items-center justify-center ${
                textSize === 'large'
                  ? 'bg-amber-400 text-slate-900 border-amber-400'
                  : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
              }`}
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setTextSize('larger')}
              aria-pressed={textSize === 'larger'}
              className={`min-h-[38px] min-w-[38px] px-2.5 py-1 rounded-lg font-bold border transition text-base inline-flex items-center justify-center ${
                textSize === 'larger'
                  ? 'bg-amber-400 text-slate-900 border-amber-400'
                  : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
              }`}
            >
              A++
            </button>
          </div>

          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>

          {/* High Contrast Mode */}
          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className={`min-h-[38px] px-3 py-1 rounded-lg font-medium border transition inline-flex items-center justify-center ${
              highContrast
                ? 'bg-amber-400 text-slate-900 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
            }`}
          >
            {highContrast ? 'High Contrast: On' : 'High Contrast: Off'}
          </button>

          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>

          {/* Reduced Motion Toggle */}
          <button
            type="button"
            onClick={toggleReducedMotion}
            aria-pressed={reducedMotion}
            className={`min-h-[38px] px-3 py-1 rounded-lg font-medium border transition inline-flex items-center justify-center ${
              reducedMotion
                ? 'bg-amber-400 text-slate-900 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
            }`}
          >
            {reducedMotion ? 'Reduce Motion: On' : 'Reduce Motion: Off'}
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={resetAccessibility}
            className="min-h-[38px] px-2 text-slate-300 hover:text-white underline ml-1 focus:outline-dashed focus:outline-1 inline-flex items-center justify-center"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
