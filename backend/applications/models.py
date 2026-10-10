import uuid
from django.db import models
from django.conf import settings
from jobs.models import Job
from profiles.models import CandidateProfile


class ApplicationType(models.TextChoices):
    INTERNAL = 'internal', 'Applied inside Udyog Saarthi'
    EXTERNAL_REDIRECT = 'external_redirect', 'Redirected to official site'


class ApplicationStatus(models.TextChoices):
    # Progression flow from PRD Section 12
    SAVED = 'saved', 'Saved'
    APP_STARTED = 'app_started', 'Application Started'
    APPLIED = 'applied', 'Applied'
    SUBMITTED = 'submitted', 'Application Submitted'
    ADMIT_CARD_RELEASED = 'admit_card_released', 'Admit Card Released'
    EXAM_SCHEDULED = 'exam_scheduled', 'Exam Scheduled'
    EXAM_ATTENDED = 'exam_attended', 'Exam Attended'
    RESULT_PUBLISHED = 'result_published', 'Result Published'
    INTERVIEW_SCHEDULED = 'interview_scheduled', 'Interview Scheduled'
    INTERVIEW_ATTENDED = 'interview_attended', 'Interview Attended'
    SELECTED = 'selected', 'Selected'
    PLACED = 'placed', 'Placed'

    # Alternate terminal statuses
    REJECTED = 'rejected', 'Rejected'
    WITHDRAWN = 'withdrawn', 'Withdrawn'
    EXPIRED = 'expired', 'Expired'


class JobApplication(models.Model):
    """Candidate job application tracking either internal submission or official external redirect."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    application_type = models.CharField(
        max_length=30,
        choices=ApplicationType.choices,
        default=ApplicationType.INTERNAL,
        help_text='Indicates if submitted through portal or recorded after external redirection'
    )
    status = models.CharField(
        max_length=30,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.SUBMITTED,
        db_index=True
    )

    # Accommodations candidate selected specifically for this application
    accommodations_requested = models.JSONField(
        default=list,
        blank=True,
        help_text='e.g. Scribe for exam, Ground floor seating, Extra time'
    )

    # External tracking info or candidate notes
    candidate_notes = models.TextField(
        blank=True,
        default='',
        help_text='Candidate notes (e.g. External Roll No, Application Number, Exam Center)'
    )

    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'candidate')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.candidate.user.full_name} -> {self.job.title} ({self.get_status_display()})"


class ApplicationStatusHistory(models.Model):
    """Audit history recorded on every milestone or status change."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    note = models.TextField(blank=True, default='')
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application.job.title}: {self.from_status} -> {self.to_status} at {self.created_at}"
