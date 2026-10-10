from rest_framework import serializers
from django.contrib.auth import get_user_model
from profiles.models import CandidateProfile
from jobs.models import Job
from .models import (
    SupportTicket,
    SupportMessage,
    JobCoachAssignment,
    CoachNote,
    CoachJobRecommendation,
    GuardianAccess,
    TicketCategory,
    TicketStatus
)

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']


class SupportMessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = ['id', 'ticket', 'sender', 'message', 'created_at', 'is_me']
        read_only_fields = ['id', 'ticket', 'sender', 'created_at']

    def get_is_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender_id == request.user.id
        return False


class SupportTicketListSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.user.full_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.user.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_coach_name = serializers.CharField(source='assigned_coach.full_name', read_only=True, default=None)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    message_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id',
            'candidate',
            'candidate_name',
            'candidate_email',
            'created_by',
            'created_by_name',
            'category',
            'category_display',
            'subject',
            'description',
            'status',
            'status_display',
            'assigned_coach',
            'assigned_coach_name',
            'message_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'candidate', 'created_by', 'created_at', 'updated_at']


class SupportTicketDetailSerializer(SupportTicketListSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta(SupportTicketListSerializer.Meta):
        fields = SupportTicketListSerializer.Meta.fields + ['messages']


class CreateSupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['category', 'subject', 'description']

    def validate_subject(self, value):
        from django.utils.html import strip_tags
        cleaned = strip_tags(value).strip()
        if len(cleaned) < 4:
            raise serializers.ValidationError("Subject must be at least 4 characters long.")
        return cleaned

    def validate_description(self, value):
        from django.utils.html import strip_tags
        cleaned = strip_tags(value).strip()
        if len(cleaned) < 10:
            raise serializers.ValidationError("Please provide a description of at least 10 characters.")
        return cleaned


class CoachCandidateSummarySerializer(serializers.ModelSerializer):
    """Permitted candidate profile fields visible to their assigned Job Coach."""
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    primary_disability = serializers.SerializerMethodField()
    accommodation_needs = serializers.SerializerMethodField()
    education_summary = serializers.SerializerMethodField()
    skills_summary = serializers.SerializerMethodField()
    active_applications_count = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'city',
            'state',
            'preferred_sector',
            'preferred_work_mode',
            'completion_percentage',
            'primary_disability',
            'accommodation_needs',
            'education_summary',
            'skills_summary',
            'active_applications_count',
            'updated_at',
        ]

    def get_primary_disability(self, obj):
        if hasattr(obj, 'accessibility_profile'):
            return obj.accessibility_profile.get_primary_disability_display()
        return "Not specified"

    def get_accommodation_needs(self, obj):
        if not hasattr(obj, 'accessibility_profile'):
            return []
        acc = obj.accessibility_profile
        needs = []
        if acc.needs_scribe:
            needs.append("Scribe / Reader")
        if acc.needs_sign_language_interpreter:
            needs.append("Sign Language Interpreter")
        if acc.needs_extra_time_for_exams:
            needs.append("Compensatory Extra Time")
        if acc.needs_ground_floor_access:
            needs.append("Ground Floor Access")
        if acc.needs_personal_attendant:
            needs.append("Personal Attendant")
        return needs

    def get_education_summary(self, obj):
        return [
            {"qualification": e.qualification, "institution": e.institution, "year": e.year_of_passing}
            for e in obj.educations.all()[:3]
        ]

    def get_skills_summary(self, obj):
        return [s.name for s in obj.skills.all()[:6]]

    def get_active_applications_count(self, obj):
        return obj.applications.count()


class CoachNoteSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)

    class Meta:
        model = CoachNote
        fields = ['id', 'candidate', 'coach', 'coach_name', 'title', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'coach', 'candidate', 'created_at', 'updated_at']


class CoachJobRecommendationSerializer(serializers.ModelSerializer):
    coach_name = serializers.CharField(source='coach.full_name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    organization_name = serializers.CharField(source='job.organization.name', read_only=True)
    job_location = serializers.CharField(source='job.location_city', read_only=True)
    application_deadline = serializers.DateField(source='job.application_deadline', read_only=True)

    class Meta:
        model = CoachJobRecommendation
        fields = [
            'id',
            'candidate',
            'job',
            'job_title',
            'organization_name',
            'job_location',
            'application_deadline',
            'coach',
            'coach_name',
            'recommendation_note',
            'created_at'
        ]
        read_only_fields = ['id', 'coach', 'candidate', 'created_at']


class GuardianAccessSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.user.full_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.user.email', read_only=True)
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    guardian_email = serializers.CharField(source='guardian.email', read_only=True)

    class Meta:
        model = GuardianAccess
        fields = [
            'id',
            'guardian',
            'guardian_name',
            'guardian_email',
            'candidate',
            'candidate_name',
            'candidate_email',
            'relationship',
            'allow_view_profile',
            'allow_view_applications',
            'allow_view_support_tickets',
            'allow_view_learning_progress',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'guardian', 'candidate', 'created_at', 'updated_at']
