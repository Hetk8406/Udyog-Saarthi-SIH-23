import { apiRequest } from './api';
import { Job, SavedJobItem, PaginatedResponse, JobFilterParams } from '@/types/job';

export async function getJobs(params: JobFilterParams = {}): Promise<PaginatedResponse<Job>> {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.location) query.set('location', params.location);
  if (params.sector && params.sector !== 'all') query.set('sector', params.sector);
  if (params.work_mode && params.work_mode !== 'all') query.set('work_mode', params.work_mode);
  if (params.education && params.education !== 'all') query.set('education', params.education);
  if (params.disability && params.disability !== 'all') query.set('disability', params.disability);
  if (params.page) query.set('page', String(params.page));

  const queryString = query.toString();
  const endpoint = `/jobs/${queryString ? `?${queryString}` : ''}`;

  return apiRequest<PaginatedResponse<Job>>(endpoint, {
    method: 'GET',
    requiresAuth: false, // Public browsing
  });
}

export async function getJobDetail(id: string): Promise<Job> {
  return apiRequest<Job>(`/jobs/${id}/`, {
    method: 'GET',
    requiresAuth: false,
  });
}

export async function toggleSaveJob(id: string): Promise<{ saved: boolean; message: string }> {
  return apiRequest<{ saved: boolean; message: string }>(`/jobs/${id}/save/`, {
    method: 'POST',
    requiresAuth: true,
  });
}

export async function getSavedJobs(): Promise<SavedJobItem[]> {
  return apiRequest<SavedJobItem[]>('/jobs/saved/', {
    method: 'GET',
    requiresAuth: true,
  });
}
