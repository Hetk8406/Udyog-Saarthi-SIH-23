import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .sms_service import get_sms_provider

logger = logging.getLogger(__name__)


@shared_task(name='notifications.send_multipart_email')
def send_multipart_email_task(
    subject: str,
    plain_text: str,
    html_content: str,
    recipients: list,
    reply_to: list = None,
) -> bool:
    """
    Celery task that sends a multipart email (plain text + accessible HTML) asynchronously.
    """
    try:
        from core.email import send_multipart_email_sync
        return send_multipart_email_sync(
            subject=subject,
            plain_text=plain_text,
            html_content=html_content,
            recipients=recipients,
            reply_to=reply_to,
        )
    except Exception as exc:
        logger.error(f"[Celery Multipart Email Failed] {recipients}: {exc}")
        return False


@shared_task(name='notifications.send_email_notification')
def send_email_notification_task(subject: str, message: str, recipient_email: str) -> bool:
    """
    Celery task that sends an email notification asynchronously.
    Uses Django's configured EMAIL_BACKEND (Console backend in dev).
    """
    try:
        from core.email import send_multipart_email_sync
        return send_multipart_email_sync(
            subject=subject,
            plain_text=message,
            html_content="",
            recipients=[recipient_email],
        )
    except Exception as exc:
        logger.error(f"[Celery Email Failed] {recipient_email}: {exc}")
        return False


@shared_task(name='notifications.send_sms_notification')
def send_sms_notification_task(phone: str, message: str) -> bool:
    """
    Celery task that sends an SMS notification asynchronously.
    """
    try:
        provider = get_sms_provider()
        success = provider.send_sms(phone, message)
        logger.info(f"[Celery SMS] Dispatched to {phone}")
        return success
    except Exception as exc:
        logger.error(f"[Celery SMS Failed] {phone}: {exc}")
        return False


@shared_task(name='notifications.process_deadline_reminders')
def process_deadline_reminders_task() -> int:
    """
    Celery periodic task to check upcoming job application deadlines
    and candidate examination dates, generating reminder notifications.
    """
    from .services import check_and_create_deadline_reminders
    reminders_created = check_and_create_deadline_reminders()
    logger.info(f"[Celery Deadline Check] Created {reminders_created} reminders.")
    return reminders_created
