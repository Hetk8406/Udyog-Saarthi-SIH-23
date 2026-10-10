from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from accounts.permissions import IsCandidate
from jobs.models import Job
from .job_recommendation_service import get_recommended_jobs_for_candidate
from .learning_recommendation_service import get_learning_recommendations_for_candidate
from .job_explainer_service import explain_job_and_eligibility, MANDATORY_LEGAL_DISCLAIMER


class JobRecommendationsView(APIView):
    """
    1. Job recommendations: simple, explainable score (skills, education, location, preferences)
       and show "why this matched". Never use disability type to rule jobs in or out.
    """
    permission_classes = [IsAuthenticated, IsCandidate]

    def get(self, request):
        if not hasattr(request.user, 'candidate_profile'):
            return Response(
                {"error": "Please complete your candidate profile to receive recommendations."},
                status=status.HTTP_400_BAD_REQUEST
            )

        limit = int(request.query_params.get('limit', 6))
        recommendations = get_recommended_jobs_for_candidate(request.user.candidate_profile, limit=limit)
        return Response(recommendations, status=status.HTTP_200_OK)


class LearningRecommendationsView(APIView):
    """
    2. Learning recommendations based on weak mock-test subjects and gaps.
    """
    permission_classes = [IsAuthenticated, IsCandidate]

    def get(self, request):
        if not hasattr(request.user, 'candidate_profile'):
            return Response(
                {"error": "Please complete your candidate profile to view diagnostic learning paths."},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = get_learning_recommendations_for_candidate(request.user.candidate_profile)
        return Response(data, status=status.HTTP_200_OK)


class JobExplainerAssistantView(APIView):
    """
    3. Basic assistant that explains a job description, eligibility text, and application steps.
       Includes mandatory disclaimer stating it cannot give legal, medical, or eligibility decisions
       and points to the official notification instead.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'ai'

    def post(self, request, job_id):
        job = get_object_or_404(Job, id=job_id)
        candidate_query = request.data.get('query', '').strip()
        if len(candidate_query) > 1000:
            return Response(
                {"error": "Question is too long. Please limit your inquiry to 1,000 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )
        explanation = explain_job_and_eligibility(job, candidate_query=candidate_query)
        return Response(explanation, status=status.HTTP_200_OK)
