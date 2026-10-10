import { apiRequest } from './api';
import { JobExplainerResponse } from '@/types/ai';

export const jobExplainerService = {
  /**
   * Explains job descriptions, eligibility criteria, and application steps in plain language.
   * Includes mandatory legal/medical disclaimer and points to the official notification.
   */
  async explainJob(jobId: string, query?: string): Promise<JobExplainerResponse> {
    return apiRequest<JobExplainerResponse>(`/ai-assistant/jobs/${jobId}/explain/`, {
      method: 'POST',
      body: JSON.stringify({ query: query || '' }),
      requiresAuth: false,
    });
  },
};
