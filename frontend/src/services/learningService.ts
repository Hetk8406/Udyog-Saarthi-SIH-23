import { apiRequest } from './api';
import {
  Course,
  LearningResource,
  MockTest,
  TestAttempt,
  TimeModeType,
} from '@/types/learning';

export async function getCourses(category?: string): Promise<Course[]> {
  const query = category && category !== 'all' ? `?category=${category}` : '';
  return apiRequest<Course[]>(`/learning/courses/${query}`, {
    method: 'GET',
  });
}

export async function getResources(category?: string, search?: string): Promise<LearningResource[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (search) params.set('search', search);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<LearningResource[]>(`/learning/resources/${qs}`, {
    method: 'GET',
  });
}

export async function getResourceDetail(id: string): Promise<LearningResource> {
  return apiRequest<LearningResource>(`/learning/resources/${id}/`, {
    method: 'GET',
  });
}

export async function getMockTests(category?: string): Promise<MockTest[]> {
  const query = category && category !== 'all' ? `?category=${category}` : '';
  return apiRequest<MockTest[]>(`/learning/tests/${query}`, {
    method: 'GET',
  });
}

export async function getMockTestDetail(id: string): Promise<MockTest> {
  return apiRequest<MockTest>(`/learning/tests/${id}/`, {
    method: 'GET',
  });
}

export async function startTestAttempt(
  testId: string,
  timeMode: TimeModeType = 'standard'
): Promise<TestAttempt> {
  return apiRequest<TestAttempt>(`/learning/tests/${testId}/start/`, {
    method: 'POST',
    body: JSON.stringify({ time_mode: timeMode }),
    requiresAuth: true,
  });
}

export async function getTestAttempt(attemptId: string): Promise<TestAttempt> {
  return apiRequest<TestAttempt>(`/learning/attempts/${attemptId}/`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function saveTestAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string,
  isMarkedForReview: boolean = false
): Promise<{ question_id: string; selected_option_id: string; is_marked_for_review: boolean }> {
  return apiRequest(`/learning/attempts/${attemptId}/answer/`, {
    method: 'POST',
    body: JSON.stringify({
      question_id: questionId,
      selected_option_id: selectedOptionId,
      is_marked_for_review: isMarkedForReview,
    }),
    requiresAuth: true,
  });
}

export async function submitTestAttempt(
  attemptId: string,
  timeSpentSeconds: number
): Promise<TestAttempt> {
  return apiRequest<TestAttempt>(`/learning/attempts/${attemptId}/submit/`, {
    method: 'POST',
    body: JSON.stringify({ time_spent_seconds: timeSpentSeconds }),
    requiresAuth: true,
  });
}

export async function getMyAttempts(): Promise<TestAttempt[]> {
  return apiRequest<TestAttempt[]>('/learning/attempts/', {
    method: 'GET',
    requiresAuth: true,
  });
}
