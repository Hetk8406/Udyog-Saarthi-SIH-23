from django.contrib import admin
from .models import JobApplication, ApplicationStatusHistory


class StatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('from_status', 'to_status', 'note', 'changed_by', 'created_at')


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'application_type', 'status', 'applied_at')
    list_filter = ('application_type', 'status')
    search_fields = ('candidate__user__full_name', 'candidate__user__email', 'job__title')
    inlines = [StatusHistoryInline]


@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('application', 'from_status', 'to_status', 'changed_by', 'created_at')
    list_filter = ('to_status',)
    search_fields = ('application__job__title', 'application__candidate__user__full_name')
