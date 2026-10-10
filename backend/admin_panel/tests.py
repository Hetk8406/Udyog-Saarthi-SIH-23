from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Role
from profiles.models import CandidateProfile
from jobs.models import Organization, Job
from learning.models import MockTest
from support.models import SupportTicket, SuccessStory, Feedback
from admin_panel.models import AdminAuditLog

User = get_user_model()


class AdminPanelPermissionsTest(TestCase):
    """
    Unit test ensuring strict protection of administrative APIs:
    'Add tests that non-admins get 403 on every admin API.'
    """

    ADMIN_ENDPOINTS = [
        ('/api/admin-panel/stats/', 'get'),
        ('/api/admin-panel/users/', 'get'),
        ('/api/admin-panel/candidates/', 'get'),
        ('/api/admin-panel/coaches/', 'get'),
        ('/api/admin-panel/organizations/', 'get'),
        ('/api/admin-panel/jobs/', 'get'),
        ('/api/admin-panel/courses/', 'get'),
        ('/api/admin-panel/resources/', 'get'),
        ('/api/admin-panel/mock-tests/', 'get'),
        ('/api/admin-panel/questions/', 'get'),
        ('/api/admin-panel/tickets/', 'get'),
        ('/api/admin-panel/audit-logs/', 'get'),
        ('/api/admin-panel/success-stories/', 'get'),
        ('/api/admin-panel/feedback/', 'get'),
    ]

    def setUp(self):
        self.client = APIClient()

        # 1. Candidate User
        self.candidate_user = User.objects.create_user(
            email='candidate_test@demo.com',
            full_name='Test Candidate',
            password='Password123!',
            role=Role.CANDIDATE
        )

        # 2. Guardian User
        self.guardian_user = User.objects.create_user(
            email='guardian_test@demo.com',
            full_name='Test Guardian',
            password='Password123!',
            role=Role.GUARDIAN
        )

        # 3. Coach User
        self.coach_user = User.objects.create_user(
            email='coach_test@demo.com',
            full_name='Test Coach',
            password='Password123!',
            role=Role.COACH
        )

        # 4. Admin User
        self.admin_user = User.objects.create_user(
            email='admin_test@demo.com',
            full_name='Platform Administrator',
            password='Password123!',
            role=Role.ADMIN,
            is_staff=True
        )

    def test_anonymous_user_denied_on_admin_apis(self):
        """Unauthenticated requests must be rejected with 401 or 403."""
        for endpoint, method in self.ADMIN_ENDPOINTS:
            res = getattr(self.client, method)(endpoint)
            self.assertIn(
                res.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"Expected 401/403 for anonymous on {endpoint}, got {res.status_code}"
            )

    def test_candidate_gets_403_on_every_admin_api(self):
        """Candidates must receive 403 Forbidden on all administrative APIs."""
        self.client.force_authenticate(user=self.candidate_user)
        for endpoint, method in self.ADMIN_ENDPOINTS:
            res = getattr(self.client, method)(endpoint)
            self.assertEqual(
                res.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Candidate should get 403 Forbidden on {endpoint}, but got {res.status_code}"
            )

    def test_guardian_gets_403_on_every_admin_api(self):
        """Parents / Guardians must receive 403 Forbidden on all administrative APIs."""
        self.client.force_authenticate(user=self.guardian_user)
        for endpoint, method in self.ADMIN_ENDPOINTS:
            res = getattr(self.client, method)(endpoint)
            self.assertEqual(
                res.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Guardian should get 403 Forbidden on {endpoint}, but got {res.status_code}"
            )

    def test_coach_gets_403_on_every_admin_api(self):
        """Job Coaches must receive 403 Forbidden on all administrative APIs."""
        self.client.force_authenticate(user=self.coach_user)
        for endpoint, method in self.ADMIN_ENDPOINTS:
            res = getattr(self.client, method)(endpoint)
            self.assertEqual(
                res.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Coach should get 403 Forbidden on {endpoint}, but got {res.status_code}"
            )

    def test_admin_has_full_access_and_generates_audit_logs(self):
        """Administrator can access stats and mutating actions log into AdminAuditLog."""
        self.client.force_authenticate(user=self.admin_user)

        # 1. Stats view returns 200 OK
        stats_res = self.client.get('/api/admin-panel/stats/')
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertIn('users_total', stats_res.data)
        self.assertIn('placements_total', stats_res.data)

        # 2. Creating an organization logs audit event
        org_res = self.client.post('/api/admin-panel/organizations/', {
            'name': 'Ministry of Social Justice Test',
            'org_type': 'government_dept',
            'website': 'https://socialjustice.gov.in',
            'description': 'Central government ministry'
        })
        self.assertEqual(org_res.status_code, status.HTTP_201_CREATED)

        # Verify audit log record
        log = AdminAuditLog.objects.filter(target_entity='Organization', action_type='CREATE').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.admin_user, self.admin_user)
        self.assertIn('Ministry of Social Justice Test', log.details)
