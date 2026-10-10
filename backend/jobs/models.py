import uuid
from django.db import models
from django.conf import settings


class OrganizationType(models.TextChoices):
    GOVERNMENT_DEPT = 'government_dept', 'Government Department'
    PSU = 'psu', 'Public Sector Undertaking (PSU)'
    PRIVATE_SECTOR = 'private_sector', 'Private Sector'
    NGO = 'ngo', 'Non-Governmental Organization (NGO)'


class SectorType(models.TextChoices):
    GOVERNMENT = 'government', 'Government'
    PSU = 'psu', 'PSU'
    PRIVATE = 'private', 'Private Sector'


class WorkMode(models.TextChoices):
    ON_SITE = 'on_site', 'On-site Office'
    REMOTE = 'remote', 'Remote / Work From Home'
    HYBRID = 'hybrid', 'Hybrid'


class JobType(models.TextChoices):
    FULL_TIME = 'full_time', 'Full Time'
    PART_TIME = 'part_time', 'Part Time'
    CONTRACT = 'contract', 'Contract'
    APPRENTICESHIP = 'apprenticeship', 'Apprenticeship / Trainee'
    INTERNSHIP = 'internship', 'Internship'


class EducationLevel(models.TextChoices):
    TENTH = '10th_pass', '10th Standard Pass'
    TWELFTH = '12th_pass', '12th Standard Pass'
    DIPLOMA = 'iti_diploma', 'ITI / Diploma'
    GRADUATE = 'graduate', 'Graduate (Bachelor’s Degree)'
    POST_GRADUATE = 'post_graduate', 'Post Graduate (Master’s Degree)'
    ANY = 'any', 'Any Educational Background'


class JobStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    PUBLISHED = 'published', 'Published / Open'
    CLOSED = 'closed', 'Applications Closed'
    ARCHIVED = 'archived', 'Archived'


class Organization(models.Model):
    """Employer, Ministry, PSU, or hiring organization."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    org_type = models.CharField(
        max_length=30,
        choices=OrganizationType.choices,
        default=OrganizationType.GOVERNMENT_DEPT
    )
    website = models.URLField(blank=True, default='')
    description = models.TextField(blank=True, default='')
    verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_org_type_display()})"


class Job(models.Model):
    """Job vacancy with disability reservations and accessibility provisions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    title = models.CharField(max_length=255, db_index=True)
    sector = models.CharField(
        max_length=20,
        choices=SectorType.choices,
        default=SectorType.GOVERNMENT,
        db_index=True
    )
    work_mode = models.CharField(
        max_length=20,
        choices=WorkMode.choices,
        default=WorkMode.ON_SITE,
        db_index=True
    )
    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        default=JobType.FULL_TIME
    )
    location_city = models.CharField(max_length=100, db_index=True)
    location_state = models.CharField(max_length=100)

    description = models.TextField()
    responsibilities = models.TextField(blank=True, default='')
    minimum_education = models.CharField(
        max_length=20,
        choices=EducationLevel.choices,
        default=EducationLevel.GRADUATE
    )
    experience_required_months = models.PositiveIntegerField(
        default=0,
        help_text='0 indicates open to freshers'
    )
    salary_display = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='e.g. ₹25,000 - ₹35,000 / month or Pay Level 4'
    )

    # Vacancy counts & PwD reservations
    vacancies_total = models.PositiveIntegerField(default=1)
    vacancies_pwd_reserved = models.PositiveIntegerField(default=1)

    # Categories of disabilities eligible for this role
    eligible_disabilities = models.JSONField(
        default=list,
        blank=True,
        help_text='List of eligible disability types per PRD'
    )

    # Workstation / Exam accessibility facilities provided
    accessibility_facilities = models.JSONField(
        default=list,
        blank=True,
        help_text='e.g. Wheelchair Ramp, Screen reader workstation, Assistive software'
    )

    # Timeline & Official Application Link
    application_start_date = models.DateField()
    application_deadline = models.DateField(db_index=True)
    exam_date = models.DateField(null=True, blank=True)
    official_application_url = models.URLField(
        help_text='Official portal link to submit application or view official gazette notice'
    )

    status = models.CharField(
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.PUBLISHED,
        db_index=True
    )

    # Mark all development demo data clearly per PRD guidelines
    is_demo_data = models.BooleanField(
        default=True,
        help_text='Indicates this is simulated demo data and not a real government notification'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['application_deadline', '-created_at']

    def __str__(self):
        return f"{self.title} at {self.organization.name}"


class SavedJob(models.Model):
    """Candidate bookmarked jobs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_jobs'
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='saved_by_users'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.email} saved {self.job.title}"
