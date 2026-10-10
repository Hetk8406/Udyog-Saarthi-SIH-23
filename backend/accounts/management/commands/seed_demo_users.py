from django.core.management.base import BaseCommand
from accounts.models import User, Role
from profiles.models import (
    CandidateProfile,
    AccessibilityProfile,
    Education,
    Skill,
    DisabilityType,
    DifficultyLevel,
)
from profiles.services import get_or_create_candidate_profile, calculate_completion_percentage
from core.demo_guard import check_demo_seed_allowed


class Command(BaseCommand):
    help = 'Seeds initial demo users and profiles for testing (Candidate, Guardian, Coach, Admin)'

    def handle(self, *args, **options):
        check_demo_seed_allowed()
        demo_users = [
            {
                'email': 'candidate@demo.com',
                'full_name': 'Rahul Sharma (Demo Candidate)',
                'password': 'Password123!',
                'role': Role.CANDIDATE,
            },
            {
                'email': 'guardian@demo.com',
                'full_name': 'Sunita Sharma (Demo Guardian)',
                'password': 'Password123!',
                'role': Role.GUARDIAN,
            },
            {
                'email': 'coach@demo.com',
                'full_name': 'Priya Verma (Demo Coach)',
                'password': 'Password123!',
                'role': Role.COACH,
            },
            {
                'email': 'admin@demo.com',
                'full_name': 'Admin User (Demo Admin)',
                'password': 'Password123!',
                'role': Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        ]

        for u in demo_users:
            if not User.objects.filter(email=u['email']).exists():
                is_staff = u.get('is_staff', False)
                is_superuser = u.get('is_superuser', False)
                user = User.objects.create_user(
                    email=u['email'],
                    full_name=u['full_name'],
                    password=u['password'],
                    role=u['role'],
                    is_staff=is_staff,
                    is_superuser=is_superuser,
                )
                self.stdout.write(self.style.SUCCESS(f"Created demo user: {user.email} (Role: {user.role})"))
            else:
                self.stdout.write(f"Demo user already exists: {u['email']}")

        # Seed profile for candidate@demo.com
        candidate = User.objects.get(email='candidate@demo.com')
        profile = get_or_create_candidate_profile(candidate)

        profile.city = 'New Delhi'
        profile.state = 'Delhi'
        profile.gender = 'male'
        profile.address_line = '123, Ring Road'
        profile.pincode = '110001'
        profile.bio = 'Enthusiastic candidate seeking office administration or junior computer assistant role.'
        profile.preferred_sector = 'govt'
        profile.preferred_work_mode = 'any'
        profile.preferred_locations = ['Delhi NCR', 'Noida']
        profile.save()

        acc = profile.accessibility_profile
        acc.primary_disability = DisabilityType.LOCOMOTOR
        acc.disability_percentage = 45
        acc.udid_number = 'DL012345678901'
        acc.udid_verification_status = 'self_declared'
        acc.difficulty_walking_mobility = DifficultyLevel.SOME
        acc.assistive_devices_used = ['Crutches', 'Ergonomic Chair']
        acc.assistive_devices_required = ['Ground floor access', 'Wheelchair ramp']
        acc.needs_ground_floor_access = True
        acc.needs_extra_time_for_exams = True
        acc.save()

        # Add sample education if none
        if not profile.educations.exists():
            Education.objects.create(
                candidate=profile,
                qualification='Bachelor of Commerce (B.Com)',
                institution='Delhi University',
                board_or_university='University of Delhi',
                year_of_passing=2023,
                percentage_or_cgpa='72%',
                specialization='Accounting & Taxation',
            )

        # Add sample skill if none
        if not profile.skills.exists():
            Skill.objects.create(
                candidate=profile,
                name='MS Excel & Office Software',
                category='computer',
                proficiency='intermediate',
            )

        calculate_completion_percentage(profile)
        self.stdout.write(self.style.SUCCESS(f"Demo candidate profile seeded! Completion: {profile.completion_percentage}%"))
