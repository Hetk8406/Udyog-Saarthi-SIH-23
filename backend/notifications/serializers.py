from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'link',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'link', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id',
            'app_status_updates',
            'deadline_alerts',
            'exam_alerts',
            'job_recommendations',
            'channel_in_app',
            'channel_email',
            'channel_sms',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']
