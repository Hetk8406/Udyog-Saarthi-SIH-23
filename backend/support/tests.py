from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Role
from profiles.models import CandidateProfile, AccessibilityProfile
from jobs.models import Organization, Job
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

User = get_user_model()


class SupportAndCoachPermissionsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Candidate 1
        self.candidate_user_1 = User.objects.create_user(
            email='cand1@test.com',
            full_name='Candidate One',
            password='Password123!',
            role=Role.CANDIDATE
        )
        self.profile_1 = CandidateProfile.objects.create(
            user=self.candidate_user_1,
            city='New Delhi',
            state='Delhi'
        )

        # Create Candidate 2
        self.candidate_user_2 = User.objects.create_user(
            email='cand2@test.com',
            full_name='Candidate Two',
            password='Password123!',
            role=Role.CANDIDATE
        )
        self.profile_2 = CandidateProfile.objects.create(
            user=self.candidate_user_2,
            city='Mumbai',
            state='Maharashtra'
        )

        # Create Coach 1 and Coach 2
        self.coach_1 = User.objects.create_user(
            email='coach1@test.com',
            full_name='Coach Alice',
            password='Password123!',
            role=Role.COACH
        )
        self.coach_2 = User.objects.create_user(
            email='coach2@test.com',
            full_name='Coach Bob',
            password='Password123!',
            role=Role.COACH
        )

        # Assign Candidate 1 to Coach 1 (Coach 2 has no candidates assigned)
        JobCoachAssignment.objects.create(
            coach=self.coach_1,
            candidate=self.profile_1,
            is_active=True
        )

        # Create Guardian
        self.guardian_user = User.objects.create_user(
            email='guardian@test.com',
            full_name='Parent User',
            password='Password123!',
            role=Role.GUARDIAN
        )

        # Create a Demo Job
        self.org = Organization.objects.create(name='Test PSU Org')
        self.job = Job.objects.create(
            organization=self.org,
            title='Office Assistant',
            location_city='Delhi',
            location_state='Delhi',
            application_start_date='2026-10-01',
            application_deadline='2026-12-01'
        )

    def test_candidate_can_create_and_view_own_ticket(self):
        """Candidate can create a ticket and view it, but not tickets of other candidates."""
        self.client.force_authenticate(user=self.candidate_user_1)

        # Open ticket
        create_res = self.client.post('/api/support/tickets/', {
            'category': TicketCategory.APPLICATION_HELP,
            'subject': 'Need scribe assistance for upcoming exam',
            'description': 'I need a scribe registered before the test date.'
        })
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        ticket_id = create_res.data['id']

        # View own ticket
        get_res = self.client.get(f'/api/support/tickets/{ticket_id}/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['subject'], 'Need scribe assistance for upcoming exam')

        # Candidate 2 attempts to view Candidate 1's ticket -> 403 Forbidden
        self.client.force_authenticate(user=self.candidate_user_2)
        cand2_res = self.client.get(f'/api/support/tickets/{ticket_id}/')
        self.assertEqual(cand2_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_support_message_dialogue(self):
        """Candidate and assigned coach can exchange messages on ticket."""
        # Create ticket
        ticket = SupportTicket.objects.create(
            candidate=self.profile_1,
            created_by=self.candidate_user_1,
            category=TicketCategory.COACH_REQUEST,
            subject='Career advice needed',
            description='Looking for remote data entry jobs',
            assigned_coach=self.coach_1,
            status=TicketStatus.ASSIGNED
        )

        # Coach 1 sends reply
        self.client.force_authenticate(user=self.coach_1)
        reply_res = self.client.post(f'/api/support/tickets/{ticket.id}/messages/', {
            'message': 'Hello Candidate One, I have reviewed your profile and can recommend opportunities.'
        })
        self.assertEqual(reply_res.status_code, status.HTTP_201_CREATED)

        # Ticket should now be IN_PROGRESS
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, TicketStatus.IN_PROGRESS)

    def test_coach_can_only_see_assigned_candidates(self):
        """A coach can only see candidates assigned to them."""
        # Coach 1: assigned Candidate 1
        self.client.force_authenticate(user=self.coach_1)
        coach1_res = self.client.get('/api/support/coach/candidates/')
        self.assertEqual(coach1_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(coach1_res.data), 1)
        self.assertEqual(coach1_res.data[0]['id'], str(self.profile_1.id))

        # Coach 1 details for assigned Candidate 1 -> 200 OK
        detail_res = self.client.get(f'/api/support/coach/candidates/{self.profile_1.id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)

        # Coach 1 tries to access Candidate 2 (not assigned to them) -> 403 Forbidden
        unassigned_res = self.client.get(f'/api/support/coach/candidates/{self.profile_2.id}/')
        self.assertEqual(unassigned_res.status_code, status.HTTP_403_FORBIDDEN)

        # Coach 2: has no candidates assigned
        self.client.force_authenticate(user=self.coach_2)
        coach2_res = self.client.get('/api/support/coach/candidates/')
        self.assertEqual(coach2_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(coach2_res.data), 0)

        # Coach 2 cannot access Candidate 1 -> 403 Forbidden
        coach2_cand1 = self.client.get(f'/api/support/coach/candidates/{self.profile_1.id}/')
        self.assertEqual(coach2_cand1.status_code, status.HTTP_403_FORBIDDEN)

    def test_coach_notes_and_job_recommendation_permissions(self):
        """Coach can write notes and recommend jobs ONLY to assigned candidates."""
        # Coach 1 writes note for Candidate 1 -> Success
        self.client.force_authenticate(user=self.coach_1)
        note_res = self.client.post(f'/api/support/coach/candidates/{self.profile_1.id}/notes/', {
            'title': 'Initial Assessment',
            'content': 'Strong computer aptitude. Advised taking Reasoning mock test.'
        })
        self.assertEqual(note_res.status_code, status.HTTP_201_CREATED)

        # Coach 1 recommends a job for Candidate 1 -> Success
        rec_res = self.client.post(f'/api/support/coach/candidates/{self.profile_1.id}/recommend-job/', {
            'job_id': str(self.job.id),
            'recommendation_note': 'This job has ground floor access and matches your skills.'
        })
        self.assertEqual(rec_res.status_code, status.HTTP_201_CREATED)

        # Coach 2 attempts note for Candidate 1 -> 403 Forbidden
        self.client.force_authenticate(user=self.coach_2)
        coach2_note = self.client.post(f'/api/support/coach/candidates/{self.profile_1.id}/notes/', {
            'content': 'Unauthorized note'
        })
        self.assertEqual(coach2_note.status_code, status.HTTP_403_FORBIDDEN)

        # Candidate 1 views recommendations -> Success
        self.client.force_authenticate(user=self.candidate_user_1)
        my_recs = self.client.get('/api/support/recommendations/')
        self.assertEqual(my_recs.status_code, status.HTTP_200_OK)
        self.assertEqual(len(my_recs.data), 1)
        self.assertEqual(my_recs.data[0]['job_title'], 'Office Assistant')

    def test_guardian_access_respects_candidate_permissions(self):
        """Guardians only see what the candidate has allowed."""
        # Candidate 1 authorizes Guardian with allow_view_profile=False, allow_view_support_tickets=True
        GuardianAccess.objects.create(
            guardian=self.guardian_user,
            candidate=self.profile_1,
            relationship='Parent',
            allow_view_profile=False,
            allow_view_support_tickets=True,
            allow_view_applications=False
        )

        self.client.force_authenticate(user=self.guardian_user)

        # Guardian tries to view Candidate 1 profile -> 403 Forbidden because allow_view_profile is False
        profile_res = self.client.get(f'/api/support/guardian/candidates/{self.profile_1.id}/profile/')
        self.assertEqual(profile_res.status_code, status.HTTP_403_FORBIDDEN)

        # But Candidate 1 allowed support tickets -> Guardian can view Candidate 1's tickets
        ticket = SupportTicket.objects.create(
            candidate=self.profile_1,
            created_by=self.candidate_user_1,
            category=TicketCategory.EXAM_ASSISTANCE,
            subject='Assistance needed',
            description='Exam assistance requested.'
        )
        ticket_res = self.client.get(f'/api/support/tickets/{ticket.id}/')
        self.assertEqual(ticket_res.status_code, status.HTTP_200_OK)

        # Now Candidate updates permissions to allow profile
        access = GuardianAccess.objects.get(guardian=self.guardian_user, candidate=self.profile_1)
        access.allow_view_profile = True
        access.save()

        # Guardian tries profile again -> 200 OK
        allowed_profile = self.client.get(f'/api/support/guardian/candidates/{self.profile_1.id}/profile/')
        self.assertEqual(allowed_profile.status_code, status.HTTP_200_OK)
        self.assertEqual(allowed_profile.data['full_name'], 'Candidate One')
