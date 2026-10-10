import uuid
from django.db import models
from accounts.models import User


class NotificationType(models.TextChoices):
    APPLICATION_STATUS = 'application_status', 'Application Status Update'
    DEADLINE_REMINDER = 'deadline_reminder', 'Deadline Reminder'
    EXAM_ALERT = 'exam_alert', 'Examination & Admit Card Alert'
    JOB_RECOMMENDATION = 'job_recommendation', 'Job Recommendation'
    SYSTEM = 'system', 'System & Support Notice'


class Notification(models.Model):
    """
    In-app notification record displayed to a candidate, guardian, coach, or admin.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=40,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM
    )
    title = models.CharField(max_length=255)
    message = models.TextField(help_text='Clear plain-language notification text')
    link = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Optional in-app destination URL e.g. /dashboard/applications'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        read_badge = "Read" if self.is_read else "Unread"
        return f"[{read_badge}] {self.user.email} - {self.title}"


class NotificationPreference(models.Model):
    """
    User settings governing which notification types and delivery channels they receive.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preference'
    )
    # Types
    app_status_updates = models.BooleanField(
        default=True,
        help_text='Receive alerts when application moves to Admit Card, Exam, Interview, or Placed'
    )
    deadline_alerts = models.BooleanField(
        default=True,
        help_text='Receive countdown alerts 3 days and 24 hours before saved vacancy deadlines'
    )
    exam_alerts = models.BooleanField(
        default=True,
        help_text='Receive alerts for upcoming exam dates and scribe confirmations'
    )
    job_recommendations = models.BooleanField(
        default=True,
        help_text='Receive alerts when new jobs matching your disability reservation are published'
    )

    # Channels
    channel_in_app = models.BooleanField(
        default=True,
        help_text='Deliver in-app notification center alerts'
    )
    channel_email = models.BooleanField(
        default=True,
        help_text='Send notifications via registered email'
    )
    channel_sms = models.BooleanField(
        default=False,
        help_text='Send urgent notifications via registered mobile phone SMS'
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.email}"
