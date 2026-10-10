from django.contrib import admin
from .models import (
    CandidateProfile,
    AccessibilityProfile,
    Education,
    Skill,
    Training,
    Experience,
)


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'state', 'preferred_sector', 'completion_percentage', 'created_at')
    search_fields = ('user__full_name', 'user__email', 'city', 'state')
    list_filter = ('preferred_sector', 'preferred_work_mode')


@admin.register(AccessibilityProfile)
class AccessibilityProfileAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'primary_disability', 'disability_percentage', 'needs_scribe', 'needs_extra_time_for_exams')
    search_fields = ('candidate__user__full_name', 'candidate__user__email')
    list_filter = ('primary_disability', 'needs_scribe', 'needs_extra_time_for_exams')


admin.site.register(Education)
admin.site.register(Skill)
admin.site.register(Training)
admin.site.register(Experience)
