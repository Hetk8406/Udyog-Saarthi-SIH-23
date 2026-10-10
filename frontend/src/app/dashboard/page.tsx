'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getMyProfile } from '@/services/profileService';
import { CandidateProfileData } from '@/types/profile';
import { getApplicationSummary } from '@/services/applicationService';
import { ApplicationSummary } from '@/types/application';
import { jobRecommendationService } from '@/services/jobRecommendationService';
import { learningRecommendationService } from '@/services/learningRecommendationService';
import { JobRecommendation, LearningRecommendation } from '@/types/ai';
import DashboardLoading from './loading';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [appSummary, setAppSummary] = useState<ApplicationSummary | null>(null);
  const [jobRecs, setJobRecs] = useState<JobRecommendation[]>([]);
  const [learningRec, setLearningRec] = useState<LearningRecommendation | null>(null);

  // Protect route: Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Load candidate profile details & application stats & AI recommendations
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [profileData, summaryData, jobRecsData, learningRecsData] = await Promise.allSettled([
          getMyProfile(),
          getApplicationSummary(),
          jobRecommendationService.getRecommendations(3),
          learningRecommendationService.getRecommendations(),
        ]);
        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value);
        }
        if (summaryData.status === 'fulfilled') {
          setAppSummary(summaryData.value);
        }
        if (jobRecsData.status === 'fulfilled') {
          setJobRecs(jobRecsData.value);
        }
        if (learningRecsData.status === 'fulfilled') {
          setLearningRec(learningRecsData.value);
        }
      } catch {
        // Handled silently
      } finally {
        setLoadingProfile(false);
      }
    }

    if (user) {
      loadData();
    }
  }, [user]);

  if (loading || !user) {
    return <DashboardLoading />;
  }

  const getRoleBadge = (role: string) => {
    const map: Record<string, { label: string; color: string }> = {
      candidate: { label: 'Candidate', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      guardian: { label: 'Parent / Guardian', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      coach: { label: 'Job Coach', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      admin: { label: 'Administrator', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    };
    const current = map[role] || { label: role, color: 'bg-slate-100 text-slate-800 border-slate-300' };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${current.color}`}>
        {current.label}
      </span>
    );
  };

  const completionScore = profile ? profile.completion_percentage : 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user.full_name}!
              </h1>
              {getRoleBadge(user.role)}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Account Email: <strong className="text-slate-800">{user.email}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user.role === 'admin' && (
              <Link
                href="/admin-panel"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-lg shadow-sm border border-amber-600 animate-pulse"
              >
                ⚙ Open Central Admin Console (/admin-panel)
              </Link>
            )}
            <Link
              href="/dashboard/applications"
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm"
            >
              📄 My Applications
            </Link>
            <Link
              href="/learning"
              className="px-3.5 py-2 border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold text-sm rounded-lg shadow-sm"
            >
              📚 Mock Tests & Learning
            </Link>
            <Link
              href="/jobs"
              className="px-3.5 py-2 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-sm rounded-lg shadow-sm"
            >
              Explore Jobs
            </Link>
            <Link
              href="/dashboard/saved-jobs"
              className="px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-sm rounded-lg shadow-sm"
            >
              ★ Saved Jobs
            </Link>
            <Link
              href="/support"
              className="px-3.5 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-sm rounded-lg shadow-sm"
            >
              💬 Support & Coach
            </Link>
            <Link
              href="/dashboard/profile"
              className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg shadow-sm"
            >
              {completionScore >= 80 ? 'Profile' : 'Complete Profile'}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Profile Completion Card (Phase 2 Requirement) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Your Profile Completion</h2>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                {completionScore}%
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {completionScore >= 80
                ? 'Great job! Your profile is well-detailed for disability reservations and accommodations.'
                : 'Complete your accessibility needs, education, and skills to unlock maximum job matching.'}
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="self-start sm:self-auto text-sm font-bold text-blue-700 hover:text-blue-800 underline"
          >
            Open Step-by-Step Profile Wizard →
          </Link>
        </div>

        {/* Accessible Progress Bar */}
        <div
          className="w-full bg-slate-200 rounded-full h-3.5 mt-4 overflow-hidden"
          role="progressbar"
          aria-valuenow={completionScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completion percentage"
        >
          <div
            className="bg-blue-600 h-3.5 rounded-full transition-all duration-500"
            style={{ width: `${completionScore}%` }}
          ></div>
        </div>
      </section>

      {/* Application Stage Summary (Phase 4 Requirement) */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Job Application Pipeline</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Current progress across your recruitment stages, exams, and interviews.
            </p>
          </div>
          <Link
            href="/dashboard/applications"
            className="text-xs font-bold text-blue-700 hover:text-blue-800 underline"
          >
            View Full Tracking Timeline →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <Link
            href="/dashboard/applications"
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition block text-center"
          >
            <span className="text-xs text-slate-500 font-semibold block">Total Applied</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">
              {appSummary ? appSummary.total : 0}
            </span>
          </Link>

          <Link
            href="/dashboard/applications"
            className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition block text-center"
          >
            <span className="text-xs text-blue-800 font-semibold block">Under Review</span>
            <span className="text-2xl font-black text-blue-950 block mt-1">
              {appSummary ? appSummary.applied : 0}
            </span>
          </Link>

          <Link
            href="/dashboard/applications"
            className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition block text-center"
          >
            <span className="text-xs text-amber-800 font-semibold block">Examinations</span>
            <span className="text-2xl font-black text-amber-950 block mt-1">
              {appSummary ? appSummary.exams : 0}
            </span>
          </Link>

          <Link
            href="/dashboard/applications"
            className="p-3.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition block text-center"
          >
            <span className="text-xs text-purple-800 font-semibold block">Interviews</span>
            <span className="text-2xl font-black text-purple-950 block mt-1">
              {appSummary ? appSummary.interviews : 0}
            </span>
          </Link>

          <Link
            href="/dashboard/applications"
            className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition block text-center col-span-2 sm:col-span-1"
          >
            <span className="text-xs text-emerald-800 font-semibold block">Selected / Offers</span>
            <span className="text-2xl font-black text-emerald-950 block mt-1">
              {appSummary ? appSummary.selected_or_placed : 0}
            </span>
          </Link>
        </div>
      </section>

      {/* AI HELPER 1: Explainable Job Recommendations (Phase 9) */}
      {jobRecs.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  🎯 Recommended Opportunities For You
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Transparent Match
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Calculated strictly from your skills, education, target locations, and preferences. No black box.
              </p>
            </div>
            <Link href="/jobs" className="text-xs font-bold text-blue-700 hover:underline">
              Explore All Vacancies →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {jobRecs.map((rec) => (
              <div
                key={rec.job_id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {rec.sector_display}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-700 text-white shadow-xs">
                      {rec.match_percentage}% Match
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {rec.job_title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">{rec.organization_name}</p>
                  <p className="text-xs text-slate-500 mt-1">📍 {rec.location} • {rec.work_mode_display}</p>

                  {/* Why this matched explanation list */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Why this matched:
                    </span>
                    <ul className="space-y-0.5">
                      {rec.match_reasons.map((reason, idx) => (
                        <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1">
                          <span className="text-emerald-700 font-bold shrink-0">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-red-700 font-medium font-mono">
                    Deadline: {rec.application_deadline}
                  </span>
                  <Link
                    href={`/jobs/${rec.job_id}`}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    View & Apply →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI HELPER 2: Mock-Test Diagnostics & Weak Subject Practice (Phase 9) */}
      {learningRec && (
        <section className="bg-gradient-to-r from-purple-50 via-white to-blue-50 rounded-xl border border-purple-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-purple-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-purple-950">
                  📈 Test Preparation Diagnostics
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Personalized Study Path
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-0.5">
                {learningRec.advice_summary}
              </p>
            </div>
            <Link href="/learning" className="text-xs font-bold text-purple-800 hover:underline">
              Practice Mock Exams →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {learningRec.recommended_courses.map((course) => (
              <div
                key={course.id}
                className="p-4 rounded-xl bg-white border border-purple-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {course.category}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    🎯 <strong>Focus:</strong> {course.reason}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <Link
                    href={`/learning/courses/${course.id}`}
                    className="text-xs font-bold text-purple-700 hover:underline"
                  >
                    Start Targeted Lesson →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Overview Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Accessibility & Accommodations */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Accessibility & Needs</h3>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                Step 2
              </span>
            </div>
            {profile?.accessibility_profile ? (
              <div className="text-sm space-y-1 text-slate-600">
                <p>
                  <strong>Disability:</strong>{' '}
                  <span className="capitalize">
                    {profile.accessibility_profile.primary_disability_display ||
                      profile.accessibility_profile.primary_disability.replace(/_/g, ' ')}
                  </span>
                </p>
                <p>
                  <strong>Exam Scribe:</strong>{' '}
                  {profile.accessibility_profile.needs_scribe ? 'Requested (Yes)' : 'Not needed'}
                </p>
                <p>
                  <strong>Extra Time:</strong>{' '}
                  {profile.accessibility_profile.needs_extra_time_for_exams ? 'Requested (Yes)' : 'Not needed'}
                </p>
                {profile.accessibility_profile.udid_number && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    ✓ UDID Recorded ({profile.accessibility_profile.udid_number.slice(0, 4)}••••)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not configured yet.</p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Update accommodations →
            </Link>
          </div>
        </div>

        {/* Card 2: Academic & Skills Count */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Qualifications & Skills</h3>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                Steps 3 & 4
              </span>
            </div>
            <div className="text-sm space-y-1 text-slate-600">
              <p>
                <strong>Qualifications:</strong>{' '}
                {profile?.educations?.length || 0} added
              </p>
              <p>
                <strong>Skills:</strong>{' '}
                {profile?.skills?.length || 0} added
              </p>
              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.skills.slice(0, 3).map((s) => (
                    <span key={s.id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {s.name}
                    </span>
                  ))}
                  {profile.skills.length > 3 && (
                    <span className="text-[11px] text-slate-400">+{profile.skills.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Manage qualifications & skills →
            </Link>
          </div>
        </div>

        {/* Card 3: Career Preferences */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Career Preferences</h3>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                Step 5
              </span>
            </div>
            <div className="text-sm space-y-1 text-slate-600">
              <p>
                <strong>Preferred Sector:</strong>{' '}
                <span className="capitalize">{profile?.preferred_sector || 'Any'}</span>
              </p>
              <p>
                <strong>Work Mode:</strong>{' '}
                <span className="capitalize">{profile?.preferred_work_mode?.replace(/_/g, ' ') || 'Any'}</span>
              </p>
              <p>
                <strong>Target Locations:</strong>{' '}
                {profile?.preferred_locations?.length ? profile.preferred_locations.join(', ') : 'Not set'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Edit job preferences →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
