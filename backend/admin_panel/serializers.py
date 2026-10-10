from rest_framework import serializers
from accounts.models import User
from profiles.models import CandidateProfile, AccessibilityProfile
from jobs.models import Organization, Job
from applications.models import JobApplication
from learning.models import Course, LearningResource, Question, MockTest
from support.models import SupportTicket, SupportMessage, JobCoachAssignment, SuccessStory, Feedback
from .models import AdminAuditLog


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'is_active', 'date_joined']


class AdminCandidateProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    primary_disability = serializers.SerializerMethodField()
    educations_count = serializers.IntegerField(source='educations.count', read_only=True)
    skills_count = serializers.IntegerField(source='skills.count', read_only=True)
    applications_count = serializers.IntegerField(source='applications.count', read_only=True)

    class Meta:
        model = CandidateProfile
        fields = [
            'id',
            'user',
            'email',
            'full_name',
            'phone',
            'city',
            'state',
            'preferred_sector',
            'completion_percentage',
            'primary_disability',
            'educations_count',
            'skills_count',
            'applications_count',
            'created_at',
        ]

    def get_primary_disability(self, obj):
        if hasattr(obj, 'accessibility_profile'):
            return obj.accessibility_profile.get_primary_disability_display()
        return "None specified"


class AdminCoachSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='coach.email', read_only=True)
    full_name = serializers.CharField(source='coach.full_name', read_only=True)
    candidate_name = serializers.CharField(source='candidate.user.full_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.user.email', read_only=True)

    class Meta:
        model = JobCoachAssignment
        fields = [
            'id',
            'coach',
            'email',
            'full_name',
            'candidate',
            'candidate_name',
            'candidate_email',
            'is_active',
            'assigned_at'
        ]


class AdminOrganizationSerializer(serializers.ModelSerializer):
    jobs_count = serializers.IntegerField(source='jobs.count', read_only=True)

    class Meta:
        model = Organization
        fields = ['id', 'name', 'org_type', 'website', 'description', 'verified', 'jobs_count']


class AdminJobSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    applications_count = serializers.IntegerField(source='applications.count', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id',
            'organization',
            'organization_name',
            'title',
            'sector',
            'job_type',
            'work_mode',
            'location_city',
            'location_state',
            'application_deadline',
            'status',
            'vacancies_total',
            'vacancies_pwd_reserved',
            'applications_count',
            'created_at'
        ]


class AdminCourseSerializer(serializers.ModelSerializer):
    resources_count = serializers.IntegerField(source='resources.count', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'category', 'level', 'is_published', 'resources_count', 'created_at']


class AdminLearningResourceSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True, default='')

    class Meta:
        model = LearningResource
        fields = ['id', 'course', 'course_title', 'title', 'resource_type', 'is_published', 'created_at']


class AdminMockTestSerializer(serializers.ModelSerializer):
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)
    attempts_count = serializers.IntegerField(source='attempts.count', read_only=True)

    class Meta:
        model = MockTest
        fields = [
            'id',
            'title',
            'category',
            'duration_minutes',
            'total_marks',
            'passing_percentage',
            'is_published',
            'questions_count',
            'attempts_count',
            'created_at'
        ]


class AdminQuestionSerializer(serializers.ModelSerializer):
    mock_test_title = serializers.CharField(source='mock_test.title', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'mock_test', 'mock_test_title', 'question_text', 'subject', 'options', 'correct_option_id', 'order']


class AdminSupportTicketSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.user.full_name', read_only=True)
    assigned_coach_name = serializers.CharField(source='assigned_coach.full_name', read_only=True, default='')

    class Meta:
        model = SupportTicket
        fields = [
            'id',
            'candidate',
            'candidate_name',
            'category',
            'subject',
            'status',
            'assigned_coach',
            'assigned_coach_name',
            'created_at',
            'updated_at'
        ]


class SuccessStorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SuccessStory
        fields = [
            'id',
            'candidate_name',
            'job_title',
            'organization_name',
            'sector',
            'journey',
            'challenges_faced',
            'how_support_helped',
            'outcome',
            'is_featured',
            'created_at'
        ]


class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True, default='Anonymous')
    user_email = serializers.CharField(source='user.email', read_only=True, default='')

    class Meta:
        model = Feedback
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'rating',
            'category',
            'feedback_text',
            'suggestions',
            'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def validate_feedback_text(self, value):
        from django.utils.html import strip_tags
        cleaned = strip_tags(value).strip()
        if len(cleaned) < 5:
            raise serializers.ValidationError("Feedback text must be at least 5 characters long.")
        return cleaned

    def validate_suggestions(self, value):
        if value:
            from django.utils.html import strip_tags
            return strip_tags(value).strip()
        return value


class AdminAuditLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.CharField(source='admin_user.full_name', read_only=True, default='System')
    admin_email = serializers.CharField(source='admin_user.email', read_only=True, default='')

    class Meta:
        model = AdminAuditLog
        fields = [
            'id',
            'admin_user',
            'admin_name',
            'admin_email',
            'action_type',
            'target_entity',
            'target_id',
            'details',
            'ip_address',
            'created_at'
        ]
