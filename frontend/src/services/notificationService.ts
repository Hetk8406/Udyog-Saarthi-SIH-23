import { apiRequest } from './api';
import { NotificationItem, NotificationPreference } from '@/types/notification';

export async function getNotifications(unreadOnly: boolean = false): Promise<NotificationItem[]> {
  const query = unreadOnly ? '?unread=true' : '';
  return apiRequest<NotificationItem[]>(`/notifications/${query}`, {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function getUnreadCount(): Promise<{ unread_count: number }> {
  return apiRequest<{ unread_count: number }>('/notifications/unread-count/', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function markNotificationRead(id: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`/notifications/${id}/read/`, {
    method: 'PATCH',
    requiresAuth: true,
  });
}

export async function markAllNotificationsRead(): Promise<{ marked_count: number }> {
  return apiRequest<{ marked_count: number }>('/notifications/mark-all-read/', {
    method: 'POST',
    requiresAuth: true,
  });
}

export async function getNotificationPreferences(): Promise<NotificationPreference> {
  return apiRequest<NotificationPreference>('/notifications/preferences/', {
    method: 'GET',
    requiresAuth: true,
  });
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  return apiRequest<NotificationPreference>('/notifications/preferences/', {
    method: 'PUT',
    body: JSON.stringify(prefs),
    requiresAuth: true,
  });
}
