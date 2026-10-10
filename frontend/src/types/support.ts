export interface SupportTicket {
  id: string;
  candidate: string;
  candidate_name: string;
  candidate_email: string;
  created_by: string;
  created_by_name: string;
  category: string;
  category_display: string;
  subject: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  status_display: string;
  assigned_coach: string | null;
  assigned_coach_name: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket: string;
  sender: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  message: string;
  created_at: string;
  is_me: boolean;
}

export interface CoachCandidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  preferred_sector: string;
  preferred_work_mode: string;
  completion_percentage: number;
  primary_disability: string;
  accommodation_needs: string[];
  education_summary: {
    qualification: string;
    institution: string;
    year: number;
  }[];
  skills_summary: string[];
  active_applications_count: number;
  updated_at: string;
}

export interface CoachNote {
  id: string;
  candidate: string;
  coach: string;
  coach_name: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CoachJobRecommendation {
  id: string;
  candidate: string;
  job: string;
  job_title: string;
  organization_name: string;
  job_location: string;
  application_deadline: string;
  coach: string;
  coach_name: string;
  recommendation_note: string;
  created_at: string;
}

export interface GuardianAccess {
  id: string;
  guardian: string;
  guardian_name: string;
  guardian_email: string;
  candidate: string;
  candidate_name: string;
  candidate_email: string;
  relationship: string;
  allow_view_profile: boolean;
  allow_view_applications: boolean;
  allow_view_support_tickets: boolean;
  allow_view_learning_progress: boolean;
  created_at: string;
  updated_at: string;
}

export const TICKET_CATEGORIES = [
  { value: 'application_help', label: 'Job Application Help' },
  { value: 'exam_assistance', label: 'Examination Assistance (Scribe / Center Access)' },
  { value: 'accessibility_needs', label: 'Accessibility & Workplace Accommodations' },
  { value: 'counselling', label: 'Career Guidance & Counselling' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'coach_request', label: 'Job-Coach Assistance' },
  { value: 'interview_assistance', label: 'Interview Preparation / Mobility Assistance' },
];
