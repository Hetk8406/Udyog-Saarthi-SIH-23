import logging
from typing import List, Optional
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def send_async_email(
    subject: str,
    plain_text: str,
    html_content: str,
    recipients: List[str],
    reply_to: Optional[List[str]] = None,
) -> bool:
    """
    Dispatches an email asynchronously via Celery worker so slow SMTP/API providers
    never block web worker threads or HTTP responses.
    If Celery is configured in eager mode (e.g. testing or dev), runs synchronously.
    """
    if not recipients:
        return False

    default_reply_to = getattr(settings, 'EMAIL_REPLY_TO', 'support@udyogsaarthi.in')
    effective_reply_to = reply_to or [default_reply_to]

    from notifications.tasks import send_multipart_email_task
    try:
        send_multipart_email_task.delay(
            subject=subject,
            plain_text=plain_text,
            html_content=html_content,
            recipients=recipients,
            reply_to=effective_reply_to,
        )
        return True
    except Exception as exc:
        logger.warning(f"Failed to queue email via Celery ({exc}). Falling back to synchronous dispatch.")
        return send_multipart_email_sync(
            subject=subject,
            plain_text=plain_text,
            html_content=html_content,
            recipients=recipients,
            reply_to=effective_reply_to,
        )


def send_multipart_email_sync(
    subject: str,
    plain_text: str,
    html_content: str,
    recipients: List[str],
    reply_to: Optional[List[str]] = None,
) -> bool:
    """
    Sends an email with both plain-text and HTML versions synchronously.
    Used by Celery workers or fallback execution.
    """
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Udyog Saarthi <noreply@udyogsaarthi.in>')
    default_reply_to = getattr(settings, 'EMAIL_REPLY_TO', 'support@udyogsaarthi.in')
    effective_reply_to = reply_to or [default_reply_to]

    email = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=from_email,
        to=recipients,
        reply_to=effective_reply_to,
    )
    if html_content:
        email.attach_alternative(html_content, "text/html")

    email.send(fail_silently=False)
    logger.info(f"[Email Delivered] To: {recipients} | Subject: {subject}")
    return True
