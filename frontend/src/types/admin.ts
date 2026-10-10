export interface AdminStats {
  users_total: number;
  candidates_total: number;
  coaches_total: number;
  jobs_total: number;
  applications_total: number;
  upcoming_deadlines_total: number;
  open_tickets_total: number;
  placements_total: number;
  mock_tests_total: number;
  feedback_total: number;
}

export interface PaginatedAdminResponse<T> {
  count: number;
  num_pages: number;
  current_page: number;
  results: T[];
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'candidate' | 'guardian' | 'coach' | 'admin';
  is_active: boolean;
  date_joined: string;
}

export interface AdminCandidateItem {
  id: string;
  user: string;
  email: string;
  full_name: string;
  phone: string;
  city: string;
  state: string;
  preferred_sector: string;
  completion_percentage: number;
  primary_disability: string;
  educations_count: number;
  skills_count: number;
  applications_count: number;
  created_at: string;
}

export interface AdminCoachItem {
  id: string;
  coach: string;
  email: string;
  full_name: string;
  candidate: string;
  candidate_name: string;
  candidate_email: string;
  is_active: boolean;
  assigned_at: string;
}

export interface AdminOrganizationItem {
  id: string;
  name: string;
  org_type: string;
  website: string;
  description: string;
  verified: boolean;
  jobs_count: number;
}

export interface AdminJobItem {
  id: string;
  organization: string;
  organization_name: string;
  title: string;
  sector: string;
  job_type: string;
  work_mode: string;
  location_city: string;
  location_state: string;
  application_deadline: string;
  status: string;
  vacancies_total: number;
  vacancies_pwd_reserved: number;
  applications_count: number;
  created_at: string;
}

export interface AdminCourseItem {
  id: string;
  title: string;
  category: string;
  level: string;
  is_published: boolean;
  resources_count: number;
  created_at: string;
}

export interface AdminResourceItem {
  id: string;
  course: string;
  course_title: string;
  title: string;
  resource_type: string;
  is_published: boolean;
  created_at: string;
}

export interface AdminMockTestItem {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  is_published: boolean;
  questions_count: number;
  attempts_count: number;
  created_at: string;
}

export interface AdminQuestionItem {
  id: string;
  mock_test: string;
  mock_test_title: string;
  question_text: string;
  subject: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  order: number;
}

export interface AdminTicketItem {
  id: string;
  candidate: string;
  candidate_name: string;
  category: string;
  subject: string;
  status: string;
  assigned_coach: string | null;
  assigned_coach_name: string;
  created_at: string;
  updated_at: string;
}

export interface SuccessStoryItem {
  id: string;
  candidate_name: string;
  job_title: string;
  organization_name: string;
  sector: string;
  journey: string;
  challenges_faced: string;
  how_support_helped: string;
  outcome: string;
  is_featured: boolean;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  user: string | null;
  user_name: string;
  user_email: string;
  rating: number;
  category: string;
  feedback_text: string;
  suggestions: string;
  created_at: string;
}

export interface AdminAuditLogItem {
  id: string;
  admin_user: string | null;
  admin_name: string;
  admin_email: string;
  action_type: string;
  target_entity: string;
  target_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}
