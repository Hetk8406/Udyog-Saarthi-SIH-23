'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { feedbackSchema, formatZodErrors, FormErrors, FeedbackFormData } from '@/lib/validations';
import TurnstileWidget from '@/components/common/TurnstileWidget';

export default function FeedbackPage() {
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors<FeedbackFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const CATEGORIES = [
    { value: 'general', label: 'Overall Platform Experience' },
    { value: 'accessibility', label: 'Accessibility & Screen Reader Usability' },
    { value: 'job_discovery', label: 'Job Search & Reservation Filters' },
    { value: 'learning_tests', label: 'Mock Tests & Extra-Time Accommodations' },
    { value: 'coaching_support', label: 'Job Coach Guidance & Help Desk' },
    { value: 'suggestions', label: 'New Feature Suggestion' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    const result = feedbackSchema.safeParse({
      category,
      rating,
      comments: feedbackText,
      suggestions: suggestions || undefined,
    });

    if (!result.success) {
      const errs = formatZodErrors<FeedbackFormData>(result.error);
      setFieldErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const idMap: Record<string, string> = {
        category: 'feedback-cat',
        comments: 'feedback-text',
        suggestions: 'feedback-sugg',
      };
      const el = document.getElementById(idMap[firstKey] || firstKey);
      if (el) el.focus();
      return;
    }

    setSubmitting(true);
    try {
      await adminService.submitFeedback({
        rating,
        category,
        feedback_text: feedbackText.trim(),
        suggestions: suggestions.trim(),
        turnstile_token: turnstileToken,
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          User Feedback (PRD Section 19)
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Help Us Make Udyog Saarthi Better
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Your feedback on screen reader accessibility, examination accommodations, and job matching helps our development team continuously improve the portal.
        </p>
      </div>

      {submitted ? (
        <div className="bg-white rounded-2xl border border-emerald-300 p-8 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-900">Thank You For Your Valuable Feedback!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your review and suggestions have been recorded for the platform administrator and accessibility team.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800"
            >
              Return to Home
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFeedbackText('');
                setSuggestions('');
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div role="alert" className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Rating Selector */}
            <div>
              <span id="rating-label" className="block text-sm font-bold text-slate-800 mb-2">
                Overall Experience Rating <span className="text-red-600">*</span>
              </span>
              <div className="flex items-center gap-2" role="radiogroup" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    onClick={() => setRating(star)}
                    className={`w-11 h-11 rounded-xl text-lg font-bold flex items-center justify-center transition border focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      rating >= star
                        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {rating === 5 && 'Excellent'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Needs Improvement'}
                  {rating === 1 && 'Poor'}
                </span>
              </div>
            </div>

            {/* Topic Category */}
            <div>
              <label htmlFor="feedback-cat" className="block text-sm font-bold text-slate-800 mb-1">
                Feedback Category <span className="text-red-600">*</span>
              </label>
              <select
                id="feedback-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-invalid={!!fieldErrors.category}
                aria-describedby={fieldErrors.category ? 'feedback-cat-error' : undefined}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <p id="feedback-cat-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                  {fieldErrors.category}
                </p>
              )}
            </div>

            {/* Feedback Text */}
            <div>
              <label htmlFor="feedback-text" className="block text-sm font-bold text-slate-800 mb-1">
                Your Feedback / Experience <span className="text-red-600">*</span>
              </label>
              <textarea
                id="feedback-text"
                rows={4}
                value={feedbackText}
                onChange={(e) => {
                  setFeedbackText(e.target.value);
                  if (fieldErrors.comments) setFieldErrors({ ...fieldErrors, comments: undefined });
                }}
                placeholder="Share your experience navigating the platform, attempting mock tests, or communicating with job coaches..."
                required
                aria-required="true"
                aria-invalid={!!fieldErrors.comments}
                aria-describedby={fieldErrors.comments ? 'feedback-text-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.comments
                    ? 'border-red-600 ring-1 ring-red-600 focus:ring-red-600'
                    : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {fieldErrors.comments && (
                <p id="feedback-text-error" role="alert" className="text-red-700 text-xs mt-1 font-semibold">
                  {fieldErrors.comments}
                </p>
              )}
            </div>

            {/* Suggestions */}
            <div>
              <label htmlFor="feedback-sugg" className="block text-sm font-bold text-slate-800 mb-1">
                Optional Suggestions for Improvement
              </label>
              <textarea
                id="feedback-sugg"
                rows={2}
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="What new accessibility feature or resource would make your job preparation easier?"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Cloudflare Turnstile Spam Protection */}
            <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !feedbackText.trim()}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
