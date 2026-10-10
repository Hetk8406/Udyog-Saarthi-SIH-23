'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourses, getResources, getMockTests } from '@/services/learningService';
import { Course, LearningResource, MockTest, CourseCategoryType } from '@/types/learning';

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'all', label: 'All Subjects', icon: '📚' },
  { key: 'govt_exam_prep', label: 'Govt Exam Prep', icon: '🏛️' },
  { key: 'reasoning', label: 'Reasoning Ability', icon: '🧠' },
  { key: 'aptitude', label: 'Quantitative Aptitude', icon: '📐' },
  { key: 'english', label: 'English & Comprehension', icon: '📖' },
  { key: 'computer_skills', label: 'Computer Skills', icon: '💻' },
];

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<'resources' | 'mock_tests'>('mock_tests');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLearningData() {
      setLoading(true);
      setError(null);
      try {
        const [cData, rData, mData] = await Promise.all([
          getCourses(selectedCategory),
          getResources(selectedCategory, searchQuery),
          getMockTests(selectedCategory),
        ]);
        setCourses(cData);
        setResources(rData);
        setMockTests(mData);
      } catch (err: any) {
        setError(err.message || 'Unable to load learning library.');
      } finally {
        setLoading(false);
      }
    }

    loadLearningData();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-10 shadow-md">
        <div className="max-w-3xl space-y-3">
          <span className="px-3 py-1 bg-blue-700/60 text-blue-200 border border-blue-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
            Accessible Learning & Mock Examination Center
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Prepare, Practice & Succeed on Your Own Terms
          </h1>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            Accessible study materials with audio transcripts, plain-language notes, and adaptive mock tests offering compensatory time (1.33x) and untimed practice modes.
          </p>
        </div>
      </section>

      {/* Main Mode Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Switch between Mock Tests & Study Material */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('mock_tests')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'mock_tests'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            📝 Simulated Mock Tests ({mockTests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
              activeTab === 'resources'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            📖 Study Materials & Courses ({resources.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, shortcuts..."
            aria-label="Search study topics and lessons"
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-400" aria-hidden="true">
            🔍
          </span>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Subject Categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === cat.key
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center" role="status" aria-live="polite">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-slate-600 font-medium text-sm">Loading learning content...</p>
        </div>
      )}

      {error && !loading && (
        <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-900 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* TAB 1: MOCK TESTS */}
      {!loading && !error && activeTab === 'mock_tests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Competitive & Screening Mock Examinations
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              PwD Extra-Time & Untimed Modes Supported
            </span>
          </div>

          {mockTests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <span className="text-3xl">📝</span>
              <p className="text-sm font-semibold text-slate-800">No mock tests available in this category yet.</p>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-bold text-blue-700 underline"
              >
                Clear filters to view all tests
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                        {test.category_display}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        ⏱️ {test.duration_minutes} Mins
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {test.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {test.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-500 block text-[11px]">Questions</span>
                        <strong className="text-slate-900">{test.question_count} MCQs</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-500 block text-[11px]">Passing Marks</span>
                        <strong className="text-slate-900">{test.passing_percentage}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/learning/mock-tests/${test.id}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      View Instructions & Start Test →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDY RESOURCES & COURSES */}
      {!loading && !error && activeTab === 'resources' && (
        <div className="space-y-8">
          {/* Courses Section */}
          {courses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Structured Learning Tracks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {course.category_display}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 capitalize">
                        {course.level_display}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>
                    <span className="text-xs text-blue-700 font-semibold block">
                      Includes {course.resource_count} study lessons
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Study Materials */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Study Guides, Articles & Formula Sheets
            </h2>

            {resources.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-600">
                No articles matching your search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {resources.map((res) => (
                  <article
                    key={res.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                          {res.resource_type_display}
                        </span>
                        <span className="text-slate-500">⏱️ {res.estimated_minutes} min read</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {res.title}
                      </h3>

                      {res.accessibility_notes && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded font-medium">
                          ♿ {res.accessibility_notes}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-3">
                        {res.content_text.replace(/[#*`]/g, '')}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href={`/learning/resources/${res.id}`}
                        className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        Read Lesson & Notes →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
