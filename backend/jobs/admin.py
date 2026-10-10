from django.contrib import admin
from .models import Organization, Job, SavedJob


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'org_type', 'verified', 'created_at')
    search_fields = ('name',)
    list_filter = ('org_type', 'verified')


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'organization', 'sector', 'location_city', 'work_mode', 'application_deadline', 'status', 'is_demo_data')
    list_filter = ('sector', 'work_mode', 'status', 'minimum_education', 'is_demo_data')
    search_fields = ('title', 'organization__name', 'location_city')
    date_hierarchy = 'application_deadline'


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'saved_at')
    search_fields = ('user__email', 'job__title')
