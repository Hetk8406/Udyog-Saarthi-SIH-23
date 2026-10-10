from django.urls import path
from .views import (
    CourseListView,
    LearningResourceListView,
    LearningResourceDetailView,
    MockTestListView,
    MockTestDetailView,
    StartTestAttemptView,
    TestAttemptDetailView,
    SaveAnswerView,
    SubmitTestAttemptView,
    CandidateTestAttemptsListView
)

urlpatterns = [
    # Courses & Learning Library
    path('courses/', CourseListView.as_view(), name='course-list'),
    path('resources/', LearningResourceListView.as_view(), name='resource-list'),
    path('resources/<uuid:pk>/', LearningResourceDetailView.as_view(), name='resource-detail'),

    # Mock Tests
    path('tests/', MockTestListView.as_view(), name='mock-test-list'),
    path('tests/<uuid:pk>/', MockTestDetailView.as_view(), name='mock-test-detail'),
    path('tests/<uuid:pk>/start/', StartTestAttemptView.as_view(), name='start-test-attempt'),

    # Attempts & Test Engine
    path('attempts/', CandidateTestAttemptsListView.as_view(), name='candidate-attempts-list'),
    path('attempts/<uuid:pk>/', TestAttemptDetailView.as_view(), name='test-attempt-detail'),
    path('attempts/<uuid:pk>/answer/', SaveAnswerView.as_view(), name='save-test-answer'),
    path('attempts/<uuid:pk>/submit/', SubmitTestAttemptView.as_view(), name='submit-test-attempt'),
]
