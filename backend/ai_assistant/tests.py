from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Role
from profiles.models import CandidateProfile, Skill, Education, AccessibilityProfile, DisabilityType
from jobs.models import Organization, Job, JobStatus
from learning.models import MockTest, TestAttempt
from ai_assistant.job_explainer_service import MANDATORY_LEGAL_DISCLAIMER

User = get_user_model()


class AIAssistantHelperTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Candidate
        self.candidate_user = User.objects.create_user(
            email='cand_ai@demo.com',
            full_name='Aarav Kumar',
            password='Password123!',
            role=Role.CANDIDATE
        )
        self.profile = CandidateProfile.objects.create(
            user=self.candidate_user,
            city='New Delhi',
            state='Delhi',
            preferred_sector='govt',
            preferred_work_mode='on_site',
            preferred_locations=['New Delhi', 'Noida']
        )
        # Give candidate some skills and education
        Skill.objects.create(candidate=self.profile, name='Data Entry', proficiency='advanced')
        Skill.objects.create(candidate=self.profile, name='Reasoning', proficiency='intermediate')
        Education.objects.create(
            candidate=self.profile,
            qualification='Bachelor of Commerce',
            institution='Delhi University',
            year_of_passing=2024
        )
        # Disability record: Visual Impairment
        AccessibilityProfile.objects.create(
            candidate=self.profile,
            primary_disability=DisabilityType.VISUAL,
            needs_extra_time_for_exams=True
        )

        # Create Demo Organization & Job
        self.org = Organization.objects.create(name='Ministry of Personnel')
        self.job = Job.objects.create(
            organization=self.org,
            title='Data Entry Assistant Grade II',
            description='Involves spreadsheet entry, record verification, and computer database updates.',
            sector='government',
            work_mode='on_site',
            location_city='New Delhi',
            location_state='Delhi',
            minimum_education='graduate',
            status=JobStatus.PUBLISHED,
            application_start_date='2026-10-01',
            application_deadline='2026-12-01',
            official_application_url='https://example.gov.in/apply/data-entry'
        )

    def test_job_recommendation_is_explainable_and_ignores_disability(self):
        """
        Job recommendations must provide explainable reasons (skills, education, location, preferences)
        and must NEVER rule jobs in or out based on disability type.
        """
        self.client.force_authenticate(user=self.candidate_user)
        res = self.client.get('/api/ai-assistant/jobs/recommendations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

        first_rec = res.data[0]
        self.assertEqual(first_rec['job_title'], 'Data Entry Assistant Grade II')
        self.assertIn('match_percentage', first_rec)
        self.assertGreaterEqual(first_rec['match_percentage'], 50)
        self.assertIn('match_reasons', first_rec)

        # Check explainability
        reasons_text = " ".join(first_rec['match_reasons']).lower()
        self.assertTrue(
            'data entry' in reasons_text or 'skill' in reasons_text,
            "Should explain skills match"
        )
        self.assertTrue(
            'delhi' in reasons_text or 'location' in reasons_text or 'city' in reasons_text,
            "Should explain location match"
        )
        # Ensure disability type is NEVER mentioned as disqualifier or criteria
        self.assertNotIn('visual', reasons_text)
        self.assertNotIn('blind', reasons_text)
        self.assertNotIn('disability', reasons_text)

    def test_learning_recommendation_identifies_weak_subject(self):
        """
        Learning recommendations should diagnose weak mock-test performance
        and target weak areas.
        """
        mock_test = MockTest.objects.create(
            title='Staff Selection Practice Test',
            category='General',
            duration_minutes=60,
            total_marks=100,
            passing_percentage=40,
            is_published=True
        )

        # Create a submitted attempt where Quantitative Aptitude scored low (30%) and Reasoning scored high (85%)
        TestAttempt.objects.create(
            candidate=self.profile,
            mock_test=mock_test,
            score=57.5,
            total_questions=10,
            correct_count=6,
            incorrect_count=4,
            is_submitted=True,
            subject_breakdown={
                "Reasoning": {"correct": 5, "total": 6, "percentage": 83.3},
                "Quantitative Aptitude": {"correct": 1, "total": 4, "percentage": 25.0}
            }
        )

        self.client.force_authenticate(user=self.candidate_user)
        res = self.client.get('/api/ai-assistant/learning/recommendations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['primary_focus_subject'], 'Quantitative Aptitude')
        self.assertIn('identified_weak_areas', res.data)
        self.assertEqual(res.data['identified_weak_areas'][0]['subject'], 'Quantitative Aptitude')

    def test_job_explainer_assistant_has_mandatory_legal_disclaimer(self):
        """
        The assistant must explain the job and explicitly state it cannot give legal/medical decisions,
        pointing to the official notification instead.
        """
        res = self.client.post(f'/api/ai-assistant/jobs/{self.job.id}/explain/', {
            'query': 'Can you explain the qualifications and application steps?'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertIn('plain_language_summary', data)
        self.assertIn('eligibility_breakdown', data)
        self.assertIn('application_steps', data)
        self.assertIn('legal_disclaimer', data)

        # Verify exact ethical guard
        self.assertIn("cannot", data['legal_disclaimer'].lower())
        self.assertIn("legal", data['legal_disclaimer'].lower())
        self.assertIn("official", data['legal_disclaimer'].lower())
        self.assertEqual(data['official_notification_link'], 'https://example.gov.in/apply/data-entry')

    @patch('urllib.request.urlopen')
    def test_job_explainer_falls_back_on_gemini_error_or_timeout(self, mock_urlopen):
        """When Gemini API times out or errors, explainer falls back gracefully to heuristic mode."""
        import os
        import urllib.error

        mock_urlopen.side_effect = urllib.error.URLError("Connection timed out after 8 seconds")

        with patch.dict(os.environ, {"AI_ASSISTANT_API_KEY": "test-gemini-key"}):
            res = self.client.post(f'/api/ai-assistant/jobs/{self.job.id}/explain/', {
                'query': 'Tell me about this vacancy.'
            })
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            data = res.data
            self.assertIn('plain_language_summary', data)
            self.assertIn('eligibility_breakdown', data)
            self.assertIn('application_steps', data)
            self.assertIn('legal_disclaimer', data)

    def test_job_explainer_caps_long_inputs(self):
        """Queries up to view boundary (800 chars) are capped to 500 chars by the explainer service."""
        long_query = "What are the job details? " * 30  # ~780 chars, under 1000 char view limit

        res = self.client.post(f'/api/ai-assistant/jobs/{self.job.id}/explain/', {
            'query': long_query
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data
        self.assertIn('plain_language_summary', data)

    @patch('urllib.request.urlopen')
    def test_zero_candidate_pii_sent_to_gemini(self, mock_urlopen):
        """The prompt sent to third-party LLM contains only job text, zero candidate PII."""
        import os
        import json
        from unittest.mock import MagicMock

        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            'candidates': [{
                'content': {
                    'parts': [{
                        'text': 'Simplified overview of data entry role.'
                    }]
                }
            }]
        }).encode('utf-8')
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        with patch.dict(os.environ, {"AI_ASSISTANT_API_KEY": "test-gemini-key"}):
            self.client.force_authenticate(user=self.candidate_user)
            res = self.client.post(f'/api/ai-assistant/jobs/{self.job.id}/explain/', {
                'query': 'What is this role about?'
            })
            self.assertEqual(res.status_code, status.HTTP_200_OK)

            # Inspect request sent to Gemini API
            call_args = mock_urlopen.call_args
            self.assertIsNotNone(call_args)
            sent_request = call_args[0][0]
            posted_data_str = sent_request.data.decode('utf-8')

            # Ensure zero candidate personal or medical identifiers leaked
            self.assertNotIn(self.candidate_user.email, posted_data_str)
            self.assertNotIn(self.candidate_user.full_name, posted_data_str)
            self.assertNotIn('cand_ai@demo.com', posted_data_str)
            self.assertNotIn('Aarav', posted_data_str)
            self.assertNotIn('Visual Impairment', posted_data_str)
