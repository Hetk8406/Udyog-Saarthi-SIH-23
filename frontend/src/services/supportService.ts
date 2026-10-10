import { apiRequest } from './api';
import {
  SupportTicket,
  SupportMessage,
  CoachCandidate,
  CoachNote,
  CoachJobRecommendation,
  GuardianAccess
} from '@/types/support';

export const supportService = {
  // Support Tickets
  async getTickets(params?: { status?: string; category?: string }): Promise<SupportTicket[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();

    return apiRequest<SupportTicket[]>(`/support/tickets/${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async createTicket(data: {
    category: string;
    subject: string;
    description: string;
    candidate_id?: string;
    turnstile_token?: string;
  }): Promise<SupportTicket> {
    return apiRequest<SupportTicket>('/support/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  async getTicketDetail(id: string): Promise<SupportTicket> {
    return apiRequest<SupportTicket>(`/support/tickets/${id}/`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async updateTicketStatus(id: string, status: string): Promise<SupportTicket> {
    return apiRequest<SupportTicket>(`/support/tickets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      requiresAuth: true,
    });
  },

  async sendTicketMessage(ticketId: string, message: string): Promise<SupportMessage> {
    return apiRequest<SupportMessage>(`/support/tickets/${ticketId}/messages/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
      requiresAuth: true,
    });
  },

  // Job Coach APIs
  async getCoachCandidates(): Promise<CoachCandidate[]> {
    return apiRequest<CoachCandidate[]>('/support/coach/candidates/', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async getCoachCandidateDetail(candidateId: string): Promise<CoachCandidate> {
    return apiRequest<CoachCandidate>(`/support/coach/candidates/${candidateId}/`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async getCoachNotes(candidateId: string): Promise<CoachNote[]> {
    return apiRequest<CoachNote[]>(`/support/coach/candidates/${candidateId}/notes/`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async addCoachNote(candidateId: string, title: string, content: string): Promise<CoachNote> {
    return apiRequest<CoachNote>(`/support/coach/candidates/${candidateId}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
      requiresAuth: true,
    });
  },

  async recommendJob(candidateId: string, jobId: string, recommendationNote: string): Promise<CoachJobRecommendation> {
    return apiRequest<CoachJobRecommendation>(
      `/support/coach/candidates/${candidateId}/recommend-job/`,
      {
        method: 'POST',
        body: JSON.stringify({
          job_id: jobId,
          recommendation_note: recommendationNote,
        }),
        requiresAuth: true,
      }
    );
  },

  // Candidate view of Coach recommendations
  async getCandidateRecommendations(): Promise<CoachJobRecommendation[]> {
    return apiRequest<CoachJobRecommendation[]>('/support/recommendations/', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  // Guardian Access APIs
  async getGuardianAccessList(): Promise<GuardianAccess[]> {
    return apiRequest<GuardianAccess[]>('/support/guardian/access/', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async grantGuardianAccess(data: {
    guardian_email: string;
    relationship: string;
    allow_view_profile?: boolean;
    allow_view_applications?: boolean;
    allow_view_support_tickets?: boolean;
    allow_view_learning_progress?: boolean;
  }): Promise<GuardianAccess> {
    return apiRequest<GuardianAccess>('/support/guardian/access/', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  async getGuardianCandidateProfile(candidateId: string): Promise<any> {
    return apiRequest<any>(`/support/guardian/candidates/${candidateId}/profile/`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
};
