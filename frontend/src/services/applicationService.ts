import { apiRequest } from './api';
import {
  JobApplicationItem,
  ApplicationSummary,
  ApplyPayload,
} from '@/types/application';

export async function getApplications(statusFilter?: string): Promise<JobApplicationItem[]> {
  const query = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
  return apiRequest<JobApplicationItem[]>(`/applications/${query}`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function getApplicationDetail(id: string): Promise<JobApplicationItem> {
  return apiRequest<JobApplicationItem>(`/applications/${id}/`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function submitApplication(payload: ApplyPayload): Promise<JobApplicationItem> {
  return apiRequest<JobApplicationItem>('/applications/', {
    method: 'POST',
    body: JSON.stringify(payload),
    requiresAuth: true,
  });
}

export async function updateApplicationStatus(
  id: string,
  newStatus: string,
  note?: string
): Promise<JobApplicationItem> {
  return apiRequest<JobApplicationItem>(`/applications/${id}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus, note: note || '' }),
    requiresAuth: true,
  });
}

export async function getApplicationSummary(): Promise<ApplicationSummary> {
  return apiRequest<ApplicationSummary>('/applications/summary/', {
    method: 'GET',
    requiresAuth: true,
  });
}
