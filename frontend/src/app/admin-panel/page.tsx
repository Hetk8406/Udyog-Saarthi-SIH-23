'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/api';
import { adminService } from '@/services/adminService';
import {
  AdminStats,
  AdminUserItem,
  AdminCandidateItem,
  AdminCoachItem,
  AdminOrganizationItem,
  AdminJobItem,
  AdminCourseItem,
  AdminResourceItem,
  AdminMockTestItem,
  AdminQuestionItem,
  AdminTicketItem,
  SuccessStoryItem,
  FeedbackItem,
  AdminAuditLogItem,
} from '@/types/admin';
import AccessibleAdminTable, { Column } from '@/components/admin/AccessibleAdminTable';

type ManagementTab =
  | 'overview'
  | 'users'
  | 'candidates'
  | 'coaches'
  | 'organizations'
  | 'jobs'
  | 'courses'
  | 'resources'
  | 'questions'
  | 'mock_tests'
  | 'tickets'
  | 'success_stories'
  | 'feedback'
  | 'audit_logs';

export default function AdminPanelPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ManagementTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Table generic states
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableCount, setTableCount] = useState(0);
  const [tablePages, setTablePages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTable, setLoadingTable] = useState(false);
  const [statusActionMsg, setStatusActionMsg] = useState('');

  // Job Creation Modal State (Journey 4)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobOrgId, setNewJobOrgId] = useState('');
  const [newJobSector, setNewJobSector] = useState('government');
  const [newJobWorkMode, setNewJobWorkMode] = useState('on_site');
  const [newJobCity, setNewJobCity] = useState('');
  const [newJobState, setNewJobState] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobDeadline, setNewJobDeadline] = useState('');
  const [newJobVacancies, setNewJobVacancies] = useState('1');
  const [newJobPwdVacancies, setNewJobPwdVacancies] = useState('1');
  const [submittingJob, setSubmittingJob] = useState(false);
  const [jobError, setJobError] = useState('');
  const [orgOptions, setOrgOptions] = useState<{ id: string; name: string }[]>([]);

  async function openCreateJobModal() {
    setShowCreateJobModal(true);
    setJobError('');
    try {
      const orgs = await apiRequest<{ id: string; name: string }[]>('/jobs/organizations/', { method: 'GET' });
      setOrgOptions(orgs);
      if (orgs.length > 0 && !newJobOrgId) {
        setNewJobOrgId(orgs[0].id);
      }
    } catch (err) {
      console.error('Failed to load organizations', err);
    }
  }

  async function handleCreateJobSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newJobTitle.trim() || !newJobOrgId || !newJobCity.trim() || !newJobDeadline || submittingJob) return;

    setSubmittingJob(true);
    setJobError('');
    try {
      await apiRequest('/jobs/', {
        method: 'POST',
        body: JSON.stringify({
          title: newJobTitle.trim(),
          organization_id: newJobOrgId,
          sector: newJobSector,
          work_mode: newJobWorkMode,
          location_city: newJobCity.trim(),
          location_state: newJobState.trim() || 'National',
          description: newJobDesc.trim() || 'Role details and accessibility accommodations.',
          application_start_date: new Date().toISOString().split('T')[0],
          application_deadline: newJobDeadline,
          vacancies_total: parseInt(newJobVacancies, 10) || 1,
          vacancies_pwd_reserved: parseInt(newJobPwdVacancies, 10) || 1,
          official_application_url: 'https://example.gov.in/recruitment',
        }),
        requiresAuth: true,
      });
      setShowCreateJobModal(false);
      setStatusActionMsg(`Job "${newJobTitle.trim()}" successfully published.`);
      setNewJobTitle('');
      setNewJobCity('');
      setNewJobDeadline('');
      setNewJobDesc('');
      loadTabData();
    } catch (err: any) {
      setJobError(err.message || 'Failed to create job posting.');
    } finally {
      setSubmittingJob(false);
    }
  }

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?returnTo=%2Fadmin-panel');
    }
  }, [user, authLoading, router]);

  // Initial stats fetch only when authorized
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadStats();
    }
  }, [user]);

  // Fetch table data when activeTab, currentPage, or searchQuery changes
  useEffect(() => {
    if (activeTab !== 'overview') {
      loadTabData();
    }
  }, [activeTab, currentPage, searchQuery]);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadTabData() {
    setLoadingTable(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'users':
          endpoint = 'users';
          break;
        case 'candidates':
          endpoint = 'candidates';
          break;
        case 'coaches':
          endpoint = 'coaches';
          break;
        case 'organizations':
          endpoint = 'organizations';
          break;
        case 'jobs':
          endpoint = 'jobs';
          break;
        case 'courses':
          endpoint = 'courses';
          break;
        case 'resources':
          endpoint = 'resources';
          break;
        case 'mock_tests':
          endpoint = 'mock-tests';
          break;
        case 'questions':
          endpoint = 'questions';
          break;
        case 'tickets':
          endpoint = 'tickets';
          break;
        case 'success_stories':
          endpoint = 'success-stories';
          break;
        case 'feedback':
          endpoint = 'feedback';
          break;
        case 'audit_logs':
          endpoint = 'audit-logs';
          break;
        default:
          return;
      }

      const res = await adminService.getEntityList<any>(endpoint, {
        page: currentPage,
        search: searchQuery,
      });
      setTableData(res.results || []);
      setTableCount(res.count || 0);
      setTablePages(res.num_pages || 1);
    } catch (err: any) {
      console.error('Failed to load entity list for ' + activeTab, err);
    } finally {
      setLoadingTable(false);
    }
  }

  const handleTabChange = (tab: ManagementTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const notifyAction = (msg: string) => {
    setStatusActionMsg(msg);
    setTimeout(() => setStatusActionMsg(''), 4000);
    loadStats();
    loadTabData();
  };

  // Quick action: Toggle user active status
  async function toggleUserStatus(u: AdminUserItem) {
    try {
      await adminService.updateUser(u.id, { is_active: !u.is_active });
      notifyAction(`User ${u.email} status toggled.`);
    } catch (err: any) {
      alert('Error updating user status: ' + err.message);
    }
  }

  // Quick action: Change job status
  async function handleJobStatusChange(jobId: string, newStatus: string) {
    try {
      await adminService.updateJobStatus(jobId, newStatus);
      notifyAction(`Job status updated to ${newStatus}.`);
    } catch (err: any) {
      alert('Error updating job: ' + err.message);
    }
  }

  // Quick action: Resolve ticket
  async function handleTicketResolve(ticketId: string) {
    try {
      await adminService.updateTicket(ticketId, { status: 'resolved' });
      notifyAction('Support ticket marked as Resolved.');
    } catch (err: any) {
      alert('Error updating ticket: ' + err.message);
    }
  }

  // Define Columns for each entity tab
  const getUserColumns = (): Column<AdminUserItem>[] => [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
          {u.role}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Account Status',
      render: (u) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
            u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {u.is_active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Admin Action',
      render: (u) => (
        <button
          type="button"
          onClick={() => toggleUserStatus(u)}
          className="text-xs text-blue-700 hover:underline font-semibold"
        >
          {u.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  const getCandidateColumns = (): Column<AdminCandidateItem>[] => [
    { key: 'full_name', header: 'Candidate Name' },
    { key: 'email', header: 'Email' },
    { key: 'city', header: 'Location', render: (c) => `${c.city || '—'}, ${c.state || ''}` },
    { key: 'primary_disability', header: 'Disability Category' },
    {
      key: 'completion_percentage',
      header: 'Profile %',
      render: (c) => (
        <span className="font-mono font-bold text-blue-700">{c.completion_percentage}%</span>
      ),
    },
    {
      key: 'applications_count',
      header: 'Applications',
      render: (c) => <span>{c.applications_count} submitted</span>,
    },
  ];

  const getCoachColumns = (): Column<AdminCoachItem>[] => [
    { key: 'full_name', header: 'Coach' },
    { key: 'email', header: 'Coach Email' },
    { key: 'candidate_name', header: 'Assigned Candidate' },
    { key: 'candidate_email', header: 'Candidate Email' },
    {
      key: 'is_active',
      header: 'Status',
      render: (c) => (
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
          {c.is_active ? 'Active' : 'Archived'}
        </span>
      ),
    },
  ];

  const getOrganizationColumns = (): Column<AdminOrganizationItem>[] => [
    { key: 'name', header: 'Organization Name' },
    { key: 'org_type', header: 'Type', render: (o) => <span className="capitalize">{o.org_type.replace('_', ' ')}</span> },
    {
      key: 'website',
      header: 'Website',
      render: (o) =>
        o.website ? (
          <a
            href={o.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1"
          >
            <span>Visit</span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens external website in a new tab)</span>
          </a>
        ) : (
          '—'
        ),
    },
    { key: 'jobs_count', header: 'Openings', render: (o) => <span className="font-bold">{o.jobs_count}</span> },
    {
      key: 'verified',
      header: 'Verification',
      render: (o) => (
        <span className="text-emerald-700 font-bold text-xs">✓ Verified</span>
      ),
    },
  ];

  const getJobColumns = (): Column<AdminJobItem>[] => [
    { key: 'title', header: 'Job Title' },
    { key: 'organization_name', header: 'Organization' },
    { key: 'sector', header: 'Sector', render: (j) => <span className="uppercase font-bold text-[10px] text-slate-600">{j.sector}</span> },
    { key: 'application_deadline', header: 'Deadline', render: (j) => <span className="font-mono">{j.application_deadline}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (j) => (
        <select
          value={j.status}
          onChange={(e) => handleJobStatusChange(j.id, e.target.value)}
          className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 bg-white"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
      ),
    },
    { key: 'applications_count', header: 'Applicants', render: (j) => <span>{j.applications_count}</span> },
  ];

  const getCourseColumns = (): Column<AdminCourseItem>[] => [
    { key: 'title', header: 'Course Title' },
    { key: 'category', header: 'Category', render: (c) => <span className="capitalize">{c.category.replace('_', ' ')}</span> },
    { key: 'level', header: 'Difficulty', render: (c) => <span className="capitalize font-semibold">{c.level}</span> },
    { key: 'resources_count', header: 'Resources', render: (c) => <span>{c.resources_count}</span> },
    {
      key: 'is_published',
      header: 'Status',
      render: (c) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
          {c.is_published ? 'Published' : 'Draft'}
        </span>
      ),
    },
  ];

  const getResourceColumns = (): Column<AdminResourceItem>[] => [
    { key: 'title', header: 'Resource Title' },
    { key: 'course_title', header: 'Course', render: (r) => r.course_title || 'General Resource' },
    { key: 'resource_type', header: 'Type', render: (r) => <span className="uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">{r.resource_type}</span> },
    { key: 'created_at', header: 'Created', render: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const getMockTestColumns = (): Column<AdminMockTestItem>[] => [
    { key: 'title', header: 'Test Name' },
    { key: 'category', header: 'Subject' },
    { key: 'duration_minutes', header: 'Base Duration', render: (t) => `${t.duration_minutes} mins` },
    { key: 'questions_count', header: 'Questions', render: (t) => `${t.questions_count} Qs` },
    { key: 'attempts_count', header: 'Total Attempts', render: (t) => <span className="font-bold">{t.attempts_count}</span> },
    {
      key: 'is_published',
      header: 'Live',
      render: (t) => (
        <span className="text-emerald-700 font-bold">✓ Live</span>
      ),
    },
  ];

  const getQuestionColumns = (): Column<AdminQuestionItem>[] => [
    { key: 'question_text', header: 'Question', render: (q) => <span className="line-clamp-2 max-w-md">{q.question_text}</span> },
    { key: 'subject', header: 'Subject' },
    { key: 'mock_test_title', header: 'Exam Paper' },
    { key: 'correct_option_id', header: 'Correct Key', render: (q) => <span className="font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">Option {q.correct_option_id}</span> },
  ];

  const getTicketColumns = (): Column<AdminTicketItem>[] => [
    { key: 'subject', header: 'Subject / Issue' },
    { key: 'candidate_name', header: 'Candidate' },
    { key: 'category', header: 'Category', render: (t) => <span className="capitalize">{t.category.replace('_', ' ')}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          {t.status.replace('_', ' ')}
        </span>
      ),
    },
    { key: 'assigned_coach_name', header: 'Coach Assigned', render: (t) => t.assigned_coach_name || 'Unassigned' },
    {
      key: 'actions',
      header: 'Quick Action',
      render: (t) => (
        <button
          type="button"
          onClick={() => handleTicketResolve(t.id)}
          className="text-xs font-semibold text-emerald-700 hover:underline"
        >
          Resolve
        </button>
      ),
    },
  ];

  const getStoryColumns = (): Column<SuccessStoryItem>[] => [
    { key: 'candidate_name', header: 'Candidate' },
    { key: 'job_title', header: 'Placed Role' },
    { key: 'organization_name', header: 'Organization' },
    { key: 'sector', header: 'Sector' },
    { key: 'outcome', header: 'Outcome', render: (s) => <span className="font-bold text-emerald-800">{s.outcome}</span> },
  ];

  const getFeedbackColumns = (): Column<FeedbackItem>[] => [
    {
      key: 'rating',
      header: 'Rating',
      render: (f) => (
        <span className="font-bold text-amber-600">{'★'.repeat(f.rating)} ({f.rating}/5)</span>
      ),
    },
    { key: 'category', header: 'Topic', render: (f) => <span className="capitalize">{f.category.replace('_', ' ')}</span> },
    { key: 'feedback_text', header: 'Feedback Note', render: (f) => <span className="line-clamp-2">{f.feedback_text}</span> },
    { key: 'user_name', header: 'Submitted By' },
    { key: 'created_at', header: 'Date', render: (f) => new Date(f.created_at).toLocaleDateString() },
  ];

  const getAuditColumns = (): Column<AdminAuditLogItem>[] => [
    { key: 'action_type', header: 'Action', render: (a) => <span className="font-mono font-bold text-blue-700">{a.action_type}</span> },
    { key: 'target_entity', header: 'Entity', render: (a) => <span className="font-bold">{a.target_entity}</span> },
    { key: 'admin_name', header: 'Administrator' },
    { key: 'created_at', header: 'Timestamp', render: (a) => <span className="font-mono text-[11px] text-slate-500">{new Date(a.created_at).toLocaleString()}</span> },
  ];

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-slate-600 font-medium">Verifying administrator workspace...</p>
      </div>
    );
  }

  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center" role="alert">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-700 text-3xl font-black mb-4">
          !
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-6">
          Administrator privileges are required to access this portal. Your current role ({user.role}) is not authorized.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-sm transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Notifications */}
      {statusActionMsg && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold rounded-lg flex items-center justify-between">
          <span>✓ {statusActionMsg}</span>
          <button type="button" onClick={() => setStatusActionMsg('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <nav aria-label="Admin Navigation Tabs" className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {[
            { id: 'overview', label: '📊 Stats Overview' },
            { id: 'users', label: 'Users' },
            { id: 'candidates', label: 'Candidates' },
            { id: 'coaches', label: 'Job Coaches' },
            { id: 'organizations', label: 'Organizations' },
            { id: 'jobs', label: 'Jobs & Vacancies' },
            { id: 'courses', label: 'Courses' },
            { id: 'resources', label: 'Resources' },
            { id: 'mock_tests', label: 'Mock Tests' },
            { id: 'questions', label: 'Question Bank' },
            { id: 'tickets', label: 'Support & Tickets' },
            { id: 'success_stories', label: 'Success Stories' },
            { id: 'feedback', label: 'User Feedback' },
            { id: 'audit_logs', label: '🛡️ Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as ManagementTab)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* TAB 1: OVERVIEW & STATS CARDS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Operations Dashboard</h1>
            <p className="text-xs text-slate-600 mt-1">
              Real-time monitoring across candidate enrollments, job postings, recruitment milestones, and support resolutions.
            </p>
          </div>

          {/* Stats Cards Grid (Phase 8 Requirement: users, jobs, applications, upcoming deadlines, tickets, placements) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 block uppercase">Total Users</span>
              <span className="text-3xl font-black text-slate-900 block mt-2">
                {loadingStats ? '—' : stats?.users_total}
              </span>
              <span className="text-[11px] text-blue-600 mt-1 block">
                {stats?.candidates_total} Candidates • {stats?.coaches_total} Coaches
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
              <span className="text-xs font-bold text-blue-900 block uppercase">Active Jobs</span>
              <span className="text-3xl font-black text-blue-950 block mt-2">
                {loadingStats ? '—' : stats?.jobs_total}
              </span>
              <span className="text-[11px] text-blue-700 mt-1 block">Govt, PSU & Private</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm">
              <span className="text-xs font-bold text-purple-900 block uppercase">Applications</span>
              <span className="text-3xl font-black text-purple-950 block mt-2">
                {loadingStats ? '—' : stats?.applications_total}
              </span>
              <span className="text-[11px] text-purple-700 mt-1 block">Candidate submissions</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-amber-300 bg-amber-50/30 shadow-sm">
              <span className="text-xs font-bold text-amber-900 block uppercase">Deadlines (14d)</span>
              <span className="text-3xl font-black text-amber-950 block mt-2">
                {loadingStats ? '—' : stats?.upcoming_deadlines_total}
              </span>
              <span className="text-[11px] text-amber-800 mt-1 block">Closing soon</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
              <span className="text-xs font-bold text-red-900 block uppercase">Open Tickets</span>
              <span className="text-3xl font-black text-red-950 block mt-2">
                {loadingStats ? '—' : stats?.open_tickets_total}
              </span>
              <span className="text-[11px] text-red-700 mt-1 block">Awaiting reply / action</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-emerald-300 bg-emerald-50/30 shadow-sm">
              <span className="text-xs font-bold text-emerald-900 block uppercase">Placements</span>
              <span className="text-3xl font-black text-emerald-950 block mt-2">
                {loadingStats ? '—' : stats?.placements_total}
              </span>
              <span className="text-[11px] text-emerald-700 mt-1 block">Selected & Placed</span>
            </div>
          </div>

          {/* Quick Action Control Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-2">User & Coach Portfolio</h2>
              <p className="text-xs text-slate-600 mb-4">
                Verify accounts, manage job coach candidate assignments, and oversee parental delegation permissions.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('users')}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                >
                  Manage Users →
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('coaches')}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Assign Coaches →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-2">Learning & Examination Bank</h2>
              <p className="text-xs text-slate-600 mb-4">
                Configure accessible mock test papers, reasoning questions, and study material guides.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('mock_tests')}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                >
                  Mock Tests ({stats?.mock_tests_total}) →
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('courses')}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Courses →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-2">Transparency & Audit Log</h2>
              <p className="text-xs text-slate-600 mb-4">
                Inspect sensitive role mutations, security status toggles, and review community feedback ratings.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('audit_logs')}
                  className="px-3 py-1.5 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800"
                >
                  Audit Trail →
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('feedback')}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Feedback ({stats?.feedback_total}) →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REUSABLE ACCESSIBLE TABLE RENDERER */}
      {activeTab === 'users' && (
        <AccessibleAdminTable<AdminUserItem>
          caption="Registered Users Management"
          columns={getUserColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search by email or name..."
        />
      )}

      {activeTab === 'candidates' && (
        <AccessibleAdminTable<AdminCandidateItem>
          caption="Candidate Profiles & Needs Directory"
          columns={getCandidateColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search candidates by name or city..."
        />
      )}

      {activeTab === 'coaches' && (
        <AccessibleAdminTable<AdminCoachItem>
          caption="Job Coach Assignments"
          columns={getCoachColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search coach or candidate name..."
        />
      )}

      {activeTab === 'organizations' && (
        <AccessibleAdminTable<AdminOrganizationItem>
          caption="Hiring Organizations & Departments"
          columns={getOrganizationColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search organization name..."
        />
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              id="create-job-btn"
              onClick={openCreateJobModal}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <span>+ Post New Job</span>
            </button>
          </div>
          <AccessibleAdminTable<AdminJobItem>
            caption="Job Postings & Vacancy Pipeline"
            columns={getJobColumns()}
            data={tableData}
            loading={loadingTable}
            totalCount={tableCount}
            currentPage={currentPage}
            numPages={tablePages}
            onPageChange={setCurrentPage}
            onSearch={setSearchQuery}
            searchPlaceholder="Search job title, ministry, or city..."
          />
        </div>
      )}

      {activeTab === 'courses' && (
        <AccessibleAdminTable<AdminCourseItem>
          caption="Course Curriculum Management"
          columns={getCourseColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search course titles..."
        />
      )}

      {activeTab === 'resources' && (
        <AccessibleAdminTable<AdminResourceItem>
          caption="Learning Resources & Study Guides"
          columns={getResourceColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search resources..."
        />
      )}

      {activeTab === 'mock_tests' && (
        <AccessibleAdminTable<AdminMockTestItem>
          caption="Mock Tests & Examination Papers"
          columns={getMockTestColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search mock test titles..."
        />
      )}

      {activeTab === 'questions' && (
        <AccessibleAdminTable<AdminQuestionItem>
          caption="Central Question Bank"
          columns={getQuestionColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search question text or subject..."
        />
      )}

      {activeTab === 'tickets' && (
        <AccessibleAdminTable<AdminTicketItem>
          caption="Support Desk & Grievance Tickets"
          columns={getTicketColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search tickets by subject or candidate..."
        />
      )}

      {activeTab === 'success_stories' && (
        <AccessibleAdminTable<SuccessStoryItem>
          caption="Published Success Stories (PRD Section 18)"
          columns={getStoryColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search candidate or job role..."
        />
      )}

      {activeTab === 'feedback' && (
        <AccessibleAdminTable<FeedbackItem>
          caption="User Feedback & Ratings (PRD Section 19)"
          columns={getFeedbackColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search feedback remarks..."
        />
      )}

      {activeTab === 'audit_logs' && (
        <AccessibleAdminTable<AdminAuditLogItem>
          caption="Administrator Action Audit Log (Security & Compliance)"
          columns={getAuditColumns()}
          data={tableData}
          loading={loadingTable}
          totalCount={tableCount}
          currentPage={currentPage}
          numPages={tablePages}
          onPageChange={setCurrentPage}
          onSearch={setSearchQuery}
          searchPlaceholder="Search audit details or admin..."
        />
      )}

      {/* Create Job Modal (Journey 4) */}
      {showCreateJobModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-job-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 id="create-job-modal-title" className="text-lg font-bold text-slate-900">
                Post New Job Vacancy
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateJobModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {jobError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
                {jobError}
              </div>
            )}

            <form onSubmit={handleCreateJobSubmit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="new-job-title" className="block font-bold text-slate-700 mb-1">
                  Job Title *
                </label>
                <input
                  id="new-job-title"
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Statistical Assistant Grade II"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="new-job-org" className="block font-bold text-slate-700 mb-1">
                  Hiring Organization *
                </label>
                <select
                  id="new-job-org"
                  required
                  value={newJobOrgId}
                  onChange={(e) => setNewJobOrgId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600"
                >
                  {orgOptions.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-job-sector" className="block font-bold text-slate-700 mb-1">
                    Sector
                  </label>
                  <select
                    id="new-job-sector"
                    value={newJobSector}
                    onChange={(e) => setNewJobSector(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="government">Government</option>
                    <option value="psu">PSU</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="new-job-work-mode" className="block font-bold text-slate-700 mb-1">
                    Work Mode
                  </label>
                  <select
                    id="new-job-work-mode"
                    value={newJobWorkMode}
                    onChange={(e) => setNewJobWorkMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="on_site">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-job-city" className="block font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    id="new-job-city"
                    type="text"
                    required
                    value={newJobCity}
                    onChange={(e) => setNewJobCity(e.target.value)}
                    placeholder="New Delhi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="new-job-deadline" className="block font-bold text-slate-700 mb-1">
                    Application Deadline *
                  </label>
                  <input
                    id="new-job-deadline"
                    type="date"
                    required
                    value={newJobDeadline}
                    onChange={(e) => setNewJobDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-job-desc" className="block font-bold text-slate-700 mb-1">
                  Description & Accommodations
                </label>
                <textarea
                  id="new-job-desc"
                  rows={2}
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  placeholder="Vacancy overview and accessibility features..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateJobModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-job-btn"
                  disabled={submittingJob}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold transition disabled:opacity-50"
                >
                  {submittingJob ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
