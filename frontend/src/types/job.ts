export type SectorType = 'government' | 'psu' | 'private';
export type WorkModeType = 'on_site' | 'remote' | 'hybrid';

export interface Organization {
  id: string;
  name: string;
  org_type: string;
  org_type_display: string;
  website?: string;
  description?: string;
  verified: boolean;
}

export interface Job {
  id: string;
  organization: Organization;
  title: string;
  sector: SectorType;
  sector_display: string;
  work_mode: WorkModeType;
  work_mode_display: string;
  job_type: string;
  job_type_display: string;
  location_city: string;
  location_state: string;
  description: string;
  responsibilities: string;
  minimum_education: string;
  minimum_education_display: string;
  experience_required_months: number;
  salary_display: string;
  vacancies_total: number;
  vacancies_pwd_reserved: number;
  eligible_disabilities: string[];
  accessibility_facilities: string[];
  application_start_date: string;
  application_deadline: string;
  exam_date?: string | null;
  official_application_url: string;
  status: string;
  status_display: string;
  is_demo_data: boolean;
  is_saved: boolean;
  is_applied?: boolean;
  application_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedJobItem {
  id: string;
  job: Job;
  saved_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface JobFilterParams {
  search?: string;
  location?: string;
  sector?: string;
  work_mode?: string;
  education?: string;
  disability?: string;
  page?: number;
}
