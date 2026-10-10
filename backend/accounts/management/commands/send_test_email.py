from django.core.management.base import BaseCommand, CommandError
from core.email import send_async_email, send_multipart_email_sync


class Command(BaseCommand):
    help = "Sends a verification test email (plain text + HTML) to test SMTP/API and Celery connectivity."

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Target email address to receive test message.')
        parser.add_argument(
            '--sync',
            action='store_true',
            help='Send synchronously directly through EMAIL_BACKEND without queuing to Celery.',
        )

    def handle(self, *args, **options):
        recipient = options['email'].strip()
        if not recipient or '@' not in recipient:
            raise CommandError("Please provide a valid recipient email address.")

        subject = "Udyog Saarthi - Email Service Connectivity Test"
        plain_text = (
            f"Hello,\n\n"
            f"This is a confirmation test email from Udyog Saarthi.\n"
            f"If you received this message, your email dispatch configuration is operational!\n\n"
            f"Sent to: {recipient}\n"
            f"Warm regards,\n"
            f"The Udyog Saarthi Engineering Team"
        )
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Udyog Saarthi Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
    <tr>
      <td style="background-color: #16a34a; padding: 16px; border-radius: 8px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0;">Email Delivery Verified &check;</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 8px;">
        <p style="font-size: 16px;">Hello,</p>
        <p>This is a verification test email sent from <strong>Udyog Saarthi</strong>.</p>
        <p style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px;">
          Recipient: {recipient}<br>
          Status: Operational
        </p>
        <p style="color: #64748b; font-size: 13px;">If you see this, your transactional email service is configured correctly.</p>
      </td>
    </tr>
  </table>
</body>
</html>"""

        is_sync = options.get('sync', False)
        self.stdout.write(f"Dispatching test email to '{recipient}' (mode: {'sync' if is_sync else 'async Celery'})...")

        if is_sync:
            success = send_multipart_email_sync(
                subject=subject,
                plain_text=plain_text,
                html_content=html_content,
                recipients=[recipient],
            )
        else:
            success = send_async_email(
                subject=subject,
                plain_text=plain_text,
                html_content=html_content,
                recipients=[recipient],
            )

        if success:
            self.stdout.write(self.style.SUCCESS(f"Successfully dispatched test email to '{recipient}'!"))
        else:
            raise CommandError(f"Failed to dispatch test email to '{recipient}'. Check your logs and email settings.")
