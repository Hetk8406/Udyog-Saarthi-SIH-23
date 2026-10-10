export interface JobRecommendation {
  job_id: string;
  job_title: string;
  organization_name: string;
  sector: string;
  sector_display: string;
  work_mode: string;
  work_mode_display: string;
  location: string;
  application_deadline: string;
  vacancies_pwd_reserved: number;
  match_percentage: number;
  match_reasons: string[];
  official_url: string;
}

export interface LearningRecommendation {
  candidate_id: string;
  total_tests_taken: number;
  subject_performance: Record<string, number>;
  identified_weak_areas: {
    subject: string;
    average_percentage: number;
    needs_practice: boolean;
  }[];
  primary_focus_subject: string;
  recommended_courses: {
    id: string;
    title: string;
    category: string;
    level: string;
    reason: string;
  }[];
  recommended_resources: {
    id: string;
    title: string;
    resource_type: string;
    course_title: string;
  }[];
  advice_summary: string;
}

export interface JobExplainerResponse {
  job_id: string;
  job_title: string;
  organization_name: string;
  deadline: string;
  plain_language_summary: string;
  eligibility_breakdown: string[];
  application_steps: string[];
  accessibility_highlights: string[];
  official_notification_link: string;
  legal_disclaimer: string;
  ai_powered: boolean;
}
