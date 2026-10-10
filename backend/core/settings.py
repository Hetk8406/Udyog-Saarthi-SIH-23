"""
Django settings for Udyog Saarthi core project.
"""

import os
import sys
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

from django.core.exceptions import ImproperlyConfigured

# Detect if running under Django test runner or E2E test mode
TESTING = 'test' in sys.argv or os.getenv('TESTING', 'False').lower() in ('true', '1', 't')

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR / '.env')

# Security settings
# SECRET_KEY must be provided via environment variable (no fallback default allowed)
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY environment variable is required and must not be empty.")

# DEBUG is False by default in production; explicitly set DEBUG=True only in local dev
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')

# ALLOWED_HOSTS loaded from environment
raw_allowed_hosts = os.getenv('ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]

# Include testserver and local fallbacks for development / test runner
if 'testserver' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('testserver')
if DEBUG and not [h for h in ALLOWED_HOSTS if h != 'testserver']:
    ALLOWED_HOSTS.extend(['localhost', '127.0.0.1'])

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party packages
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',

    # Local domain apps
    'accounts',
    'profiles',
    'jobs',
    'applications',
    'learning',
    'notifications',
    'support',
    'admin_panel',
    'ai_assistant',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Needs to be at top for CORS headers
    'django.middleware.security.SecurityMiddleware',
    'core.middleware.SecurityHeadersMiddleware',  # Attaches CSP, Permissions-Policy, Referrer-Policy
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database Configuration (PostgreSQL with fallback option)
use_sqlite = os.getenv('USE_SQLITE', 'False') == 'True'

if use_sqlite:
    sqlite_filename = os.getenv('SQLITE_DB_NAME', 'db.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / sqlite_filename,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'udyog_saarthi'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'OPTIONS': {
                'sslmode': os.getenv('DB_SSLMODE', 'prefer' if DEBUG else 'require'),
            },
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password Hashing: Argon2 (OWASP recommended primary) + BCrypt + PBKDF2
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.authentication.CookieJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/minute',
        'user': '600/minute',
        'auth': '15/minute',
        'contact': '20/minute',
        'ai': '20/minute',
        'uploads': '30/minute',
    },
}

if os.getenv('TESTING', 'False').lower() in ('true', '1', 't'):
    REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
    REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
        'anon': '10000/minute',
        'user': '10000/minute',
        'auth': '10000/minute',
        'contact': '10000/minute',
        'ai': '10000/minute',
        'uploads': '10000/minute',
    }

# Private Document Storage Configuration (S3 / Cloudflare R2 vs Private Local Disk)
USE_S3_STORAGE = os.getenv('USE_S3_STORAGE', 'False').lower() in ('true', '1', 't')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', '')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'ap-south-1')
AWS_S3_ENDPOINT_URL = os.getenv('AWS_S3_ENDPOINT_URL', None)
PRIVATE_STORAGE_ROOT = BASE_DIR / 'private_storage'

# Upload Security Limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024   # 5 MB

# Cookie & Session Security Flags
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Allows standard client-side CSRF fetch so Next.js can send X-CSRFToken
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# JWT HttpOnly Cookie Configuration
AUTH_COOKIE_ACCESS_NAME = os.getenv('AUTH_COOKIE_ACCESS_NAME', 'access_token')
AUTH_COOKIE_REFRESH_NAME = os.getenv('AUTH_COOKIE_REFRESH_NAME', 'refresh_token')
AUTH_COOKIE_DOMAIN = os.getenv('COOKIE_DOMAIN', None)
AUTH_COOKIE_SECURE = os.getenv('COOKIE_SECURE', str(not DEBUG)).lower() in ('true', '1', 't')
AUTH_COOKIE_SAMESITE = os.getenv('COOKIE_SAMESITE', 'Lax')
AUTH_COOKIE_PATH = '/'
AUTH_COOKIE_REFRESH_PATH = '/api/auth/'

# HTTPS / SSL & Reverse Proxy Security (Production Enforcement)
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 't')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))  # 1 year HSTS
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    # Honor reverse proxy headers (e.g. Nginx, Caddy, Cloudflare, AWS ALB)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Frontend Base URL (for email links, password reset, etc.)
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')


# Simple JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Configuration (Strict Allowed Origins, Explicit Methods & Headers)
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# CSRF Trusted Origins for cross-origin cookie auth
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', ','.join(CORS_ALLOWED_ORIGINS)).split(',')
    if origin.strip()
]
CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Email Configuration (Console backend for local dev; SMTP / Resend / SES in production)
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.resend.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False').lower() in ('true', '1', 't')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_FROM = os.getenv('EMAIL_FROM', 'Udyog Saarthi <noreply@udyogsaarthi.in>')
DEFAULT_FROM_EMAIL = EMAIL_FROM
SERVER_EMAIL = EMAIL_FROM
EMAIL_REPLY_TO = os.getenv('EMAIL_REPLY_TO', 'support@udyogsaarthi.in')

# Celery Configuration
# Redis is the message broker and result backend
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://127.0.0.1:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'

# When True, Celery tasks execute immediately in-process (synchronously).
# This provides zero-friction development when Redis is not running.
# In production, set CELERY_ALWAYS_EAGER=False to use worker processes.
CELERY_TASK_ALWAYS_EAGER = os.getenv('CELERY_ALWAYS_EAGER', 'True') == 'True'

# Sentry Error Monitoring with Strict PII Scrubbing
SENTRY_DSN = os.getenv('SENTRY_DSN', '')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration

    def scrub_sensitive_sentry_data(event, hint):
        """Scrub personal, disability, and credential data from error reports."""
        if 'request' in event:
            req = event['request']
            if 'data' in req:
                req['data'] = '[SCRUBBED]'
            if 'headers' in req:
                for h in ['Cookie', 'cookie', 'Authorization', 'authorization', 'X-CSRFToken', 'x-csrftoken']:
                    if h in req['headers']:
                        req['headers'][h] = '[SCRUBBED]'
        if 'user' in event:
            user = event['user']
            user.pop('email', None)
            user.pop('username', None)
            user.pop('ip_address', None)
        return event

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        send_default_pii=False,
        before_send=scrub_sensitive_sentry_data,
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
        environment=os.getenv('ENVIRONMENT', 'production' if not DEBUG else 'development'),
    )
