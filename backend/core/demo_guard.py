import os
from django.conf import settings
from django.core.management.base import CommandError

DEMO_ACCOUNTS = {
    'admin@demo.com',
    'candidate@demo.com',
    'coach@demo.com',
    'guardian@demo.com',
}

def is_demo_account(email: str) -> bool:
    """Checks whether an email matches any predefined demo account (admin@demo.com, candidate@demo.com, etc.)."""
    if not email:
        return False
    normalized = email.strip().lower()
    return normalized in DEMO_ACCOUNTS

def check_demo_seed_allowed():
    """
    Ensures demo seed commands only execute in development environments.
    Refuses to run when DEBUG is False or when ALLOW_DEMO_SEED is not 'True'.
    """
    allow_seed = os.getenv('ALLOW_DEMO_SEED', '').strip().lower() == 'true'
    if not settings.DEBUG or not allow_seed:
        reasons = []
        if not settings.DEBUG:
            reasons.append("DEBUG is False (production mode active)")
        if not allow_seed:
            reasons.append('ALLOW_DEMO_SEED is not "True"')
        reason_msg = " and ".join(reasons)
        raise CommandError(
            f"Seeding demo data is blocked: {reason_msg}. "
            "Demo seeding is strictly forbidden in production environments to prevent test data leakage."
        )
