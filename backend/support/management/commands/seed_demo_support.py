from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from profiles.models import CandidateProfile
from jobs.models import Job
from support.models import (
    SupportTicket,
    SupportMessage,
    JobCoachAssignment,
    CoachNote,
    CoachJobRecommendation,
    GuardianAccess,
    TicketStatus,
    TicketCategory
)
from core.demo_guard import check_demo_seed_allowed

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds demo data for Support tickets, Job Coach assignments, Notes, and Guardian Access'

    def handle(self, *args, **options):
        check_demo_seed_allowed()
        self.stdout.write("Seeding Support, Coach, and Guardian demo records...")

        # Find or ensure demo users
        candidate_user = User.objects.filter(email='candidate@demo.com').first()
        coach_user = User.objects.filter(email='coach@demo.com').first()
        guardian_user = User.objects.filter(email='guardian@demo.com').first()

        if not candidate_user or not hasattr(candidate_user, 'candidate_profile'):
            self.stdout.write(self.style.WARNING("candidate@demo.com profile not found. Please run seed_demo_profile first."))
            return

        candidate_profile = candidate_user.candidate_profile

        # 1. Assign Coach to Candidate
        if coach_user:
            assignment, _ = JobCoachAssignment.objects.get_or_create(
                coach=coach_user,
                candidate=candidate_profile,
                defaults={'is_active': True}
            )
            self.stdout.write(f"Assigned coach {coach_user.full_name} to {candidate_user.full_name}")

            # 2. Add Coach Notes
            CoachNote.objects.get_or_create(
                coach=coach_user,
                candidate=candidate_profile,
                title="Vocational Strength Assessment",
                defaults={
                    'content': 'Candidate shows exceptional proficiency in Data Entry and Quantitative Reasoning (86%). Highly motivated for Banking / Staff Selection Commission postings.'
                }
            )

            CoachNote.objects.get_or_create(
                coach=coach_user,
                candidate=candidate_profile,
                title="Examination Accommodation Review",
                defaults={
                    'content': 'Confirmed requirement for ground floor accessible room and compensatory extra time (+20 mins/hour). All certificates in order.'
                }
            )

            # 3. Recommend a Job
            demo_job = Job.objects.filter(title__icontains='Assistant').first() or Job.objects.first()
            if demo_job:
                CoachJobRecommendation.objects.get_or_create(
                    coach=coach_user,
                    candidate=candidate_profile,
                    job=demo_job,
                    defaults={
                        'recommendation_note': f"Great fit for your qualifications and skills. Verified wheelchair accessible facility at this exam center."
                    }
                )

        # 4. Support Tickets
        ticket1, created1 = SupportTicket.objects.get_or_create(
            candidate=candidate_profile,
            subject="Request for ground-floor examination center confirmation",
            defaults={
                'created_by': candidate_user,
                'category': TicketCategory.EXAM_ASSISTANCE,
                'description': "I have submitted my application for Junior Assistant. Could you please confirm if the examination hall allocated has step-free ground floor access?",
                'status': TicketStatus.IN_PROGRESS,
                'assigned_coach': coach_user
            }
        )
        if created1:
            SupportMessage.objects.create(
                ticket=ticket1,
                sender=candidate_user,
                message="I have submitted my application for Junior Assistant. Could you please confirm if the examination hall allocated has step-free ground floor access?"
            )
            if coach_user:
                SupportMessage.objects.create(
                    ticket=ticket1,
                    sender=coach_user,
                    message="Hello Rahul! Yes, we have coordinated with the exam nodal officer. Your admit card will reflect Center Block A (Ground Floor Ramp Access)."
                )

        ticket2, created2 = SupportTicket.objects.get_or_create(
            candidate=candidate_profile,
            subject="Assistance with SSC Scribe Declaration Form",
            defaults={
                'created_by': candidate_user,
                'category': TicketCategory.APPLICATION_HELP,
                'description': "Where can I find the official Annexure for Appendix I (Scribe undertaking) to attach to my application?",
                'status': TicketStatus.OPEN,
                'assigned_coach': coach_user
            }
        )
        if created2:
            SupportMessage.objects.create(
                ticket=ticket2,
                sender=candidate_user,
                message="Where can I find the official Annexure for Appendix I (Scribe undertaking) to attach to my application?"
            )

        # 5. Guardian Access Link
        if guardian_user:
            GuardianAccess.objects.get_or_create(
                guardian=guardian_user,
                candidate=candidate_profile,
                defaults={
                    'relationship': 'Parent',
                    'allow_view_profile': True,
                    'allow_view_applications': True,
                    'allow_view_support_tickets': True,
                    'allow_view_learning_progress': True,
                }
            )
            self.stdout.write(f"Authorized Guardian {guardian_user.full_name} for {candidate_user.full_name}")

        self.stdout.write(self.style.SUCCESS("Successfully seeded Support, Coach, and Guardian records!"))
