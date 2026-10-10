import { apiRequest } from './api';
import {
  AdminStats,
  PaginatedAdminResponse,
  AdminUserItem,
  AdminCandidateItem,
  AdminCoachItem,
  AdminOrganizationItem,
  AdminJobItem,
  AdminCourseItem,
  AdminResourceItem,
  AdminMockTestItem,
  AdminQuestionItem,
  AdminTicketItem,
  SuccessStoryItem,
  FeedbackItem,
  AdminAuditLogItem
} from '@/types/admin';

export const adminService = {
  // Stats
  async getStats(): Promise<AdminStats> {
    return apiRequest<AdminStats>('/admin-panel/stats/', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  // Generic paginated entity fetcher
  async getEntityList<T>(
    endpoint: string,
    params?: { page?: number; search?: string; [key: string]: any }
  ): Promise<PaginatedAdminResponse<T>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    Object.keys(params || {}).forEach((key) => {
      if (key !== 'page' && key !== 'search' && params![key]) {
        query.set(key, String(params![key]));
      }
    });

    const qs = query.toString();
    return apiRequest<PaginatedAdminResponse<T>>(`/admin-panel/${endpoint}/${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  // User role or status update
  async updateUser(id: string, data: { role?: string; is_active?: boolean }): Promise<AdminUserItem> {
    return apiRequest<AdminUserItem>('/admin-panel/users/', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
      requiresAuth: true,
    });
  },

  // Assign Coach
  async assignCoach(coachId: string, candidateId: string): Promise<AdminCoachItem> {
    return apiRequest<AdminCoachItem>('/admin-panel/coaches/', {
      method: 'POST',
      body: JSON.stringify({ coach_id: coachId, candidate_id: candidateId }),
      requiresAuth: true,
    });
  },

  // Job Status Update
  async updateJobStatus(id: string, status: string): Promise<AdminJobItem> {
    return apiRequest<AdminJobItem>('/admin-panel/jobs/', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
      requiresAuth: true,
    });
  },

  // Ticket Status / Coach Update
  async updateTicket(id: string, data: { status?: string; assigned_coach?: string | null }): Promise<AdminTicketItem> {
    return apiRequest<AdminTicketItem>('/admin-panel/tickets/', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
      requiresAuth: true,
    });
  },

  // Public & Admin Success Stories
  async getPublicSuccessStories(): Promise<SuccessStoryItem[]> {
    return apiRequest<SuccessStoryItem[]>('/admin-panel/public-success-stories/', {
      method: 'GET',
      requiresAuth: false,
    });
  },

  async createSuccessStory(data: Partial<SuccessStoryItem>): Promise<SuccessStoryItem> {
    return apiRequest<SuccessStoryItem>('/admin-panel/success-stories/', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  // Public & Admin Feedback
  async submitFeedback(data: {
    rating: number;
    category: string;
    feedback_text: string;
    suggestions?: string;
    turnstile_token?: string;
  }): Promise<FeedbackItem> {
    return apiRequest<FeedbackItem>('/admin-panel/public-feedback/', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: false, // can be submitted anonymously or with token
    });
  },
};
