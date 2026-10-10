import { User } from './user';

export type DisabilityCategory =
  | 'intellectual_disability'
  | 'autism_spectrum'
  | 'multiple_disabilities'
  | 'mental_illness'
  | 'specific_learning'
  | 'locomotor'
  | 'visual_impairment'
  | 'hearing_impairment'
  | 'speech_language'
  | 'other';

export type DifficultyLevel = 'none' | 'some_difficulty' | 'lot_of_difficulty' | 'cannot_do_at_all';

export interface AccessibilityProfileData {
  id?: string;
  primary_disability: DisabilityCategory;
  primary_disability_display?: string;
  disability_percentage?: number | null;
  udid_number?: string | null;
  udid_verification_status?: string;
  difficulty_seeing: DifficultyLevel;
  difficulty_hearing: DifficultyLevel;
  difficulty_walking_mobility: DifficultyLevel;
  difficulty_remembering_concentrating: DifficultyLevel;
  difficulty_self_care: DifficultyLevel;
  difficulty_communicating: DifficultyLevel;
  difficulty_upper_body: DifficultyLevel;
  assistive_devices_used: string[];
  assistive_devices_required: string[];
  needs_scribe: boolean;
  needs_sign_language_interpreter: boolean;
  needs_personal_attendant: boolean;
  needs_extra_time_for_exams: boolean;
  needs_ground_floor_access: boolean;
  other_assistance_notes?: string;
}

export interface EducationData {
  id?: string;
  qualification: string;
  institution: string;
  board_or_university?: string;
  year_of_passing: number;
  percentage_or_cgpa?: string;
  specialization?: string;
}

export interface SkillData {
  id?: string;
  name: string;
  category: 'technical' | 'computer' | 'communication' | 'vocational' | 'soft_skill' | 'general';
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

export interface CandidateProfileData {
  id: string;
  user: User;
  date_of_birth?: string | null;
  gender?: string;
  alternate_phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bio?: string;
  preferred_sector: 'govt' | 'psu' | 'private' | 'any';
  preferred_work_mode: 'on_site' | 'remote' | 'hybrid' | 'any';
  preferred_locations: string[];
  preferred_job_categories: string[];
  expected_salary_min?: number | null;
  completion_percentage: number;
  accessibility_profile: AccessibilityProfileData;
  educations: EducationData[];
  skills: SkillData[];
  created_at: string;
  updated_at: string;
}
