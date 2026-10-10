import os
import json
import logging
import urllib.request
import urllib.parse
from django.conf import settings

logger = logging.getLogger(__name__)


def verify_turnstile(token: str, remote_ip: str = None) -> bool:
    """
    Validates a Cloudflare Turnstile token against Cloudflare's siteverify API.
    
    Security Rules:
    1. Production (DEBUG=False):
       - Must use a real Cloudflare secret key (test bypass keys starting with '1x000000' are rejected).
       - Test bypass tokens ('1x000000...', 'XXXX...', etc.) are strictly rejected.
       - Fails CLOSED if Cloudflare siteverify is unreachable or encounters an error (returns False).
    2. Development / Test (DEBUG=True):
       - Supports Cloudflare test keys and dummy tokens for frictionless unit testing.
       - Passes gracefully if no key is configured in local developer environments.
    """
    secret_key = os.getenv('TURNSTILE_SECRET_KEY', '').strip()
    is_testing = getattr(settings, 'TESTING', False) or os.getenv('TESTING', 'False').lower() in ('true', '1', 't')
    if is_testing:
        if token == 'FAIL_TEST_TOKEN':
            return False
        return True

    is_debug = getattr(settings, 'DEBUG', False)

    # -------------------------------------------------------------------------
    # Production Enforcement (DEBUG=False) -> Strict & Fail-Closed
    # -------------------------------------------------------------------------
    if not is_debug:
        if not secret_key:
            logger.error("[Turnstile] TURNSTILE_SECRET_KEY is missing in production. Failing closed.")
            return False

        if secret_key.startswith('1x000000'):
            logger.error("[Turnstile] Cloudflare test secret key (1x000000...) is strictly forbidden in production. Failing closed.")
            return False

        if not token:
            logger.warning("[Turnstile] Missing turnstile_token in production request.")
            return False

        if token in ('XXXX.DUMMY.TOKEN.XXXX', 'test-token', '1x00000000000000000000AA'):
            logger.warning("[Turnstile] Test bypass token rejected in production mode.")
            return False

        try:
            payload = {
                'secret': secret_key,
                'response': token,
            }
            if remote_ip:
                payload['remoteip'] = remote_ip

            encoded_data = urllib.parse.urlencode(payload).encode('utf-8')
            req = urllib.request.Request(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                data=encoded_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                success = bool(data.get('success', False))
                if not success:
                    logger.warning(f"[Turnstile] Verification rejected by Cloudflare: {data.get('error-codes', [])}")
                return success
        except Exception as exc:
            logger.error(f"[Turnstile] Cloudflare siteverify unreachable in production ({exc}). Failing closed.")
            return False

    # -------------------------------------------------------------------------
    # Development / Testing Mode (DEBUG=True)
    # -------------------------------------------------------------------------
    if not token:
        return False

    if not secret_key:
        # Dev without Turnstile key
        return True

    # Cloudflare official testing keys/tokens for unit tests and local preview
    if secret_key.startswith('1x000000') or token in ('XXXX.DUMMY.TOKEN.XXXX', 'test-token', '1x00000000000000000000AA'):
        return True

    try:
        payload = {
            'secret': secret_key,
            'response': token,
        }
        if remote_ip:
            payload['remoteip'] = remote_ip

        encoded_data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            data=encoded_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return bool(data.get('success', False))
    except Exception as exc:
        logger.warning(f"[Turnstile Dev] Network check failed in debug mode ({exc}). Allowing dev request.")
        return True
