from django.urls import path
from .views import (
    CandidateProfileMeView,
    CandidateAccessibilityUpdateView,
    CandidateProfileDetailView,
    EducationListCreateView,
    EducationDetailView,
    SkillListCreateView,
    SkillDetailView,
    ExperienceListCreateView,
    ExperienceDetailView,
    CandidateDocumentListCreateView,
    CandidateDocumentDetailView,
    CandidateDocumentDownloadView,
    LocalDocumentDownloadStreamView,
)

urlpatterns = [
    # Candidate current user profile
    path('me/', CandidateProfileMeView.as_view(), name='profile-me'),
    path('me/accessibility/', CandidateAccessibilityUpdateView.as_view(), name='profile-accessibility'),

    # Profile detail by ID (guarded)
    path('<uuid:pk>/', CandidateProfileDetailView.as_view(), name='profile-detail'),

    # Sub-entities
    path('me/education/', EducationListCreateView.as_view(), name='profile-education-list-create'),
    path('me/education/<uuid:pk>/', EducationDetailView.as_view(), name='profile-education-detail'),

    path('me/skills/', SkillListCreateView.as_view(), name='profile-skill-list-create'),
    path('me/skills/<uuid:pk>/', SkillDetailView.as_view(), name='profile-skill-detail'),

    path('me/experience/', ExperienceListCreateView.as_view(), name='profile-experience-list-create'),
    path('me/experience/<uuid:pk>/', ExperienceDetailView.as_view(), name='profile-experience-detail'),

    # Document management & secure download
    path('me/documents/', CandidateDocumentListCreateView.as_view(), name='profile-document-list-create'),
    path('me/documents/<uuid:pk>/', CandidateDocumentDetailView.as_view(), name='profile-document-detail'),
    path('documents/<uuid:pk>/download/', CandidateDocumentDownloadView.as_view(), name='profile-document-download'),
    path('documents/<uuid:pk>/stream/', LocalDocumentDownloadStreamView.as_view(), name='profile-document-stream'),
]
