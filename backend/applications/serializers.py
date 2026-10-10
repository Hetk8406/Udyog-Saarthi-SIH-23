from rest_framework import serializers
from .models import (
    JobApplication,
    ApplicationStatusHistory,
    ApplicationStatus,
    ApplicationType,
)
from jobs.models import Job
from jobs.serializers import JobSerializer
from profiles.serializers import CandidateDocumentSerializer


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationStatusHistory
        fields = [
            'id',
            'from_status',
            'to_status',
            'note',
            'changed_by_name',
            'created_at',
        ]

    def get_changed_by_name(self, obj) -> str:
        if obj.changed_by:
            return obj.changed_by.full_name
        return 'System'


class JobApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    application_type_display = serializers.CharField(source='get_application_type_display', read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    documents = CandidateDocumentSerializer(source='attached_documents', many=True, read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            'id',
            'job',
            'application_type',
            'application_type_display',
            'status',
            'status_display',
            'accommodations_requested',
            'candidate_notes',
            'documents',
            'status_history',
            'applied_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at']


class ApplicationCreateSerializer(serializers.Serializer):
    job_id = serializers.UUIDField()
    application_type = serializers.ChoiceField(
        choices=ApplicationType.choices,
        default=ApplicationType.INTERNAL
    )
    accommodations_requested = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    candidate_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )
    document_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )

    def validate_job_id(self, value):
        if not Job.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Selected job vacancy does not exist.")
        return value

    def validate_candidate_notes(self, value):
        from django.utils.html import strip_tags
        return strip_tags(value).strip()


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ApplicationStatus.choices)
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_note(self, value):
        from django.utils.html import strip_tags
        return strip_tags(value).strip()
