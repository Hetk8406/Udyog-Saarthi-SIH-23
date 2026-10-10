"""
Application submission, status transitions, and audit tracking service.
"""

from django.db import transaction
from django.core.exceptions import ValidationError
from .models import (
    JobApplication,
    ApplicationStatusHistory,
    ApplicationStatus,
    ApplicationType,
)
from jobs.models import Job
from profiles.models import CandidateProfile


def create_or_record_application(
    candidate: CandidateProfile,
    job: Job,
    application_type: str,
    accommodations: list,
    candidate_notes: str,
    user,
    document_ids: list = None,
) -> JobApplication:
    """Submits or records an application and creates initial history audit record."""
    if JobApplication.objects.filter(candidate=candidate, job=job).exists():
        raise ValidationError("You have already recorded an application for this job.")

    initial_status = (
        ApplicationStatus.SUBMITTED
        if application_type == ApplicationType.INTERNAL
        else ApplicationStatus.APPLIED
    )

    with transaction.atomic():
        app = JobApplication.objects.create(
            candidate=candidate,
            job=job,
            application_type=application_type,
            status=initial_status,
            accommodations_requested=accommodations or [],
            candidate_notes=candidate_notes or '',
        )

        if document_ids:
            from profiles.models import CandidateDocument
            CandidateDocument.objects.filter(
                owner=candidate,
                id__in=document_ids
            ).update(application=app)

        initial_note = (
            "Application submitted directly via Udyog Saarthi."
            if application_type == ApplicationType.INTERNAL
            else "Candidate confirmed external submission on official portal."
        )

        # Record initial status history row
        ApplicationStatusHistory.objects.create(
            application=app,
            from_status=ApplicationStatus.APP_STARTED,
            to_status=initial_status,
            note=initial_note,
            changed_by=user,
        )

    return app


def update_application_status(
    application: JobApplication,
    new_status: str,
    note: str,
    changed_by
) -> JobApplication:
    """Transitions application to a new milestone and saves an audit history entry."""
    valid_statuses = [choice[0] for choice in ApplicationStatus.choices]
    if new_status not in valid_statuses:
        raise ValidationError(f"Invalid status '{new_status}'.")

    old_status = application.status
    if old_status == new_status and not note:
        return application

    with transaction.atomic():
        application.status = new_status
        application.save(update_fields=['status', 'updated_at'])

        # Save history row on EVERY status change (PRD requirement)
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=new_status,
            note=note or f"Milestone updated to {application.get_status_display()}.",
            changed_by=changed_by,
        )

        # Dispatch notification to candidate
        try:
            from notifications.services import create_notification
            from notifications.models import NotificationType
            create_notification(
                user=application.candidate.user,
                notification_type=NotificationType.APPLICATION_STATUS,
                title=f"Application Update: {application.job.title}",
                message=f"Status for your application to {application.job.organization.name} updated to: {application.get_status_display()}.",
                link="/dashboard/applications"
            )
        except Exception:
            pass

    return application


def get_application_stage_summary(candidate: CandidateProfile) -> dict:
    """Computes high-level stage counters for candidate dashboard."""
    apps = JobApplication.objects.filter(candidate=candidate)
    total = apps.count()

    applied_count = apps.filter(
        status__in=[ApplicationStatus.APPLIED, ApplicationStatus.SUBMITTED]
    ).count()

    exam_count = apps.filter(
        status__in=[
            ApplicationStatus.ADMIT_CARD_RELEASED,
            ApplicationStatus.EXAM_SCHEDULED,
            ApplicationStatus.EXAM_ATTENDED,
            ApplicationStatus.RESULT_PUBLISHED,
        ]
    ).count()

    interview_count = apps.filter(
        status__in=[
            ApplicationStatus.INTERVIEW_SCHEDULED,
            ApplicationStatus.INTERVIEW_ATTENDED,
        ]
    ).count()

    selected_count = apps.filter(
        status__in=[ApplicationStatus.SELECTED, ApplicationStatus.PLACED]
    ).count()

    closed_count = apps.filter(
        status__in=[ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN, ApplicationStatus.EXPIRED]
    ).count()

    return {
        'total': total,
        'applied': applied_count,
        'exams': exam_count,
        'interviews': interview_count,
        'selected_or_placed': selected_count,
        'closed': closed_count,
    }
