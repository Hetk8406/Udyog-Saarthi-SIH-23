from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, Role
from jobs.models import Organization, Job, SectorType, WorkMode, EducationLevel, JobStatus
from profiles.models import CandidateProfile
from profiles.services import get_or_create_candidate_profile
from .models import (
    JobApplication,
    ApplicationStatusHistory,
    ApplicationStatus,
    ApplicationType,
)


class ApplicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Candidates
        self.candidate_a_user = User.objects.create_user(
            email='alice@example.com',
            full_name='Alice Candidate',
            password='Password123!',
            role=Role.CANDIDATE,
        )
        self.profile_a = get_or_create_candidate_profile(self.candidate_a_user)

        self.candidate_b_user = User.objects.create_user(
            email='bob@example.com',
            full_name='Bob Candidate',
            password='Password123!',
            role=Role.CANDIDATE,
        )
        self.profile_b = get_or_create_candidate_profile(self.candidate_b_user)

        # Organization & Job
        self.org = Organization.objects.create(name='National Portal Corp', org_type='psu')
        today = date.today()
        self.job_internal = Job.objects.create(
            organization=self.org,
            title='Internal Junior Assistant',
            sector=SectorType.GOVERNMENT,
            work_mode=WorkMode.ON_SITE,
            location_city='New Delhi',
            location_state='Delhi',
            description='Test role',
            minimum_education=EducationLevel.TWELFTH,
            application_start_date=today,
            application_deadline=today + timedelta(days=30),
            official_application_url='https://example.gov.in/test',
            status=JobStatus.PUBLISHED,
        )

        self.job_external = Job.objects.create(
            organization=self.org,
            title='External State Officer Post',
            sector=SectorType.PSU,
            work_mode=WorkMode.HYBRID,
            location_city='Mumbai',
            location_state='Maharashtra',
            description='External role',
            minimum_education=EducationLevel.GRADUATE,
            application_start_date=today,
            application_deadline=today + timedelta(days=30),
            official_application_url='https://external-commission.gov.in/apply',
            status=JobStatus.PUBLISHED,
        )

    def test_internal_application_submission_creates_history(self):
        """Applying internally sets status to SUBMITTED and logs an audit history entry."""
        self.client.force_authenticate(user=self.candidate_a_user)
        payload = {
            'job_id': str(self.job_internal.id),
            'application_type': ApplicationType.INTERNAL,
            'accommodations_requested': ['Scribe', 'Compensatory Extra Time'],
            'candidate_notes': 'Requested Scribe with assistive keyboard.',
        }
        response = self.client.post(reverse('application-list-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], ApplicationStatus.SUBMITTED)
        self.assertEqual(response.data['application_type'], ApplicationType.INTERNAL)

        # Verify history row was created
        app_id = response.data['id']
        app = JobApplication.objects.get(id=app_id)
        self.assertEqual(app.status_history.count(), 1)
        history = app.status_history.first()
        self.assertEqual(history.from_status, ApplicationStatus.APP_STARTED)
        self.assertEqual(history.to_status, ApplicationStatus.SUBMITTED)

    def test_external_application_record_marks_as_applied(self):
        """For external redirect jobs, candidate records that they applied externally."""
        self.client.force_authenticate(user=self.candidate_a_user)
        payload = {
            'job_id': str(self.job_external.id),
            'application_type': ApplicationType.EXTERNAL_REDIRECT,
            'accommodations_requested': ['Ground Floor Access'],
            'candidate_notes': 'Completed on official portal with Registration No: PSU-98765.',
        }
        response = self.client.post(reverse('application-list-create'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], ApplicationStatus.APPLIED)
        self.assertEqual(response.data['application_type'], ApplicationType.EXTERNAL_REDIRECT)

        # Ensure history notes state clearly that candidate confirmed external submission
        app = JobApplication.objects.get(id=response.data['id'])
        history = app.status_history.first()
        self.assertIn("external", history.note.lower())

    def test_duplicate_application_rejected(self):
        """Candidate cannot submit duplicate applications for the same job."""
        self.client.force_authenticate(user=self.candidate_a_user)
        payload = {
            'job_id': str(self.job_internal.id),
            'application_type': ApplicationType.INTERNAL,
        }
        res1 = self.client.post(reverse('application-list-create'), payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(reverse('application-list-create'), payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_update_appends_history_row(self):
        """Updating status saves a new audit history row with transition details."""
        self.client.force_authenticate(user=self.candidate_a_user)
        # Create application first
        app = JobApplication.objects.create(
            candidate=self.profile_a,
            job=self.job_internal,
            application_type=ApplicationType.INTERNAL,
            status=ApplicationStatus.SUBMITTED,
        )

        update_url = reverse('application-status-update', kwargs={'pk': app.id})
        update_payload = {
            'status': ApplicationStatus.ADMIT_CARD_RELEASED,
            'note': 'Received admit card roll number 10240.',
        }
        res = self.client.patch(update_url, update_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], ApplicationStatus.ADMIT_CARD_RELEASED)

        # History should now have 1 new row
        history = ApplicationStatusHistory.objects.filter(application=app).first()
        self.assertEqual(history.from_status, ApplicationStatus.SUBMITTED)
        self.assertEqual(history.to_status, ApplicationStatus.ADMIT_CARD_RELEASED)
        self.assertEqual(history.note, 'Received admit card roll number 10240.')
        self.assertEqual(history.changed_by, self.candidate_a_user)

    def test_candidate_cannot_view_or_update_another_candidates_application(self):
        """SECURITY: Bob cannot view or update Alice's application."""
        app = JobApplication.objects.create(
            candidate=self.profile_a,
            job=self.job_internal,
            application_type=ApplicationType.INTERNAL,
            status=ApplicationStatus.SUBMITTED,
        )

        # Bob attempts GET
        self.client.force_authenticate(user=self.candidate_b_user)
        detail_url = reverse('application-detail', kwargs={'pk': app.id})
        res_get = self.client.get(detail_url)
        self.assertEqual(res_get.status_code, status.HTTP_403_FORBIDDEN)

        # Bob attempts PATCH
        update_url = reverse('application-status-update', kwargs={'pk': app.id})
        res_patch = self.client.patch(update_url, {'status': ApplicationStatus.WITHDRAWN}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)

    def test_application_summary_endpoint(self):
        """Summary endpoint aggregates application stage counters."""
        self.client.force_authenticate(user=self.candidate_a_user)
        # Create 2 applications: 1 submitted, 1 exam scheduled
        JobApplication.objects.create(
            candidate=self.profile_a,
            job=self.job_internal,
            status=ApplicationStatus.SUBMITTED,
        )
        JobApplication.objects.create(
            candidate=self.profile_a,
            job=self.job_external,
            status=ApplicationStatus.EXAM_SCHEDULED,
        )

        res = self.client.get(reverse('application-summary'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total'], 2)
        self.assertEqual(res.data['applied'], 1)
        self.assertEqual(res.data['exams'], 1)

    def test_submit_application_with_attached_documents(self):
        """Candidate can attach their documents to an application, and cannot attach another candidate's document."""
        from profiles.models import CandidateDocument, DocumentType

        doc_a = CandidateDocument.objects.create(
            owner=self.profile_a,
            document_type=DocumentType.RESUME,
            original_filename='alice_resume.pdf',
            stored_key='alice-doc-1.pdf',
            content_type='application/pdf',
            size=1024,
        )
        doc_b = CandidateDocument.objects.create(
            owner=self.profile_b,
            document_type=DocumentType.RESUME,
            original_filename='bob_resume.pdf',
            stored_key='bob-doc-1.pdf',
            content_type='application/pdf',
            size=1024,
        )

        self.client.force_authenticate(user=self.candidate_a_user)
        payload = {
            'job_id': str(self.job_internal.id),
            'application_type': ApplicationType.INTERNAL,
            'accommodations_requested': ['Scribe for Examinations'],
            'candidate_notes': 'Please arrange ground floor access.',
            'document_ids': [str(doc_a.id), str(doc_b.id)],
        }
        res = self.client.post(reverse('application-list-create'), payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Check response contains doc_a and NOT doc_b
        doc_ids_returned = [d['id'] for d in res.data.get('documents', [])]
        self.assertIn(str(doc_a.id), doc_ids_returned)
        self.assertNotIn(str(doc_b.id), doc_ids_returned)

        # Check in DB
        doc_a.refresh_from_db()
        doc_b.refresh_from_db()
        self.assertEqual(str(doc_a.application_id), str(res.data['id']))
        self.assertIsNone(doc_b.application_id)
