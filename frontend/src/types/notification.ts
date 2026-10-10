export type NotificationTypeEnum =
  | 'application_status'
  | 'deadline_reminder'
  | 'exam_alert'
  | 'job_recommendation'
  | 'system';

export interface NotificationItem {
  id: string;
  notification_type: NotificationTypeEnum;
  notification_type_display: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  app_status_updates: boolean;
  deadline_alerts: boolean;
  exam_alerts: boolean;
  job_recommendations: boolean;
  channel_in_app: boolean;
  channel_email: boolean;
  channel_sms: boolean;
  updated_at: string;
}
