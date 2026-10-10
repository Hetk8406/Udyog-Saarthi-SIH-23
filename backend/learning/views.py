from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count

from accounts.permissions import IsCandidate
from .models import Course, LearningResource, MockTest, TestAttempt
from .serializers import (
    CourseSerializer,
    LearningResourceSerializer,
    MockTestListSerializer,
    TestAttemptDetailSerializer,
    SaveAnswerPayloadSerializer,
    SubmitAttemptPayloadSerializer
)
from .services import (
    start_test_attempt,
    save_test_answer,
    evaluate_and_submit_attempt
)


class CourseListView(generics.ListAPIView):
    """
    Public list of courses, filterable by category.
    """
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Course.objects.filter(is_published=True).prefetch_related('resources')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class LearningResourceListView(generics.ListAPIView):
    """
    Public list of accessible learning resources, articles, and guides.
    """
    serializer_class = LearningResourceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = LearningResource.objects.all()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs


class LearningResourceDetailView(generics.RetrieveAPIView):
    """
    Public detail of a single learning resource.
    """
    queryset = LearningResource.objects.all()
    serializer_class = LearningResourceSerializer
    permission_classes = [permissions.AllowAny]


class MockTestListView(generics.ListAPIView):
    """
    Public list of available mock tests with question counts.
    """
    serializer_class = MockTestListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = MockTest.objects.filter(is_published=True).annotate(
            question_count=Count('questions')
        )
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class MockTestDetailView(generics.RetrieveAPIView):
    """
    Public metadata and instructions for a mock test.
    """
    serializer_class = MockTestListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return MockTest.objects.filter(is_published=True).annotate(
            question_count=Count('questions')
        )


class StartTestAttemptView(APIView):
    """
    Candidate starts or resumes an attempt for a mock test.
    Allows specifying time_mode (standard, compensatory, extended, untimed).
    """
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def post(self, request, pk):
        mock_test = get_object_or_404(MockTest, pk=pk, is_published=True)
        candidate_profile = getattr(request.user, 'candidate_profile', None)
        if not candidate_profile:
            return Response(
                {'detail': 'Candidate profile not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        time_mode = request.data.get('time_mode', 'standard')
        attempt = start_test_attempt(candidate_profile, mock_test, time_mode=time_mode)
        serializer = TestAttemptDetailSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TestAttemptDetailView(generics.RetrieveAPIView):
    """
    Gets current state of a candidate's test attempt.
    """
    serializer_class = TestAttemptDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def get_queryset(self):
        candidate_profile = getattr(self.request.user, 'candidate_profile', None)
        if not candidate_profile:
            return TestAttempt.objects.none()
        return TestAttempt.objects.filter(candidate=candidate_profile)


class SaveAnswerView(APIView):
    """
    Saves an answer choice for a question during an active test attempt.
    """
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def post(self, request, pk):
        candidate_profile = getattr(request.user, 'candidate_profile', None)
        attempt = get_object_or_404(
            TestAttempt,
            pk=pk,
            candidate=candidate_profile
        )

        serializer = SaveAnswerPayloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question_id = str(serializer.validated_data['question_id'])
        selected_option_id = serializer.validated_data['selected_option_id']
        is_marked = serializer.validated_data.get('is_marked_for_review', False)

        try:
            answer = save_test_answer(
                attempt=attempt,
                question_id=question_id,
                selected_option_id=selected_option_id,
                is_marked_for_review=is_marked
            )
            return Response(
                {
                    'question_id': question_id,
                    'selected_option_id': answer.selected_option_id,
                    'is_marked_for_review': answer.is_marked_for_review,
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SubmitTestAttemptView(APIView):
    """
    Finalizes and auto-evaluates the test attempt, generating score and breakdown.
    """
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def post(self, request, pk):
        candidate_profile = getattr(request.user, 'candidate_profile', None)
        attempt = get_object_or_404(
            TestAttempt,
            pk=pk,
            candidate=candidate_profile
        )

        payload = SubmitAttemptPayloadSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        time_spent = payload.validated_data.get('time_spent_seconds', 0)

        evaluated_attempt = evaluate_and_submit_attempt(
            attempt=attempt,
            time_spent_seconds=time_spent
        )

        serializer = TestAttemptDetailSerializer(evaluated_attempt)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CandidateTestAttemptsListView(generics.ListAPIView):
    """
    Lists past mock test attempts for the logged-in candidate.
    """
    serializer_class = TestAttemptDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsCandidate]

    def get_queryset(self):
        candidate_profile = getattr(self.request.user, 'candidate_profile', None)
        if not candidate_profile:
            return TestAttempt.objects.none()
        return TestAttempt.objects.filter(candidate=candidate_profile, is_submitted=True)
