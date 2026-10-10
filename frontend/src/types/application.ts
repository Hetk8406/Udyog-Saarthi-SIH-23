import { Job } from './job';
import { CandidateDocument } from './document';

export type ApplicationStatusType =
  | 'saved'
  | 'app_started'
  | 'applied'
  | 'submitted'
  | 'admit_card_released'
  | 'exam_scheduled'
  | 'exam_attended'
  | 'result_published'
  | 'interview_scheduled'
  | 'interview_attended'
  | 'selected'
  | 'placed'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export type ApplicationTypeEnum = 'internal' | 'external_redirect';

export interface StatusHistoryItem {
  id: string;
  from_status: string;
  to_status: string;
  note: string;
  changed_by_name: string;
  created_at: string;
}

export interface JobApplicationItem {
  id: string;
  job: Job;
  application_type: ApplicationTypeEnum;
  application_type_display: string;
  status: ApplicationStatusType;
  status_display: string;
  accommodations_requested: string[];
  candidate_notes: string;
  documents?: CandidateDocument[];
  status_history: StatusHistoryItem[];
  applied_at: string;
  updated_at: string;
}

export interface ApplicationSummary {
  total: number;
  applied: number;
  exams: number;
  interviews: number;
  selected_or_placed: number;
  closed: number;
}

export interface ApplyPayload {
  job_id: string;
  application_type: ApplicationTypeEnum;
  accommodations_requested?: string[];
  candidate_notes?: string;
  document_ids?: string[];
}
