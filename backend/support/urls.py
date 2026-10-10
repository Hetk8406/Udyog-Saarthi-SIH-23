from django.urls import path
from .views import (
    SupportTicketListCreateView,
    SupportTicketDetailView,
    SupportMessageCreateView,
    CoachCandidatesListView,
    CoachCandidateDetailView,
    CoachNotesView,
    CoachRecommendJobView,
    CandidateRecommendationsView,
    GuardianAccessManagementView,
    GuardianCandidateProfileView
)

urlpatterns = [
    # Support Tickets & Messages
    path('tickets/', SupportTicketListCreateView.as_view(), name='support-ticket-list-create'),
    path('tickets/<uuid:pk>/', SupportTicketDetailView.as_view(), name='support-ticket-detail'),
    path('tickets/<uuid:pk>/messages/', SupportMessageCreateView.as_view(), name='support-message-create'),

    # Coach Specific Endpoints
    path('coach/candidates/', CoachCandidatesListView.as_view(), name='coach-candidates-list'),
    path('coach/candidates/<uuid:pk>/', CoachCandidateDetailView.as_view(), name='coach-candidate-detail'),
    path('coach/candidates/<uuid:candidate_id>/notes/', CoachNotesView.as_view(), name='coach-notes'),
    path('coach/candidates/<uuid:candidate_id>/recommend-job/', CoachRecommendJobView.as_view(), name='coach-recommend-job'),

    # Candidate View of Coach Recommendations
    path('recommendations/', CandidateRecommendationsView.as_view(), name='candidate-recommendations'),

    # Guardian Delegation & Access
    path('guardian/access/', GuardianAccessManagementView.as_view(), name='guardian-access-management'),
    path('guardian/candidates/<uuid:candidate_id>/profile/', GuardianCandidateProfileView.as_view(), name='guardian-candidate-profile'),
]
