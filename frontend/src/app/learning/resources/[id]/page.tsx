'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getResourceDetail } from '@/services/learningService';
import { LearningResource } from '@/types/learning';

export default function ResourceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [resource, setResource] = useState<LearningResource | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResource() {
      if (!id) return;
      try {
        const data = await getResourceDetail(id);
        setResource(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load study material.');
      } finally {
        setLoading(false);
      }
    }
    loadResource();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium">Loading study lesson...</p>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Study Lesson Not Found</h1>
        <p className="text-sm text-slate-600">{error || 'This learning resource is unavailable.'}</p>
        <Link
          href="/learning"
          className="inline-block px-4 py-2 bg-blue-700 text-white rounded-md text-sm font-semibold"
        >
          ← Back to Learning Center
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/learning"
          className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
        >
          ← Back to All Study Materials
        </Link>
      </div>

      <header className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            {resource.category_display}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {resource.resource_type_display}
          </span>
          <span className="text-xs text-slate-500">
            ⏱️ {resource.estimated_minutes} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {resource.title}
        </h1>

        {resource.accessibility_notes && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2">
            <span>♿</span>
            <span><strong>Accessibility Features:</strong> {resource.accessibility_notes}</span>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <section className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-slate-800 text-sm sm:text-base leading-relaxed space-y-4">
        <div className="prose max-w-none text-slate-800 space-y-3 whitespace-pre-line">
          {resource.content_text}
        </div>
      </section>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          href="/learning"
          className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          ← Return to Library
        </Link>

        <Link
          href="/learning"
          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm"
        >
          Take Practice Mock Tests →
        </Link>
      </div>
    </article>
  );
}
