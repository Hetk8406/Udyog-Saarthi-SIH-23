from django.urls import path
from .views import (
    JobRecommendationsView,
    LearningRecommendationsView,
    JobExplainerAssistantView,
)

urlpatterns = [
    # 1. Explainable Job Recommendations
    path('jobs/recommendations/', JobRecommendationsView.as_view(), name='ai-job-recommendations'),

    # 2. Mock Test Diagnostics & Weak-Subject Learning Recommendations
    path('learning/recommendations/', LearningRecommendationsView.as_view(), name='ai-learning-recommendations'),

    # 3. Job & Eligibility Explainer Assistant (Plain Language + Disclaimer)
    path('jobs/<uuid:job_id>/explain/', JobExplainerAssistantView.as_view(), name='ai-job-explainer'),
]
