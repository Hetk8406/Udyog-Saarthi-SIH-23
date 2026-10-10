from unittest.mock import patch
from django.test import TestCase, Client, override_settings
from django.urls import reverse
from django.core import mail
import requests

from core.email import send_multipart_email_sync, send_async_email
from core.turnstile import verify_turnstile


class HealthCheckTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_health_check_returns_200_and_status_ok(self):
        """Health check returns 200 with minimal non-sensitive operational payload."""
        response = self.client.get(reverse('health-check'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('status'), 'ok')
        self.assertEqual(data.get('database'), 'ok')
        # Ensure zero sensitive variables are present
        self.assertNotIn('secret_key', data)
        self.assertNotIn('settings', data)
        self.assertNotIn('version', data)


class EmailServiceTests(TestCase):
    def test_send_multipart_email_sync_delivers_text_and_html(self):
        """send_multipart_email_sync creates and sends multipart email with plain text & HTML."""
        subject = "Account Verification"
        text_content = "Hello candidate, your verification code is 123456."
        html_content = "<h1>Hello candidate</h1><p>Your code is <strong>123456</strong>.</p>"
        recipient = "candidate@example.com"

        success = send_multipart_email_sync(
            subject=subject,
            plain_text=text_content,
            html_content=html_content,
            recipients=[recipient],
            reply_to=["support@udyogsaarthi.in"]
        )

        self.assertTrue(success)
        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]
        self.assertEqual(msg.subject, subject)
        self.assertEqual(msg.body, text_content)
        self.assertEqual(msg.to, [recipient])
        self.assertEqual(msg.reply_to, ["support@udyogsaarthi.in"])
        self.assertEqual(len(msg.alternatives), 1)
        self.assertEqual(msg.alternatives[0][0], html_content)
        self.assertEqual(msg.alternatives[0][1], "text/html")

    @patch('notifications.tasks.send_multipart_email_task.delay')
    def test_send_async_email_delegates_to_celery_task(self, mock_delay):
        """send_async_email queues task onto Celery worker."""
        res = send_async_email(
            subject="Status Update",
            plain_text="Your application has been received.",
            html_content="<p>Your application has been received.</p>",
            recipients=["test@example.com"],
            reply_to=["support@udyogsaarthi.in"]
        )
        self.assertTrue(res)
        mock_delay.assert_called_once_with(
            subject="Status Update",
            plain_text="Your application has been received.",
            html_content="<p>Your application has been received.</p>",
            recipients=["test@example.com"],
            reply_to=["support@udyogsaarthi.in"]
        )

    @patch('notifications.tasks.send_multipart_email_task.delay')
    def test_send_async_email_falls_back_to_sync_on_celery_failure(self, mock_delay):
        """If Celery broker is down/unreachable, fallback to synchronous delivery."""
        mock_delay.side_effect = Exception("Redis connection refused")

        success = send_async_email(
            subject="Urgent Notice",
            plain_text="Sync fallback test body.",
            html_content="<p>Sync fallback test body.</p>",
            recipients=["fallback@example.com"]
        )

        self.assertTrue(success)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["fallback@example.com"])


class TurnstileSecurityTests(TestCase):
    @override_settings(DEBUG=True, TESTING=False)
    def test_dev_mode_accepts_test_token(self):
        """In development mode, test bypass token is accepted without external network call."""
        res = verify_turnstile("1x00000000000000000000AA")
        self.assertTrue(res)

    @override_settings(DEBUG=True, TESTING=False)
    def test_dev_mode_rejects_empty_token(self):
        """Missing or empty token returns False."""
        self.assertFalse(verify_turnstile(None))
        self.assertFalse(verify_turnstile(""))

    @override_settings(DEBUG=False, TESTING=False)
    def test_prod_mode_fails_closed_on_test_secret_key(self):
        """In production, test secret key is forbidden and verification fails closed."""
        import os
        with patch.dict(os.environ, {"TURNSTILE_SECRET_KEY": "1x0000000000000000000000000000000AA"}):
            res = verify_turnstile("some_real_looking_token")
            self.assertFalse(res)

    @override_settings(DEBUG=False, TESTING=False)
    def test_prod_mode_fails_closed_on_test_token(self):
        """In production, test tokens (1x00...) are forbidden and verification fails closed."""
        import os
        with patch.dict(os.environ, {"TURNSTILE_SECRET_KEY": "0x4AAAAAA_REAL_PROD_KEY"}):
            res = verify_turnstile("1x00000000000000000000AA")
            self.assertFalse(res)

    @override_settings(DEBUG=False, TESTING=False)
    @patch('urllib.request.urlopen')
    def test_prod_mode_fails_closed_on_network_error(self, mock_urlopen):
        """If Cloudflare verification API is unreachable or times out, fail closed."""
        import os
        import urllib.error
        with patch.dict(os.environ, {"TURNSTILE_SECRET_KEY": "0x4AAAAAA_REAL_PROD_KEY"}):
            mock_urlopen.side_effect = urllib.error.URLError("Cloudflare unreachable")
            res = verify_turnstile("real_user_token_abc123")
            self.assertFalse(res)

    @override_settings(DEBUG=False, TESTING=False)
    @patch('urllib.request.urlopen')
    def test_prod_mode_succeeds_on_valid_cloudflare_response(self, mock_urlopen):
        """Valid response from Cloudflare returns True."""
        import os
        from unittest.mock import MagicMock
        with patch.dict(os.environ, {"TURNSTILE_SECRET_KEY": "0x4AAAAAA_REAL_PROD_KEY"}):
            mock_resp = MagicMock()
            mock_resp.read.return_value = b'{"success": true}'
            mock_resp.__enter__.return_value = mock_resp
            mock_urlopen.return_value = mock_resp

            res = verify_turnstile("valid_user_turnstile_token")
            self.assertTrue(res)
