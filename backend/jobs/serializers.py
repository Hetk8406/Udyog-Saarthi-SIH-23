from rest_framework import serializers
from .models import Organization, Job, SavedJob


class OrganizationSerializer(serializers.ModelSerializer):
    org_type_display = serializers.CharField(source='get_org_type_display', read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'org_type',
            'org_type_display',
            'website',
            'description',
            'verified',
        ]


class JobSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    organization_id = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        source='organization',
        write_only=True
    )
    sector_display = serializers.CharField(source='get_sector_display', read_only=True)
    work_mode_display = serializers.CharField(source='get_work_mode_display', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    minimum_education_display = serializers.CharField(source='get_minimum_education_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_saved = serializers.SerializerMethodField()
    is_applied = serializers.SerializerMethodField()
    application_id = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id',
            'organization',
            'organization_id',
            'title',
            'sector',
            'sector_display',
            'work_mode',
            'work_mode_display',
            'job_type',
            'job_type_display',
            'location_city',
            'location_state',
            'description',
            'responsibilities',
            'minimum_education',
            'minimum_education_display',
            'experience_required_months',
            'salary_display',
            'vacancies_total',
            'vacancies_pwd_reserved',
            'eligible_disabilities',
            'accessibility_facilities',
            'application_start_date',
            'application_deadline',
            'exam_date',
            'official_application_url',
            'status',
            'status_display',
            'is_demo_data',
            'is_saved',
            'is_applied',
            'application_id',
            'created_at',
            'updated_at',
        ]

    def get_is_saved(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Check if current user saved this job
        return SavedJob.objects.filter(user=request.user, job=obj).exists()

    def get_is_applied(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        from applications.models import JobApplication
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return False
        return JobApplication.objects.filter(candidate=profile, job=obj).exists()

    def get_application_id(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        from applications.models import JobApplication
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile:
            return None
        app = JobApplication.objects.filter(candidate=profile, job=obj).first()
        return str(app.id) if app else None


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)

    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'saved_at']
