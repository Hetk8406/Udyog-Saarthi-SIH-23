import uuid
from django.db import models
from django.conf import settings
from profiles.models import CandidateProfile
from jobs.models import Job


class TicketCategory(models.TextChoices):
    APPLICATION_HELP = 'application_help', 'Job Application Help'
    EXAM_ASSISTANCE = 'exam_assistance', 'Examination Assistance'
    ACCESSIBILITY_NEEDS = 'accessibility_needs', 'Accessibility Assistance'
    COUNSELLING = 'counselling', 'Counselling'
    TECHNICAL = 'technical', 'Technical Support'
    COACH_REQUEST = 'coach_request', 'Job-Coach Assistance'
    INTERVIEW_ASSISTANCE = 'interview_assistance', 'Interview Assistance'


class TicketStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    ASSIGNED = 'assigned', 'Assigned'
    IN_PROGRESS = 'in_progress', 'In Progress'
    RESOLVED = 'resolved', 'Resolved'
    CLOSED = 'closed', 'Closed'


class SupportTicket(models.Model):
    """Support request / grievance ticket submitted by a candidate or guardian."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='support_tickets'
    )
    # The user who opened the ticket (could be the candidate or their authorized guardian)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_support_tickets'
    )
    category = models.CharField(
        max_length=40,
        choices=TicketCategory.choices,
        default=TicketCategory.APPLICATION_HELP
    )
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN,
        db_index=True
    )
    assigned_coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_support_tickets',
        limit_choices_to={'role': 'coach'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_status_display()}] {self.subject} ({self.candidate.user.full_name})"


class SupportMessage(models.Model):
    """Conversation reply inside a support ticket."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_messages'
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message by {self.sender.full_name} on {self.ticket.subject}"


class JobCoachAssignment(models.Model):
    """Assignment connecting a Job Coach to a Candidate."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coach_assignments',
        limit_choices_to={'role': 'coach'}
    )
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='coach_assignments'
    )
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('coach', 'candidate')
        ordering = ['-assigned_at']

    def __str__(self):
        return f"Coach {self.coach.full_name} -> {self.candidate.user.full_name}"


class CoachNote(models.Model):
    """Confidential guidance/counselling observation written by a Job Coach."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='written_coach_notes',
        limit_choices_to={'role': 'coach'}
    )
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='coach_notes'
    )
    title = models.CharField(max_length=200, blank=True, default='Counseling Note')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on {self.candidate.user.full_name} by {self.coach.full_name}"


class CoachJobRecommendation(models.Model):
    """Job recommended by a Job Coach directly to an assigned Candidate."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_job_recommendations'
    )
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='coach_recommendations'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='coach_recommendations'
    )
    recommendation_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('coach', 'candidate', 'job')
        ordering = ['-created_at']

    def __str__(self):
        return f"Rec: {self.job.title} to {self.candidate.user.full_name}"


class GuardianAccess(models.Model):
    """
    Candidate grants access to a Parent / Guardian with granular permission toggles:
    'Guardians only see what the candidate has allowed.'
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guardian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='guardian_links',
        limit_choices_to={'role': 'guardian'}
    )
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='guardian_delegations'
    )
    relationship = models.CharField(
        max_length=50,
        default='Parent',
        choices=[
            ('Parent', 'Parent'),
            ('Guardian', 'Legal Guardian'),
            ('Sibling', 'Sibling'),
            ('Spouse', 'Spouse'),
            ('Other', 'Other Caregiver'),
        ]
    )
    allow_view_profile = models.BooleanField(
        default=True,
        help_text="Allows guardian to view basic educational and personal profile"
    )
    allow_view_applications = models.BooleanField(
        default=True,
        help_text="Allows guardian to view job applications and interview/exam timeline"
    )
    allow_view_support_tickets = models.BooleanField(
        default=True,
        help_text="Allows guardian to see support tickets or open tickets on candidate's behalf"
    )
    allow_view_learning_progress = models.BooleanField(
        default=True,
        help_text="Allows guardian to see mock test scores and learning courses"
    )
    allow_view_documents = models.BooleanField(
        default=False,
        help_text="Allows guardian to view uploaded candidate documents (resume, certificates)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('guardian', 'candidate')
        ordering = ['-created_at']

    def __str__(self):
        return f"Guardian {self.guardian.full_name} for {self.candidate.user.full_name}"


class SuccessStory(models.Model):
    """
    Inspiring career achievements of PwD candidates (PRD Section 18).
    Always respectful, dignified, and authentic without sensationalizing.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate_name = models.CharField(max_length=150)
    job_title = models.CharField(max_length=150)
    organization_name = models.CharField(max_length=200)
    sector = models.CharField(max_length=50, default='Government / PSU')
    journey = models.TextField(help_text="Candidate preparation and career path journey")
    challenges_faced = models.TextField(help_text="Challenges navigated (e.g. accessibility, exam centers)")
    how_support_helped = models.TextField(help_text="How Udyog Saarthi / Job Coach guidance assisted")
    outcome = models.CharField(max_length=255, help_text="e.g. Selected as Junior Assistant, Level 4")
    is_featured = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.candidate_name} - {self.job_title} at {self.organization_name}"


class Feedback(models.Model):
    """
    User ratings and feedback (PRD Section 19).
    Can be submitted anonymously or with user account.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedbacks'
    )
    rating = models.PositiveSmallIntegerField(
        choices=[(1, '1 Star'), (2, '2 Stars'), (3, '3 Stars'), (4, '4 Stars'), (5, '5 Stars')],
        default=5
    )
    category = models.CharField(
        max_length=50,
        choices=[
            ('general', 'General Experience'),
            ('accessibility', 'Accessibility & Screen Reader'),
            ('job_discovery', 'Job Discovery & Filtering'),
            ('learning_tests', 'Mock Tests & Learning Content'),
            ('coaching_support', 'Job Coach & Support Desk'),
            ('suggestions', 'Feature Suggestion'),
        ],
        default='general'
    )
    feedback_text = models.TextField()
    suggestions = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.full_name if self.user else "Anonymous"
        return f"Feedback ({self.rating}★) by {user_str} on {self.category}"
