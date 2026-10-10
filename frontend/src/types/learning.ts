export type CourseCategoryType =
  | 'govt_exam_prep'
  | 'reasoning'
  | 'aptitude'
  | 'english'
  | 'computer_skills'
  | 'communication'
  | 'interview_prep'
  | 'workplace_skills';

export type CourseLevelType = 'beginner' | 'intermediate' | 'advanced';

export type ResourceTypeEnum = 'article' | 'video_link' | 'study_guide' | 'model_paper';

export type TimeModeType = 'standard' | 'compensatory' | 'extended' | 'untimed';

export interface LearningResource {
  id: string;
  course?: string | null;
  title: string;
  category: CourseCategoryType;
  category_display: string;
  resource_type: ResourceTypeEnum;
  resource_type_display: string;
  content_text: string;
  external_url?: string;
  accessibility_notes?: string;
  estimated_minutes: number;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  category: CourseCategoryType;
  category_display: string;
  description: string;
  level: CourseLevelType;
  level_display: string;
  resource_count: number;
  resources: LearningResource[];
  created_at: string;
}

export interface MockTest {
  id: string;
  title: string;
  category: CourseCategoryType;
  category_display: string;
  description: string;
  instructions: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  question_count: number;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  question_text: string;
  subject: string;
  marks: number;
  negative_marks: number;
  options: QuestionOption[];
  correct_option_id?: string;
  explanation?: string;
  order: number;
}

export interface TestAnswer {
  id: string;
  question: string;
  selected_option_id: string;
  is_correct: boolean;
  is_marked_for_review: boolean;
  answered_at: string;
}

export interface SubjectStats {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
}

export interface TestAttempt {
  id: string;
  mock_test: MockTest;
  time_mode: TimeModeType;
  time_spent_seconds: number;
  is_submitted: boolean;
  score: string | null;
  score_percentage: string | null;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  subject_breakdown: Record<string, SubjectStats>;
  weak_subject_suggestion: string;
  passed: boolean;
  started_at: string;
  completed_at: string | null;
  answers: TestAnswer[];
  questions: Question[];
}
