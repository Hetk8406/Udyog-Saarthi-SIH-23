from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, Role
from .models import Organization, Job, SavedJob, SectorType, WorkMode, EducationLevel, JobStatus


class JobTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            email='admin@example.com',
            full_name='Admin User',
            password='Password123!',
            role=Role.ADMIN,
            is_staff=True,
        )
        self.candidate = User.objects.create_user(
            email='candidate@example.com',
            full_name='Candidate User',
            password='Password123!',
            role=Role.CANDIDATE,
        )

        # Organizations
        self.org_railways = Organization.objects.create(
            name='Indian Railways Recruitment Board (Demo)',
            org_type='government_dept',
        )
        self.org_tech = Organization.objects.create(
            name='Accessible Tech India Pvt Ltd (Demo)',
            org_type='private_sector',
        )

        # Jobs
        self.today = date.today()
        self.future_deadline = self.today + timedelta(days=30)

        self.govt_job = Job.objects.create(
            organization=self.railways,
            title='Junior Assistant (Commercial)',
            sector=SectorType.GOVERNMENT,
            work_mode=WorkMode.ON_SITE,
            location_city='New Delhi',
            location_state='Delhi',
            description='Demo role for office data entry and record maintenance.',
            minimum_education=EducationLevel.TWELFTH,
            vacancies_total=10,
            vacancies_pwd_reserved=4,
            eligible_disabilities=['locomotor', 'hearing_impairment'],
            accessibility_facilities=['Wheelchair Ramp', 'Elevator Access'],
            application_start_date=self.today,
            application_deadline=self.future_deadline,
            official_application_url='https://example.gov.in/demo-apply',
            status=JobStatus.PUBLISHED,
        )

        self.private_job = Job.objects.create(
            organization=self.org_tech,
            title='Accessibility QA Tester',
            sector=SectorType.PRIVATE,
            work_mode=WorkMode.REMOTE,
            location_city='Bengaluru',
            location_state='Karnataka',
            description='Test web platforms using screen readers and keyboard navigation.',
            minimum_education=EducationLevel.GRADUATE,
            vacancies_total=3,
            vacancies_pwd_reserved=3,
            eligible_disabilities=['visual_impairment', 'locomotor'],
            accessibility_facilities=['Screen Reader Workstation', 'Assistive Software'],
            application_start_date=self.today,
            application_deadline=self.future_deadline,
            official_application_url='https://example.com/demo-careers',
            status=JobStatus.PUBLISHED,
        )

    @property
    def railways(self):
        return self.org_railways

    def test_public_can_list_jobs(self):
        """Unauthenticated visitors can browse published vacancies."""
        response = self.client.get(reverse('job-list-create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 2)

    def test_search_and_filter_jobs(self):
        """Filtering by sector, keyword, and work mode returns matching jobs."""
        # Filter by sector = government
        res_govt = self.client.get(reverse('job-list-create'), {'sector': 'government'})
        self.assertEqual(res_govt.status_code, status.HTTP_200_OK)
        self.assertEqual(res_govt.data['count'], 1)
        self.assertEqual(res_govt.data['results'][0]['title'], 'Junior Assistant (Commercial)')

        # Search by keyword = 'QA Tester'
        res_kw = self.client.get(reverse('job-list-create'), {'search': 'QA Tester'})
        self.assertEqual(res_kw.status_code, status.HTTP_200_OK)
        self.assertEqual(res_kw.data['count'], 1)
        self.assertEqual(res_kw.data['results'][0]['sector'], 'private')

        # Filter by work mode = 'remote'
        res_mode = self.client.get(reverse('job-list-create'), {'work_mode': 'remote'})
        self.assertEqual(res_mode.status_code, status.HTTP_200_OK)
        self.assertEqual(res_mode.data['count'], 1)

    def test_admin_only_job_creation(self):
        """Only users with admin role can create jobs."""
        new_job_data = {
            'organization_id': str(self.org_tech.id),
            'title': 'Junior Data Analyst (Demo)',
            'sector': SectorType.PRIVATE,
            'work_mode': WorkMode.HYBRID,
            'location_city': 'Pune',
            'location_state': 'Maharashtra',
            'description': 'Analyze customer feedback and generate reports.',
            'minimum_education': EducationLevel.GRADUATE,
            'vacancies_total': 2,
            'vacancies_pwd_reserved': 2,
            'application_start_date': str(self.today),
            'application_deadline': str(self.future_deadline),
            'official_application_url': 'https://example.com/apply',
        }

        # 1. Unauthenticated fails
        res_anon = self.client.post(reverse('job-list-create'), new_job_data, format='json')
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Candidate fails
        self.client.force_authenticate(user=self.candidate)
        res_cand = self.client.post(reverse('job-list-create'), new_job_data, format='json')
        self.assertEqual(res_cand.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin succeeds
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.post(reverse('job-list-create'), new_job_data, format='json')
        self.assertEqual(res_admin.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_admin.data['title'], 'Junior Data Analyst (Demo)')

    def test_save_job_toggle_and_list(self):
        """Candidate can bookmark/save and un-bookmark a job."""
        self.client.force_authenticate(user=self.candidate)

        # 1. Save govt job
        save_url = reverse('job-save-toggle', kwargs={'pk': self.govt_job.id})
        res_save = self.client.post(save_url)
        self.assertEqual(res_save.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_save.data['saved'])
        self.assertTrue(SavedJob.objects.filter(user=self.candidate, job=self.govt_job).exists())

        # 2. Check saved list
        res_list = self.client.get(reverse('job-saved-list'))
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data), 1)
        self.assertEqual(res_list.data[0]['job']['id'], str(self.govt_job.id))

        # 3. Un-save by toggling again
        res_unsave = self.client.post(save_url)
        self.assertEqual(res_unsave.status_code, status.HTTP_200_OK)
        self.assertFalse(res_unsave.data['saved'])
        self.assertFalse(SavedJob.objects.filter(user=self.candidate, job=self.govt_job).exists())
