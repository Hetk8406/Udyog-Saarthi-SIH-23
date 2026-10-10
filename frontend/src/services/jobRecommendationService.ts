import { apiRequest } from './api';
import { JobRecommendation } from '@/types/ai';

export const jobRecommendationService = {
  /**
   * Fetches explainable job recommendations based on skills, education, location, and preferences.
   * Disability category is NEVER used to rule jobs in or out.
   */
  async getRecommendations(limit: number = 6): Promise<JobRecommendation[]> {
    return apiRequest<JobRecommendation[]>(`/ai-assistant/jobs/recommendations/?limit=${limit}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
};
