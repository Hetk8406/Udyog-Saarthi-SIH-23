from django.urls import path
from .views import (
    ApplicationListCreateView,
    ApplicationDetailView,
    ApplicationStatusUpdateView,
    ApplicationSummaryView,
)

urlpatterns = [
    path('', ApplicationListCreateView.as_view(), name='application-list-create'),
    path('summary/', ApplicationSummaryView.as_view(), name='application-summary'),
    path('<uuid:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('<uuid:pk>/status/', ApplicationStatusUpdateView.as_view(), name='application-status-update'),
]
