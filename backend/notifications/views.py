from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .services import (
    get_or_create_preferences,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    get_unread_count,
    check_and_create_deadline_reminders
)


class NotificationListView(generics.ListAPIView):
    """
    List user's notifications. Supports ?unread=true filter.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        unread_only = self.request.query_params.get('unread')
        if unread_only and unread_only.lower() == 'true':
            qs = qs.filter(is_read=False)
        return qs


class NotificationUnreadCountView(APIView):
    """
    Returns unread in-app notification count for header bell badge.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = get_unread_count(request.user)
        return Response({'unread_count': count}, status=status.HTTP_200_OK)


class MarkNotificationReadView(APIView):
    """
    Marks a single notification as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        success = mark_notification_as_read(pk, request.user)
        if success:
            return Response({'status': 'marked_read'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllNotificationsReadView(APIView):
    """
    Marks all notifications for the authenticated user as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = mark_all_notifications_as_read(request.user)
        return Response({'marked_count': count}, status=status.HTTP_200_OK)


class NotificationPreferenceView(APIView):
    """
    Retrieve or update user notification preferences (types and channels).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        prefs = get_or_create_preferences(request.user)
        serializer = NotificationPreferenceSerializer(prefs)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        prefs = get_or_create_preferences(request.user)
        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class TriggerDeadlineCheckView(APIView):
    """
    Admin or developer endpoint to run the deadline reminder check manually.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = check_and_create_deadline_reminders()
        return Response({'reminders_created': count}, status=status.HTTP_200_OK)
