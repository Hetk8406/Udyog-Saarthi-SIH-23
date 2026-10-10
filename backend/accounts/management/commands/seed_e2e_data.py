import datetime
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from accounts.models import User, Role
from profiles.models import (
    CandidateProfile,
    AccessibilityProfile,
    DisabilityType,
    DifficultyLevel
)
from jobs.models import Organization, Job, JobStatus, SectorType, WorkMode, JobType, EducationLevel, OrganizationType
from learning.models import Course, CourseCategory, CourseLevel, MockTest, Question
from support.models import JobCoachAssignment

class Command(BaseCommand):
    help = 'Seeds clean, deterministic test data specifically for E2E tests into a test SQLite database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Wipe existing test data before seeding'
        )

    def handle(self, *args, **options):
        db_name = str(settings.DATABASES['default']['NAME'])
        if 'test_e2e' not in db_name:
            raise CommandError(
                f"SAFETY GUARD: seed_e2e_data can only be executed against a test database containing 'test_e2e'. Current DB: {db_name}"
            )

        if options['reset']:
            self.stdout.write("Resetting existing E2E data...")
            Question.objects.all().delete()
            MockTest.objects.all().delete()
            Course.objects.all().delete()
            Job.objects.all().delete()
            Organization.objects.all().delete()
            JobCoachAssignment.objects.all().delete()
            CandidateProfile.objects.all().delete()
            User.objects.all().delete()

        self.stdout.write("Seeding E2E users...")

        # 1. Admin
        admin_user, _ = User.objects.get_or_create(
            email='e2e_admin@test.local',
            defaults={
                'full_name': 'E2E Test Admin',
                'role': Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('TestPassword123!')
        admin_user.save()

        # 2. Coach
        coach_user, _ = User.objects.get_or_create(
            email='e2e_coach@test.local',
            defaults={
                'full_name': 'E2E Test Coach',
                'role': Role.COACH,
            }
        )
        coach_user.set_password('TestPassword123!')
        coach_user.save()

        # 3. Candidate
        candidate_user, _ = User.objects.get_or_create(
            email='e2e_candidate@test.local',
            defaults={
                'full_name': 'E2E Test Candidate',
                'role': Role.CANDIDATE,
            }
        )
        candidate_user.set_password('TestPassword123!')
        candidate_user.save()

        candidate_user.phone = '+919876543210'
        candidate_user.save()

        cand_profile, _ = CandidateProfile.objects.get_or_create(
            user=candidate_user,
            defaults={
                'city': 'Bengaluru',
                'state': 'Karnataka',
                'pincode': '560001',
                'bio': 'Dedicated candidate seeking inclusive employment opportunities.',
            }
        )

        acc_profile, _ = AccessibilityProfile.objects.get_or_create(
            candidate=cand_profile,
            defaults={
                'primary_disability': DisabilityType.LOCOMOTOR,
                'difficulty_walking_mobility': DifficultyLevel.SOME,
                'needs_extra_time_for_exams': True,
            }
        )

        # Assign Coach to Candidate
        JobCoachAssignment.objects.get_or_create(
            candidate=cand_profile,
            coach=coach_user,
            defaults={
                'is_active': True,
            }
        )

        # 4. Other Candidate (for unauthorized profile access tests)
        other_user, _ = User.objects.get_or_create(
            email='e2e_other_candidate@test.local',
            defaults={
                'full_name': 'E2E Other Candidate',
                'role': Role.CANDIDATE,
            }
        )
        other_user.set_password('TestPassword123!')
        other_user.phone = '+919876543211'
        other_user.save()

        other_profile, _ = CandidateProfile.objects.get_or_create(
            user=other_user,
            defaults={
                'id': '22222222-2222-2222-2222-222222222222',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
                'bio': 'Candidate for testing permission boundaries.',
            }
        )

        # 5. Organization & Published Job for finding & applying
        self.stdout.write("Seeding E2E Organization and Jobs...")
        org, _ = Organization.objects.get_or_create(
            name='E2E Tech Labs',
            defaults={
                'org_type': OrganizationType.PRIVATE_SECTOR,
                'website': 'https://example.com/e2e-labs',
                'description': 'Leading inclusive tech company.',
                'verified': True,
            }
        )

        today = datetime.date.today()
        deadline = today + datetime.timedelta(days=30)

        job, _ = Job.objects.get_or_create(
            title='Accessibility QA Analyst',
            organization=org,
            defaults={
                'id': '33333333-3333-3333-3333-333333333333',
                'sector': SectorType.PRIVATE,
                'work_mode': WorkMode.REMOTE,
                'job_type': JobType.FULL_TIME,
                'location_city': 'Bengaluru',
                'location_state': 'Karnataka',
                'description': 'Join our team testing accessible web experiences. Ensure WCAG compliance and support disabled users.',
                'responsibilities': 'Conduct accessibility audits and assist with test reporting.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 0,
                'salary_display': '₹40,000 - ₹50,000 / month',
                'vacancies_total': 2,
                'vacancies_pwd_reserved': 2,
                'eligible_disabilities': ['locomotor', 'low_vision'],
                'accessibility_facilities': ['Wheelchair accessible campus', 'Screen reader workstation', 'Assistive tech allowance'],
                'application_start_date': today,
                'application_deadline': deadline,
                'official_application_url': 'https://example.com/apply-e2e',
                'status': JobStatus.PUBLISHED,
                'is_demo_data': True,
            }
        )

        # 6. Learning Course and Mock Test
        self.stdout.write("Seeding E2E Learning Courses & Mock Tests...")
        course, _ = Course.objects.get_or_create(
            title='Digital Accessibility Basics',
            defaults={
                'category': CourseCategory.COMPUTER_SKILLS,
                'description': 'Learn fundamental concepts of digital accessibility and WCAG standards.',
                'level': CourseLevel.BEGINNER,
                'is_published': True,
            }
        )

        mock_test, _ = MockTest.objects.get_or_create(
            title='Digital Accessibility 101',
            defaults={
                'id': '44444444-4444-4444-4444-444444444444',
                'category': CourseCategory.COMPUTER_SKILLS,
                'description': 'Practice questions on web accessibility and screen readers.',
                'instructions': 'Read each question carefully and select the best answer. Untimed practice is available.',
                'duration_minutes': 15,
                'total_marks': 10,
                'passing_percentage': 50,
                'is_published': True,
            }
        )

        if not mock_test.questions.exists():
            Question.objects.create(
                mock_test=mock_test,
                question_text='What does WCAG stand for in digital accessibility?',
                subject='Web Standards',
                marks=5,
                negative_marks=0,
                options=[
                    {'id': 'A', 'text': 'Web Content Accessibility Guidelines'},
                    {'id': 'B', 'text': 'Wireless Communication Action Group'},
                    {'id': 'C', 'text': 'Wide Computer Access Gateway'}
                ],
                correct_option_id='A',
                explanation='WCAG stands for Web Content Accessibility Guidelines.',
                order=1
            )
            Question.objects.create(
                mock_test=mock_test,
                question_text='Which HTML element is the most appropriate semantic choice for a button action?',
                subject='HTML Semantics',
                marks=5,
                negative_marks=0,
                options=[
                    {'id': 'A', 'text': '<div>'},
                    {'id': 'B', 'text': '<button>'},
                    {'id': 'C', 'text': '<span>'}
                ],
                correct_option_id='B',
                explanation='The <button> tag is natively accessible and focusable by keyboards.',
                order=2
            )

        self.stdout.write(self.style.SUCCESS("E2E test data seeded successfully into test_e2e database!"))
