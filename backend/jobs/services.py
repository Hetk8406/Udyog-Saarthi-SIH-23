"""
Job search and filtering business logic.
"""

from datetime import date
from django.db.models import Q
from .models import Job, JobStatus


def filter_jobs(query_params):
    """Filters published jobs using standard relational and text lookups."""
    queryset = Job.objects.filter(status=JobStatus.PUBLISHED).select_related('organization')

    # 1. Keyword search (title, description, responsibilities, organization name)
    search = query_params.get('search', '').strip()
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(responsibilities__icontains=search) |
            Q(organization__name__icontains=search)
        )

    # 2. Location filter (city or state)
    location = query_params.get('location', '').strip()
    if location:
        queryset = queryset.filter(
            Q(location_city__icontains=location) |
            Q(location_state__icontains=location)
        )

    # 3. Sector filter (government, psu, private)
    sector = query_params.get('sector', '').strip().lower()
    if sector and sector != 'all':
        queryset = queryset.filter(sector=sector)

    # 4. Work mode (on_site, remote, hybrid)
    work_mode = query_params.get('work_mode', '').strip().lower()
    if work_mode and work_mode != 'all':
        queryset = queryset.filter(work_mode=work_mode)

    # 5. Education level
    education = query_params.get('education', '').strip()
    if education and education != 'all':
        queryset = queryset.filter(minimum_education=education)

    # 6. Disability suitability
    disability = query_params.get('disability', '').strip()
    if disability and disability != 'all':
        # JSONField contains check
        queryset = queryset.filter(eligible_disabilities__contains=disability)

    # 7. Deadline active filter (default: only show open/upcoming jobs unless requested)
    show_expired = query_params.get('show_expired', 'false').lower() == 'true'
    if not show_expired:
        queryset = queryset.filter(application_deadline__gte=date.today())

    # Order by nearest deadline first
    return queryset.order_by('application_deadline', '-created_at')
