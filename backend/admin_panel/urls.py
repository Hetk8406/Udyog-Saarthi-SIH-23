from django.urls import path
from .views import (
    AdminStatsOverviewView,
    AdminUsersListView,
    AdminCandidatesListView,
    AdminCoachesListView,
    AdminOrganizationsListView,
    AdminJobsListView,
    AdminCoursesListView,
    AdminResourcesListView,
    AdminMockTestsListView,
    AdminQuestionsListView,
    AdminSupportTicketsListView,
    AdminAuditLogsListView,
    PublicSuccessStoriesListView,
    AdminSuccessStoriesListView,
    PublicFeedbackSubmitView,
    AdminFeedbackListView,
)

urlpatterns = [
    # Dashboard stats
    path('stats/', AdminStatsOverviewView.as_view(), name='admin-stats'),

    # Entity Management endpoints (Protected for AdminRole only)
    path('users/', AdminUsersListView.as_view(), name='admin-users'),
    path('candidates/', AdminCandidatesListView.as_view(), name='admin-candidates'),
    path('coaches/', AdminCoachesListView.as_view(), name='admin-coaches'),
    path('organizations/', AdminOrganizationsListView.as_view(), name='admin-organizations'),
    path('jobs/', AdminJobsListView.as_view(), name='admin-jobs'),
    path('courses/', AdminCoursesListView.as_view(), name='admin-courses'),
    path('resources/', AdminResourcesListView.as_view(), name='admin-resources'),
    path('mock-tests/', AdminMockTestsListView.as_view(), name='admin-mock-tests'),
    path('questions/', AdminQuestionsListView.as_view(), name='admin-questions'),
    path('tickets/', AdminSupportTicketsListView.as_view(), name='admin-tickets'),
    path('audit-logs/', AdminAuditLogsListView.as_view(), name='admin-audit-logs'),

    # Public & Admin Success Stories
    path('success-stories/', AdminSuccessStoriesListView.as_view(), name='admin-success-stories'),
    path('public-success-stories/', PublicSuccessStoriesListView.as_view(), name='public-success-stories'),

    # Public & Admin Feedback
    path('feedback/', AdminFeedbackListView.as_view(), name='admin-feedback'),
    path('public-feedback/', PublicFeedbackSubmitView.as_view(), name='public-feedback'),
]
