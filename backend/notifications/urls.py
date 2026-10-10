from django.urls import path
from .views import (
    NotificationListView,
    NotificationUnreadCountView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    NotificationPreferenceView,
    TriggerDeadlineCheckView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('<uuid:pk>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),
    path('preferences/', NotificationPreferenceView.as_view(), name='notification-preferences'),
    path('trigger-deadline-check/', TriggerDeadlineCheckView.as_view(), name='trigger-deadline-check'),
]
