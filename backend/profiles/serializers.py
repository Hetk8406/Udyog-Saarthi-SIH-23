from rest_framework import serializers
from .models import (
    CandidateProfile,
    AccessibilityProfile,
    Education,
    Skill,
    Training,
    Experience,
    CandidateDocument,
)
from accounts.serializers import UserSerializer


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = [
            'id',
            'qualification',
            'institution',
            'board_or_university',
            'year_of_passing',
            'percentage_or_cgpa',
            'specialization',
        ]


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = [
            'id',
            'name',
            'category',
            'proficiency',
        ]


class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = [
            'id',
            'course_name',
            'institution',
            'certificate_id',
            'completion_year',
        ]


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = [
            'id',
            'organization',
            'role_title',
            'start_date',
            'end_date',
            'is_current',
            'description',
        ]


class AccessibilityProfileSerializer(serializers.ModelSerializer):
    primary_disability_display = serializers.CharField(
        source='get_primary_disability_display', read_only=True
    )

    class Meta:
        model = AccessibilityProfile
        fields = [
            'id',
            'primary_disability',
            'primary_disability_display',
            'disability_percentage',
            'udid_number',
            'udid_verification_status',
            'difficulty_seeing',
            'difficulty_hearing',
            'difficulty_walking_mobility',
            'difficulty_remembering_concentrating',
            'difficulty_self_care',
            'difficulty_communicating',
            'difficulty_upper_body',
            'assistive_devices_used',
            'assistive_devices_required',
            'needs_scribe',
            'needs_sign_language_interpreter',
            'needs_personal_attendant',
            'needs_extra_time_for_exams',
            'needs_ground_floor_access',
            'other_assistance_notes',
        ]

    def to_representation(self, instance):
        """Strict Privacy Guard: UDID is only visible to the profile owner."""
        data = super().to_representation(instance)
        request = self.context.get('request')

        # If user is not the profile owner, strip out UDID
        if not request or not request.user.is_authenticated or request.user != instance.candidate.user:
            data['udid_number'] = None

        return data


class CandidateProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    accessibility_profile = AccessibilityProfileSerializer(read_only=True)
    educations = EducationSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    trainings = TrainingSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)

    class Meta:
        model = CandidateProfile
        fields = [
            'id',
            'user',
            'date_of_birth',
            'gender',
            'alternate_phone',
            'address_line',
            'city',
            'state',
            'pincode',
            'bio',
            'preferred_sector',
            'preferred_work_mode',
            'preferred_locations',
            'preferred_job_categories',
            'expected_salary_min',
            'completion_percentage',
            'accessibility_profile',
            'educations',
            'skills',
            'trainings',
            'experiences',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'completion_percentage', 'created_at', 'updated_at']


class CandidatePersonalInfoUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating personal details and career preferences."""
    class Meta:
        model = CandidateProfile
        fields = [
            'date_of_birth',
            'gender',
            'alternate_phone',
            'address_line',
            'city',
            'state',
            'pincode',
            'bio',
            'preferred_sector',
            'preferred_work_mode',
            'preferred_locations',
            'preferred_job_categories',
            'expected_salary_min',
        ]


class CandidateDocumentSerializer(serializers.ModelSerializer):
    """Public serializer for uploaded candidate documents."""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    formatted_size = serializers.SerializerMethodField()

    class Meta:
        model = CandidateDocument
        fields = [
            'id',
            'document_type',
            'document_type_display',
            'original_filename',
            'content_type',
            'size',
            'formatted_size',
            'uploaded_at',
            'application',
        ]
        read_only_fields = [
            'id',
            'document_type_display',
            'original_filename',
            'content_type',
            'size',
            'formatted_size',
            'uploaded_at',
        ]

    def get_formatted_size(self, obj) -> str:
        size_bytes = obj.size
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{round(size_bytes / 1024, 1)} KB"
        else:
            return f"{round(size_bytes / (1024 * 1024), 2)} MB"

