'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getCourses } from '@/services/learningService';
import { Course } from '@/types/learning';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      if (!courseId) return;
      setLoading(true);
      setError(null);
      try {
        const allCourses = await getCourses();
        const found = allCourses.find((c) => String(c.id) === String(courseId));
        if (found) {
          setCourse(found);
        } else {
          setError('The requested course syllabus could not be found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-600 font-medium text-sm">Loading course lessons and syllabus...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Course Not Found</h1>
        <p className="text-sm text-slate-600">{error || 'Unable to locate this course.'}</p>
        <div className="pt-2">
          <Link
            href="/learning"
            className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            ← Back to Learning Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb / Back link */}
      <div>
        <Link
          href="/learning"
          className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 rounded px-1 py-1"
        >
          <span>← Back to Learning & Mock Tests</span>
        </Link>
      </div>

      {/* Course Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            {course.category_display}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            Level: {course.level_display}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
            {course.resource_count} Targeted Lesson{course.resource_count === 1 ? '' : 's'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {course.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {course.description}
        </p>
      </div>

      {/* Lessons & Study Materials Syllabus */}
      <section aria-labelledby="syllabus-heading" className="space-y-4">
        <h2 id="syllabus-heading" className="text-xl font-bold text-slate-900">
          Course Lessons & Study Guides
        </h2>

        {course.resources && course.resources.length > 0 ? (
          <div className="space-y-4">
            {course.resources.map((res, index) => (
              <div
                key={res.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-blue-300 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-blue-700">Lesson {index + 1}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{res.resource_type_display}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">⏱️ {res.estimated_minutes} min read</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{res.title}</h3>
                  {res.accessibility_notes && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block">
                      ♿ {res.accessibility_notes}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <Link
                    href={`/learning/resources/${res.id}`}
                    className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  >
                    Open Lesson →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-500">
            Lessons are being updated for this course. Please check back shortly.
          </div>
        )}
      </section>
    </div>
  );
}
