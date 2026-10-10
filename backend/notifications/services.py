from datetime import date, timedelta, datetime, timezone
from typing import Optional
from django.db.models import Q
from accounts.models import User
from .models import Notification, NotificationPreference, NotificationType
from .tasks import send_email_notification_task, send_sms_notification_task


def get_or_create_preferences(user: User) -> NotificationPreference:
    """
    Returns user's notification preferences, creating defaults if not already present.
    """
    prefs, _ = NotificationPreference.objects.get_or_create(user=user)
    return prefs


def is_type_enabled(prefs: NotificationPreference, notif_type: str) -> bool:
    """
    Checks if user has opted in to this specific type of notification.
    """
    if notif_type == NotificationType.APPLICATION_STATUS:
        return prefs.app_status_updates
    if notif_type == NotificationType.DEADLINE_REMINDER:
        return prefs.deadline_alerts
    if notif_type == NotificationType.EXAM_ALERT:
        return prefs.exam_alerts
    if notif_type == NotificationType.JOB_RECOMMENDATION:
        return prefs.job_recommendations
    return True  # System notices always enabled


def create_notification(
    user: User,
    notification_type: str,
    title: str,
    message: str,
    link: str = ""
) -> Optional[Notification]:
    """
    Dispatches a notification across user's preferred channels (In-App, Email, SMS).
    """
    prefs = get_or_create_preferences(user)

    # Check if user opted out of this category
    if not is_type_enabled(prefs, notification_type):
        return None

    created_notification = None

    # 1. In-App Channel
    if prefs.channel_in_app:
        created_notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link
        )

    # 2. Email Channel (via Celery task)
    if prefs.channel_email and user.email:
        email_subject = f"[Udyog Saarthi] {title}"
        email_body = f"Hello {user.full_name},\n\n{message}\n\nView details: {link or 'https://udyogsaarthi.in'}\n\nBest regards,\nUdyog Saarthi Team"
        send_email_notification_task.delay(email_subject, email_body, user.email)

    # 3. SMS Channel (via Celery task)
    if prefs.channel_sms and getattr(user, 'phone', None):
        sms_text = f"Udyog Saarthi Alert: {title} - {message}"
        send_sms_notification_task.delay(user.phone, sms_text)

    return created_notification


def mark_notification_as_read(notification_id: str, user: User) -> bool:
    """
    Marks a single notification as read for the user.
    """
    updated_count = Notification.objects.filter(id=notification_id, user=user).update(is_read=True)
    return updated_count > 0


def mark_all_notifications_as_read(user: User) -> int:
    """
    Marks all unread notifications as read for the user.
    """
    return Notification.objects.filter(user=user, is_read=False).update(is_read=True)


def get_unread_count(user: User) -> int:
    """
    Returns unread in-app notification count for the user.
    """
    return Notification.objects.filter(user=user, is_read=False).count()


def check_and_create_deadline_reminders() -> int:
    """
    Scans candidate applications and saved jobs for upcoming deadlines (<= 3 days)
    and scheduled exams (<= 7 days), creating reminders.
    """
    from applications.models import JobApplication

    today = date.today()
    three_days_later = today + timedelta(days=3)
    seven_days_later = today + timedelta(days=7)

    reminders_created = 0

    # 1. Check upcoming exam dates on active applications
    active_apps = JobApplication.objects.filter(
        job__exam_date__isnull=False,
        job__exam_date__gte=today,
        job__exam_date__lte=seven_days_later
    ).exclude(status__in=['rejected', 'withdrawn', 'expired', 'selected', 'placed'])

    for app in active_apps:
        candidate_user = app.candidate.user
        exam_date = app.job.exam_date
        days_left = (exam_date - today).days

        title = f"Exam Alert: {app.job.title}"
        msg = f"Your examination for {app.job.title} ({app.job.organization.name}) is in {days_left} day(s) on {exam_date}. Please ensure you have downloaded your admit card and verified your scribe/accommodations."
        link = f"/dashboard/applications"

        # Prevent duplicate reminder created in last 24h
        already_notified = Notification.objects.filter(
            user=candidate_user,
            notification_type=NotificationType.EXAM_ALERT,
            title=title,
            created_at__date=today
        ).exists()

        if not already_notified:
            create_notification(
                user=candidate_user,
                notification_type=NotificationType.EXAM_ALERT,
                title=title,
                message=msg,
                link=link
            )
            reminders_created += 1

    # 2. Check application deadlines for candidates who started applications or saved jobs
    deadline_apps = JobApplication.objects.filter(
        status='app_started',
        job__application_deadline__gte=today,
        job__application_deadline__lte=three_days_later
    )

    for app in deadline_apps:
        candidate_user = app.candidate.user
        deadline = app.job.application_deadline
        days_left = (deadline - today).days

        title = f"Deadline Approaching: {app.job.title}"
        msg = f"The official application deadline for {app.job.title} closes in {days_left} day(s) on {deadline}. Complete your submission before the portal closes."
        link = f"/jobs/{app.job.id}"

        already_notified = Notification.objects.filter(
            user=candidate_user,
            notification_type=NotificationType.DEADLINE_REMINDER,
            title=title,
            created_at__date=today
        ).exists()

        if not already_notified:
            create_notification(
                user=candidate_user,
                notification_type=NotificationType.DEADLINE_REMINDER,
                title=title,
                message=msg,
                link=link
            )
            reminders_created += 1

    return reminders_created
