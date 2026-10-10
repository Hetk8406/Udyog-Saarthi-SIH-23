from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core import mail
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Role
from .permissions import IsCandidate, IsGuardian, IsJobCoach, IsAdminRole


class MockRequest:
    """Helper mock request for testing DRF permission classes directly."""
    def __init__(self, user):
        self.user = user


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate_user = User.objects.create_user(
            email='candidate@example.com',
            full_name='Test Candidate',
            password='TestPassword123!',
            role=Role.CANDIDATE,
        )
        self.coach_user = User.objects.create_user(
            email='coach@example.com',
            full_name='Test Coach',
            password='CoachPassword123!',
            role=Role.COACH,
        )

    def test_registration_candidate_success(self):
        """Candidates can register with valid details."""
        data = {
            'email': 'newcandidate@example.com',
            'full_name': 'New Candidate',
            'phone': '9876543210',
            'role': Role.CANDIDATE,
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'terms_accepted': True,
        }
        response = self.client.post(reverse('auth-register'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='newcandidate@example.com')
        self.assertIsNotNone(user.terms_accepted_at)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertTrue(response.cookies['access_token']['httponly'])
        self.assertTrue(response.cookies['refresh_token']['httponly'])

    def test_registration_terms_accepted_missing_fails(self):
        """Registration fails if terms_accepted is missing."""
        data = {
            'email': 'noterms@example.com',
            'full_name': 'No Terms User',
            'role': Role.CANDIDATE,
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
        }
        response = self.client.post(reverse('auth-register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('terms_accepted', response.data)
        self.assertFalse(User.objects.filter(email='noterms@example.com').exists())

    def test_registration_terms_accepted_false_fails(self):
        """Registration fails if terms_accepted is explicitly False."""
        data = {
            'email': 'refusedterms@example.com',
            'full_name': 'Refused Terms User',
            'role': Role.CANDIDATE,
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'terms_accepted': False,
        }
        response = self.client.post(reverse('auth-register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('terms_accepted', response.data)
        self.assertFalse(User.objects.filter(email='refusedterms@example.com').exists())

    def test_registration_disallows_privileged_roles(self):
        """Public registration cannot select Admin or Coach role directly."""
        data = {
            'email': 'badactor@example.com',
            'full_name': 'Bad Actor',
            'role': Role.ADMIN,
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'terms_accepted': True,
        }
        response = self.client.post(reverse('auth-register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='badactor@example.com').exists())

    def test_registration_password_mismatch(self):
        """Registration fails if passwords do not match."""
        data = {
            'email': 'mismatch@example.com',
            'full_name': 'Mismatch User',
            'role': Role.CANDIDATE,
            'password': 'Password123!',
            'password_confirm': 'DifferentPassword456!',
            'terms_accepted': True,
        }
        response = self.client.post(reverse('auth-register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_email(self):
        """Cannot register with an existing email address."""
        data = {
            'email': 'candidate@example.com',
            'full_name': 'Duplicate User',
            'role': Role.CANDIDATE,
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'terms_accepted': True,
        }
        response = self.client.post(reverse('auth-register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        """User can login and receive JWT tokens in HttpOnly cookies."""
        data = {
            'email': 'candidate@example.com',
            'password': 'TestPassword123!',
        }
        response = self.client.post(reverse('auth-login'), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertTrue(response.cookies['access_token']['httponly'])
        self.assertTrue(response.cookies['refresh_token']['httponly'])
        self.assertEqual(response.data['user']['email'], 'candidate@example.com')

    def test_login_invalid_credentials(self):
        """Login fails with invalid password."""
        data = {
            'email': 'candidate@example.com',
            'password': 'WrongPassword!',
        }
        response = self.client.post(reverse('auth-login'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_endpoint_authenticated(self):
        """Authenticated user can fetch their profile."""
        self.client.force_authenticate(user=self.candidate_user)
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'candidate@example.com')
        self.assertEqual(response.data['role'], Role.CANDIDATE)

    def test_me_endpoint_unauthenticated(self):
        """Unauthenticated requests to /me/ are denied."""
        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_password_reset_request_and_confirm(self):
        """Password reset request sends email and confirmation changes password."""
        # 1. Request reset
        response = self.client.post(reverse('auth-reset-request' if 'auth-reset-request' in [u.name for u in []] else 'password-reset-request'), {
            'email': 'candidate@example.com',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Password Reset Request", mail.outbox[0].subject)

        # 2. Confirm reset
        token = default_token_generator.make_token(self.candidate_user)
        uid = urlsafe_base64_encode(force_bytes(self.candidate_user.pk))
        confirm_response = self.client.post(reverse('password-reset-confirm'), {
            'uid': uid,
            'token': token,
            'new_password': 'BrandNewPassword123!',
            'new_password_confirm': 'BrandNewPassword123!',
        })
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)

        # Verify old password no longer works and new password works
        self.candidate_user.refresh_from_db()
        self.assertFalse(self.candidate_user.check_password('TestPassword123!'))
        self.assertTrue(self.candidate_user.check_password('BrandNewPassword123!'))


class RolePermissionTests(TestCase):
    def setUp(self):
        self.candidate = User.objects.create_user(
            email='c@example.com', full_name='C', password='p', role=Role.CANDIDATE
        )
        self.guardian = User.objects.create_user(
            email='g@example.com', full_name='G', password='p', role=Role.GUARDIAN
        )
        self.coach = User.objects.create_user(
            email='coach@example.com', full_name='Coach', password='p', role=Role.COACH
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin', password='p', role=Role.ADMIN
        )

    def test_permission_classes(self):
        # IsCandidate
        self.assertTrue(IsCandidate().has_permission(MockRequest(self.candidate), None))
        self.assertFalse(IsCandidate().has_permission(MockRequest(self.coach), None))

        # IsGuardian
        self.assertTrue(IsGuardian().has_permission(MockRequest(self.guardian), None))
        self.assertFalse(IsGuardian().has_permission(MockRequest(self.candidate), None))

        # IsJobCoach
        self.assertTrue(IsJobCoach().has_permission(MockRequest(self.coach), None))
        self.assertFalse(IsJobCoach().has_permission(MockRequest(self.candidate), None))

        # IsAdminRole
        self.assertTrue(IsAdminRole().has_permission(MockRequest(self.admin), None))
        self.assertFalse(IsAdminRole().has_permission(MockRequest(self.coach), None))


class DemoAccountAndSeedGuardTests(TestCase):
    """Verifies that demo accounts cannot be created or log in when DEBUG is False,
    and that seed commands refuse to run when DEBUG is False or ALLOW_DEMO_SEED != 'True'."""

    def setUp(self):
        self.client = APIClient()

    def test_demo_account_cannot_be_created_via_manager_when_debug_false(self):
        """User.objects.create_user raises ValueError for demo accounts when DEBUG=False."""
        with self.settings(DEBUG=False):
            with self.assertRaises(ValueError) as ctx:
                User.objects.create_user(
                    email='admin@demo.com',
                    full_name='Demo Admin',
                    password='Password123!',
                    role=Role.ADMIN,
                )
            self.assertIn("Demo accounts", str(ctx.exception))

    def test_demo_account_cannot_register_via_api_when_debug_false(self):
        """API registration rejects demo accounts when DEBUG=False."""
        with self.settings(DEBUG=False):
            data = {
                'email': 'candidate@demo.com',
                'full_name': 'Candidate Demo',
                'role': Role.CANDIDATE,
                'password': 'StrongPassword123!',
                'password_confirm': 'StrongPassword123!',
                'terms_accepted': True,
            }
            response = self.client.post(reverse('auth-register'), data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('email', response.data)

    def test_demo_account_cannot_login_when_debug_false(self):
        """Demo accounts cannot log in when DEBUG is False."""
        # Create user while DEBUG=True
        with self.settings(DEBUG=True):
            user = User.objects.create_user(
                email='candidate@demo.com',
                full_name='Demo Candidate',
                password='Password123!',
                role=Role.CANDIDATE,
            )

        # Attempt login while DEBUG=False
        with self.settings(DEBUG=False):
            response = self.client.post(reverse('auth-login'), {
                'email': 'candidate@demo.com',
                'password': 'Password123!',
            })
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('Demo accounts cannot log in', str(response.data))

    def test_seed_command_refuses_when_debug_false(self):
        """seed_demo_users raises CommandError when DEBUG is False."""
        from django.core.management import call_command
        from django.core.management.base import CommandError

        with self.settings(DEBUG=False):
            with self.assertRaises(CommandError) as ctx:
                call_command('seed_demo_users')
            self.assertIn("blocked", str(ctx.exception))

    def test_seed_command_refuses_when_allow_demo_seed_not_true(self):
        """seed_demo_users raises CommandError when ALLOW_DEMO_SEED is not True."""
        from django.core.management import call_command
        from django.core.management.base import CommandError
        import os

        old_env = os.environ.get('ALLOW_DEMO_SEED')
        try:
            os.environ['ALLOW_DEMO_SEED'] = 'False'
            with self.settings(DEBUG=True):
                with self.assertRaises(CommandError) as ctx:
                    call_command('seed_demo_users')
                self.assertIn("blocked", str(ctx.exception))
        finally:
            if old_env is not None:
                os.environ['ALLOW_DEMO_SEED'] = old_env
            else:
                os.environ.pop('ALLOW_DEMO_SEED', None)


class CookieAuthenticationAndCsrfTests(TestCase):
    """Verifies cookie-based JWT authentication, CSRF enforcement, token rotation and blacklisting."""

    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.user = User.objects.create_user(
            email='cookieuser@example.com',
            full_name='Cookie User',
            password='Password123!',
            role=Role.CANDIDATE,
        )

    def test_csrf_token_endpoint(self):
        """GET /api/auth/csrf/ returns a CSRF token and sets the csrftoken cookie."""
        response = self.client.get(reverse('auth-csrf'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csrfToken', response.data)
        self.assertTrue(len(response.data['csrfToken']) > 10)
        self.assertIn('csrftoken', response.cookies)

    def test_authenticated_read_via_access_cookie(self):
        """GET requests authenticate successfully using the access_token cookie."""
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        response = self.client.get(reverse('auth-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'cookieuser@example.com')

    def test_cookie_auth_state_changing_request_without_csrf_is_rejected(self):
        """POST request using access_token cookie without CSRF header is rejected with 403."""
        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        # POST without CSRF header
        response = self.client.post(
            reverse('profile-skill-list-create'),
            {'name': 'Python', 'category': 'technical', 'proficiency': 'intermediate'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('CSRF Failed', str(response.data))

    def test_cookie_auth_state_changing_request_with_csrf_succeeds(self):
        """POST request using access_token cookie succeeds when valid CSRF header and cookie are provided."""
        # 1. Fetch CSRF token
        csrf_res = self.client.get(reverse('auth-csrf'))
        csrf_token = csrf_res.data['csrfToken']

        refresh = RefreshToken.for_user(self.user)
        self.client.cookies['access_token'] = str(refresh.access_token)

        # 2. Make authenticated POST with matching CSRF token
        response = self.client.post(
            reverse('profile-skill-list-create'),
            {'name': 'Python', 'category': 'technical', 'proficiency': 'intermediate'},
            format='json',
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Python')

    def test_token_refresh_via_cookie_rotates_and_blacklists_old_token(self):
        """Refresh endpoint rotates tokens via cookie and blacklists the old refresh token."""
        refresh = RefreshToken.for_user(self.user)
        old_refresh_str = str(refresh)
        self.client.cookies['refresh_token'] = old_refresh_str

        # Initial refresh
        response = self.client.post(reverse('token-refresh'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)

        new_refresh_str = response.cookies['refresh_token'].value
        self.assertNotEqual(old_refresh_str, new_refresh_str)

        # Attempting to reuse old refresh token should be rejected (blacklisted)
        self.client.cookies['refresh_token'] = old_refresh_str
        failed_response = self.client.post(reverse('token-refresh'))
        self.assertEqual(failed_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_clears_cookies_and_blacklists_refresh_token(self):
        """Logout endpoint deletes cookies and blacklists the provided refresh token."""
        refresh = RefreshToken.for_user(self.user)
        refresh_str = str(refresh)
        self.client.cookies['refresh_token'] = refresh_str

        response = self.client.post(reverse('auth-logout'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Cookies should be expired / cleared
        self.assertEqual(response.cookies['access_token'].value, '')
        self.assertEqual(response.cookies['refresh_token'].value, '')

        # Attempting to refresh with the blacklisted token should fail
        self.client.cookies['refresh_token'] = refresh_str
        failed_response = self.client.post(reverse('token-refresh'))
        self.assertEqual(failed_response.status_code, status.HTTP_401_UNAUTHORIZED)

