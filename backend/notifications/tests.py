from datetime import date, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User, Role
from profiles.models import CandidateProfile
from jobs.models import Organization, Job, SectorType, WorkMode, EducationLevel
from applications.models import JobApplication, ApplicationType, ApplicationStatus
from .models import Notification, NotificationPreference, NotificationType
from .services import (
    create_notification,
    get_or_create_preferences,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    get_unread_count,
    check_and_create_deadline_reminders
)
from .sms_service import FakeConsoleSMSProvider


class NotificationSystemTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Candidate User
        self.user = User.objects.create_user(
            email='alice@example.com',
            password='Password123!',
            role=Role.CANDIDATE,
            full_name='Alice Candidate',
            phone='+919876543210'
        )
        self.profile = CandidateProfile.objects.create(user=self.user)

        # Create Organization & Job for reminders test
        self.org = Organization.objects.create(
            name='National Recruitment Board',
            org_type='government_dept',
            verified=True
        )

        today = date.today()
        self.job = Job.objects.create(
            organization=self.org,
            title='Staff Officer Grade B',
            sector=SectorType.GOVERNMENT,
            work_mode=WorkMode.ON_SITE,
            location_city='New Delhi',
            location_state='Delhi',
            description='Test vacancy',
            minimum_education=EducationLevel.GRADUATE,
            vacancies_total=10,
            vacancies_pwd_reserved=3,
            application_start_date=today - timedelta(days=10),
            application_deadline=today + timedelta(days=2),  # Deadline in 2 days!
            exam_date=today + timedelta(days=5),              # Exam in 5 days!
            official_application_url='http://localhost:3000/demo-portal',
        )

    def test_notification_creation_and_unread_count(self):
        """Notification creation generates in-app record and increments unread count."""
        notif = create_notification(
            user=self.user,
            notification_type=NotificationType.APPLICATION_STATUS,
            title='Application Received',
            message='Your application has been received.',
            link='/dashboard/applications'
        )
        self.assertIsNotNone(notif)
        self.assertEqual(get_unread_count(self.user), 1)

        # Verify via API
        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 1)

    def test_preference_filtering_prevents_disabled_notifications(self):
        """Disabling a notification type prevents notification creation."""
        prefs = get_or_create_preferences(self.user)
        prefs.deadline_alerts = False
        prefs.save()

        notif = create_notification(
            user=self.user,
            notification_type=NotificationType.DEADLINE_REMINDER,
            title='Deadline Soon',
            message='Deadline approaching in 2 days.'
        )
        self.assertIsNone(notif)
        self.assertEqual(get_unread_count(self.user), 0)

    def test_mark_notification_as_read_and_mark_all(self):
        """Test marking single notification and all notifications as read."""
        n1 = create_notification(self.user, NotificationType.SYSTEM, 'Notice 1', 'Text 1')
        n2 = create_notification(self.user, NotificationType.SYSTEM, 'Notice 2', 'Text 2')
        self.assertEqual(get_unread_count(self.user), 2)

        self.client.force_authenticate(user=self.user)

        # Mark single read
        patch_res = self.client.patch(f'/api/notifications/{n1.id}/read/')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_unread_count(self.user), 1)

        # Mark all read
        post_res = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(post_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_unread_count(self.user), 0)

    def test_deadline_reminder_scanner_creates_alerts(self):
        """Scanner automatically finds applications with closing deadlines and exams."""
        # Candidate has an application in 'app_started' for a job closing in 2 days
        JobApplication.objects.create(
            candidate=self.profile,
            job=self.job,
            application_type=ApplicationType.INTERNAL,
            status=ApplicationStatus.APP_STARTED
        )

        reminders_created = check_and_create_deadline_reminders()
        # Should create at least 1 deadline reminder and 1 exam alert
        self.assertGreaterEqual(reminders_created, 1)

        # Check notification was created
        notifs = Notification.objects.filter(user=self.user)
        self.assertTrue(notifs.filter(notification_type=NotificationType.DEADLINE_REMINDER).exists())

    def test_notification_preferences_api(self):
        """Preferences API allows retrieving and toggling channels and categories."""
        self.client.force_authenticate(user=self.user)

        # Get initial prefs
        res_get = self.client.get('/api/notifications/preferences/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertTrue(res_get.data['channel_in_app'])

        # Update prefs
        res_put = self.client.put('/api/notifications/preferences/', {
            'channel_sms': True,
            'job_recommendations': False
        })
        self.assertEqual(res_put.status_code, status.HTTP_200_OK)
        self.assertTrue(res_put.data['channel_sms'])
        self.assertFalse(res_put.data['job_recommendations'])

    def test_fake_sms_provider(self):
        """Fake SMS provider safely formats and logs messages."""
        provider = FakeConsoleSMSProvider()
        result = provider.send_sms('+919876543210', 'Test SMS Message')
        self.assertTrue(result)
