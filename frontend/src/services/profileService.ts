import { apiRequest } from './api';
import {
  CandidateProfileData,
  AccessibilityProfileData,
  EducationData,
  SkillData,
} from '@/types/profile';

export async function getMyProfile(): Promise<CandidateProfileData> {
  return apiRequest<CandidateProfileData>('/profiles/me/', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function updatePersonalInfo(
  payload: Partial<CandidateProfileData>
): Promise<CandidateProfileData> {
  return apiRequest<CandidateProfileData>('/profiles/me/', {
    method: 'PUT',
    body: JSON.stringify(payload),
    requiresAuth: true,
  });
}

export async function updateAccessibilityProfile(
  payload: Partial<AccessibilityProfileData>
): Promise<AccessibilityProfileData> {
  return apiRequest<AccessibilityProfileData>('/profiles/me/accessibility/', {
    method: 'PUT',
    body: JSON.stringify(payload),
    requiresAuth: true,
  });
}

export async function addEducation(payload: Omit<EducationData, 'id'>): Promise<EducationData> {
  return apiRequest<EducationData>('/profiles/me/education/', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: true,
  });
}

export async function deleteEducation(id: string): Promise<void> {
  return apiRequest<void>(`/profiles/me/education/${id}/`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}

export async function addSkill(payload: Omit<SkillData, 'id'>): Promise<SkillData> {
  return apiRequest<SkillData>('/profiles/me/skills/', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: true,
  });
}

export async function deleteSkill(id: string): Promise<void> {
  return apiRequest<void>(`/profiles/me/skills/${id}/`, {
    method: 'DELETE',
    requiresAuth: true,
  });
}
