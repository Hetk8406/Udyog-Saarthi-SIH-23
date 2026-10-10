from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User, Role
from profiles.models import CandidateProfile
from .models import Course, LearningResource, MockTest, Question, TestAttempt
from .services import start_test_attempt, save_test_answer, evaluate_and_submit_attempt


class LearningAndMockTestTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create candidate user & profile
        self.user = User.objects.create_user(
            email='student@example.com',
            password='TestPassword123!',
            role=Role.CANDIDATE,
            full_name='Test Student'
        )
        self.profile = CandidateProfile.objects.create(user=self.user)

        # Create other candidate user & profile
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='TestPassword123!',
            role=Role.CANDIDATE,
            full_name='Other Candidate'
        )
        self.other_profile = CandidateProfile.objects.create(user=self.other_user)

        # Create Course & Resource
        self.course = Course.objects.create(
            title='Government Banking Exam Mastery',
            category='govt_exam_prep',
            description='Preparation track for banking & office clerk exams'
        )
        self.resource = LearningResource.objects.create(
            course=self.course,
            title='Intro to Syllogisms & Logic',
            category='reasoning',
            content_text='Accessible explanation of statements and conclusions.',
            accessibility_notes='Screen reader verified'
        )

        # Create Mock Test
        self.mock_test = MockTest.objects.create(
            title='Comprehensive Government Exam Mock 1',
            category='govt_exam_prep',
            description='30 minute simulated screening exam.',
            instructions='Read each question carefully. Use keyboard arrows to navigate.',
            duration_minutes=30,
            total_marks=3,
            passing_percentage=50
        )

        # Create Questions across 3 subjects: Reasoning, Mathematics, English
        self.q1 = Question.objects.create(
            mock_test=self.mock_test,
            question_text='All roses are flowers. Some flowers fade quickly. What follows?',
            subject='Reasoning',
            marks=1,
            negative_marks=Decimal('0.25'),
            options=[
                {'id': 'A', 'text': 'Some roses fade quickly'},
                {'id': 'B', 'text': 'All flowers are roses'},
                {'id': 'C', 'text': 'Some flowers may fade quickly'},
                {'id': 'D', 'text': 'No flowers are roses'},
            ],
            correct_option_id='C',
            explanation='Option C is logically valid because some flowers fade quickly.',
            order=1
        )

        self.q2 = Question.objects.create(
            mock_test=self.mock_test,
            question_text='If a train travels 60 km in 1 hour, what is its speed in m/s?',
            subject='Mathematics',
            marks=1,
            negative_marks=Decimal('0.25'),
            options=[
                {'id': 'A', 'text': '16.67 m/s'},
                {'id': 'B', 'text': '25 m/s'},
                {'id': 'C', 'text': '10 m/s'},
                {'id': 'D', 'text': '20 m/s'},
            ],
            correct_option_id='A',
            explanation='60 * (5/18) = 16.67 m/s.',
            order=2
        )

        self.q3 = Question.objects.create(
            mock_test=self.mock_test,
            question_text='Choose the synonym for "Accessible":',
            subject='English',
            marks=1,
            negative_marks=Decimal('0.25'),
            options=[
                {'id': 'A', 'text': 'Incomprehensible'},
                {'id': 'B', 'text': 'Reachable / Available'},
                {'id': 'C', 'text': 'Confusing'},
                {'id': 'D', 'text': 'Restricted'},
            ],
            correct_option_id='B',
            explanation='Accessible means easily reachable or approachable.',
            order=3
        )

    def test_course_and_resource_public_api(self):
        """Unauthenticated candidates can view courses and resources."""
        res_courses = self.client.get('/api/learning/courses/')
        self.assertEqual(res_courses.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_courses.data), 1)

        res_res = self.client.get('/api/learning/resources/')
        self.assertEqual(res_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_res.data), 1)

    def test_anti_cheating_hides_answers_during_test(self):
        """Active test questions do not expose correct_option_id or explanation."""
        self.client.force_authenticate(user=self.user)
        res = self.client.post(f'/api/learning/tests/{self.mock_test.id}/start/', {'time_mode': 'compensatory'})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        attempt_id = res.data['id']
        attempt_res = self.client.get(f'/api/learning/attempts/{attempt_id}/')
        questions = attempt_res.data['questions']
        self.assertEqual(len(questions), 3)

        for q in questions:
            self.assertNotIn('correct_option_id', q)
            self.assertNotIn('explanation', q)

    def test_auto_evaluation_scoring_and_weak_subject(self):
        """Auto-evaluates answers, computes subject breakdown, and suggests weak subject."""
        # Start attempt
        attempt = start_test_attempt(self.profile, self.mock_test, time_mode='standard')

        # Answer Q1 (Reasoning) correctly: 'C'
        save_test_answer(attempt, str(self.q1.id), 'C')

        # Answer Q2 (Mathematics) incorrectly: 'D' (Correct is 'A')
        save_test_answer(attempt, str(self.q2.id), 'D')

        # Answer Q3 (English) correctly: 'B'
        save_test_answer(attempt, str(self.q3.id), 'B')

        # Evaluate and submit
        evaluated = evaluate_and_submit_attempt(attempt, time_spent_seconds=600)

        self.assertTrue(evaluated.is_submitted)
        self.assertEqual(evaluated.correct_count, 2)
        self.assertEqual(evaluated.incorrect_count, 1)
        self.assertEqual(evaluated.unanswered_count, 0)

        # Raw score: 1 (Q1) - 0.25 (Q2) + 1 (Q3) = 1.75
        self.assertEqual(evaluated.score, Decimal('1.75'))

        # Subject breakdown check
        breakdown = evaluated.subject_breakdown
        self.assertEqual(breakdown['Reasoning']['percentage'], 100.0)
        self.assertEqual(breakdown['English']['percentage'], 100.0)
        self.assertEqual(breakdown['Mathematics']['percentage'], 0.0)

        # Weak subject suggestion should identify Mathematics!
        self.assertEqual(evaluated.weak_subject_suggestion, 'Mathematics Practice')

    def test_answers_revealed_after_submission(self):
        """Post-submission attempt detail reveals correct answers and explanations."""
        self.client.force_authenticate(user=self.user)
        start_res = self.client.post(f'/api/learning/tests/{self.mock_test.id}/start/')
        attempt_id = start_res.data['id']

        # Save an answer
        self.client.post(f'/api/learning/attempts/{attempt_id}/answer/', {
            'question_id': str(self.q1.id),
            'selected_option_id': 'C'
        })

        # Submit attempt
        submit_res = self.client.post(f'/api/learning/attempts/{attempt_id}/submit/', {
            'time_spent_seconds': 120
        })
        self.assertEqual(submit_res.status_code, status.HTTP_200_OK)
        self.assertTrue(submit_res.data['is_submitted'])

        # Now questions should include correct_option_id and explanation for review
        questions = submit_res.data['questions']
        self.assertIn('correct_option_id', questions[0])
        self.assertIn('explanation', questions[0])
        self.assertEqual(questions[0]['correct_option_id'], 'C')

    def test_candidate_cannot_access_or_submit_others_attempt(self):
        """Candidate B cannot view or submit Candidate A's test attempt."""
        attempt = start_test_attempt(self.profile, self.mock_test)

        self.client.force_authenticate(user=self.other_user)
        # Attempt to get A's attempt
        res = self.client.get(f'/api/learning/attempts/{attempt.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # Attempt to submit A's attempt
        res_sub = self.client.post(f'/api/learning/attempts/{attempt.id}/submit/', {'time_spent_seconds': 10})
        self.assertEqual(res_sub.status_code, status.HTTP_404_NOT_FOUND)
