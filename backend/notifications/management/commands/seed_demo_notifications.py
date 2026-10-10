from django.core.management.base import BaseCommand
from accounts.models import User
from notifications.models import Notification, NotificationType, NotificationPreference
from notifications.services import get_or_create_preferences
from core.demo_guard import check_demo_seed_allowed


class Command(BaseCommand):
    help = 'Seeds initial sample in-app notifications for candidate@demo.com'

    def handle(self, *args, **options):
        check_demo_seed_allowed()
        candidate = User.objects.filter(email='candidate@demo.com').first()
        if not candidate:
            self.stdout.write(self.style.WARNING("candidate@demo.com not found. Run seed_demo_users first."))
            return

        # Ensure preferences exist
        prefs = get_or_create_preferences(candidate)
        prefs.channel_in_app = True
        prefs.channel_email = True
        prefs.save()

        sample_notifs = [
            {
                'notification_type': NotificationType.EXAM_ALERT,
                'title': 'Admit Card Released: Assistant Section Officer',
                'message': 'Your admit card for Assistant Section Officer (State Power Transmission Corp) is now available. Scribe assistance and ground-floor access have been allocated.',
                'link': '/dashboard/applications',
                'is_read': False,
            },
            {
                'notification_type': NotificationType.DEADLINE_REMINDER,
                'title': 'Application Deadline Closing Soon',
                'message': 'Only 2 days remaining to finalize and submit applications for Junior Statistical Assistant. Verify all eligibility attachments.',
                'link': '/jobs',
                'is_read': False,
            },
            {
                'notification_type': NotificationType.JOB_RECOMMENDATION,
                'title': 'New Vacancy Matching Your Accessibility Profile',
                'message': 'A new role "Junior Python Backend Developer" with 100% remote work and screen-reader accessible IDE support has been published.',
                'link': '/jobs',
                'is_read': False,
            },
            {
                'notification_type': NotificationType.SYSTEM,
                'title': 'Welcome to Udyog Saarthi!',
                'message': 'Your accessible employment profile is active. You can customize which notifications you receive via email, in-app, or SMS in your notification settings.',
                'link': '/dashboard/notifications',
                'is_read': True,
            },
        ]

        count = 0
        for data in sample_notifs:
            notif, created = Notification.objects.get_or_create(
                user=candidate,
                title=data['title'],
                defaults={
                    'notification_type': data['notification_type'],
                    'message': data['message'],
                    'link': data['link'],
                    'is_read': data['is_read'],
                }
            )
            if created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} sample notifications for candidate@demo.com!"))
