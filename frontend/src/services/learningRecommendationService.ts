import { apiRequest } from './api';
import { LearningRecommendation } from '@/types/ai';

export const learningRecommendationService = {
  /**
   * Fetches diagnostic learning recommendations based on weak subjects in mock test attempts.
   */
  async getRecommendations(): Promise<LearningRecommendation> {
    return apiRequest<LearningRecommendation>('/ai-assistant/learning/recommendations/', {
      method: 'GET',
      requiresAuth: true,
    });
  },
};
