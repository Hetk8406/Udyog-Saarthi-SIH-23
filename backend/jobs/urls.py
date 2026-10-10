from django.urls import path
from .views import (
    JobListCreateView,
    JobDetailView,
    SaveJobToggleView,
    SavedJobsListView,
    OrganizationListView,
)

urlpatterns = [
    # Jobs
    path('', JobListCreateView.as_view(), name='job-list-create'),
    path('saved/', SavedJobsListView.as_view(), name='job-saved-list'),
    path('<uuid:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('<uuid:pk>/save/', SaveJobToggleView.as_view(), name='job-save-toggle'),

    # Organizations
    path('organizations/', OrganizationListView.as_view(), name='organization-list'),
]
