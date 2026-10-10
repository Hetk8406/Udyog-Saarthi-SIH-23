from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from support.models import SuccessStory, Feedback
from admin_panel.models import AdminAuditLog
from core.demo_guard import check_demo_seed_allowed

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds realistic demo success stories and user feedback for Udyog Saarthi'

    def handle(self, *args, **options):
        check_demo_seed_allowed()
        self.stdout.write("Seeding Success Stories and User Feedback...")

        # 1. Success Stories (PRD Section 18)
        stories_data = [
            {
                "candidate_name": "Aakash Patel",
                "job_title": "Junior Assistant (Grade III)",
                "organization_name": "Ministry of Electronics & Information Technology (MeitY)",
                "sector": "Central Government",
                "journey": "Aakash, a locomotor disability candidate (bilateral orthopaedic support), prepared for 8 months using Udyog Saarthi's accessible Reasoning & General Aptitude tests.",
                "challenges_faced": "Difficulty locating ramp-accessible examination centers and obtaining timely scribe approval documentation.",
                "how_support_helped": "Job Coach guidance helped submit the official Appendix I Scribe undertaking form and coordinated ground floor seating with the nodal test agency.",
                "outcome": "Secured All-India PwD Rank 14 and placed as Junior Assistant in New Delhi.",
                "is_featured": True
            },
            {
                "candidate_name": "Deepa Sundaram",
                "job_title": "Data Entry & Office Associate",
                "organization_name": "Bharat Electronics Limited (BEL)",
                "sector": "Public Sector Undertaking (PSU)",
                "journey": "Deepa has profound hearing impairment and mastered computer operations and spreadsheet software through Udyog Saarthi's video lessons with full transcripts.",
                "challenges_faced": "Communication barriers during online registration interviews and lack of sign language interpretation at local recruitment drives.",
                "how_support_helped": "Requested an empanelled sign language interpreter through Udyog Saarthi Support desk for her document verification round.",
                "outcome": "Selected under Equal Opportunity quota at BEL Bengaluru.",
                "is_featured": True
            },
            {
                "candidate_name": "Siddharth Nair",
                "job_title": "Digital Banking Customer Representative",
                "organization_name": "State Bank of India (SBI)",
                "sector": "Banking / PSU",
                "journey": "Siddharth, with visual impairment (low vision), utilized high-contrast tests and screen-reader accessible practice modules daily.",
                "challenges_faced": "Standard online portals featured low contrast captchas and inaccessible timers that timed out prematurely.",
                "how_support_helped": "The compensatory extra-time simulator trained him to comfortably complete the exam within the allotted relaxed timeframe.",
                "outcome": "Appointed to SBI Regional Operations Hub.",
                "is_featured": True
            }
        ]

        for s in stories_data:
            SuccessStory.objects.get_or_create(
                candidate_name=s['candidate_name'],
                organization_name=s['organization_name'],
                defaults=s
            )

        # 2. Feedback (PRD Section 19)
        candidate_user = User.objects.filter(email='candidate@demo.com').first()
        admin_user = User.objects.filter(email='admin@demo.com').first()

        feedbacks_data = [
            {
                "user": candidate_user,
                "rating": 5,
                "category": "accessibility",
                "feedback_text": "The high contrast toggle and compensatory extra-time options on the mock test engine made preparation truly accessible for me. Scribe undertaking forms were also clearly explained.",
                "suggestions": "Would love keyboard shortcuts for moving to the next question automatically after selecting an option."
            },
            {
                "user": None,
                "rating": 5,
                "category": "job_discovery",
                "feedback_text": "The filter for PwD-reserved vacancies and clear display of application deadlines saved hours of searching confusing PDF gazettes.",
                "suggestions": "Include salary pay band ranges for more private sector entries."
            },
            {
                "user": candidate_user,
                "rating": 4,
                "category": "coaching_support",
                "feedback_text": "Coach Priya responded to my scribe query within hours. The conversation timeline is very easy to read.",
                "suggestions": "Add an SMS reminder when the coach posts a reply."
            }
        ]

        for f in feedbacks_data:
            Feedback.objects.get_or_create(
                feedback_text=f['feedback_text'],
                defaults=f
            )

        # 3. Seed some Audit logs
        if admin_user:
            AdminAuditLog.objects.get_or_create(
                target_entity='Job',
                details="Published new vacancy 'Junior Assistant' at Ministry of Social Justice",
                defaults={
                    'admin_user': admin_user,
                    'action_type': 'CREATE',
                    'target_id': 'demo-job-1'
                }
            )
            AdminAuditLog.objects.get_or_create(
                target_entity='JobCoachAssignment',
                details="Assigned Job Coach Priya Verma to Candidate Rahul Sharma",
                defaults={
                    'admin_user': admin_user,
                    'action_type': 'ASSIGN',
                    'target_id': 'demo-coach-assign-1'
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded demo stories, feedback, and audit logs!"))
