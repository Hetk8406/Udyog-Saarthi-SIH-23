import uuid
from django.db import models
from django.conf import settings


class DisabilityType(models.TextChoices):
    """Disability categories recognized under the RPwD Act / PRD guidelines.
    Easily extensible for any additional category."""
    INTELLECTUAL = 'intellectual_disability', 'Intellectual Disability'
    AUTISM = 'autism_spectrum', 'Autism Spectrum Disorder'
    MULTIPLE = 'multiple_disabilities', 'Multiple Disabilities'
    MENTAL_ILLNESS = 'mental_illness', 'Mental Illness'
    SPECIFIC_LEARNING = 'specific_learning', 'Specific Learning Disabilities'
    LOCOMOTOR = 'locomotor', 'Locomotor Disability'
    VISUAL = 'visual_impairment', 'Visual Impairment (Blindness / Low Vision)'
    HEARING = 'hearing_impairment', 'Hearing Impairment (Deaf / Hard of Hearing)'
    SPEECH_LANGUAGE = 'speech_language', 'Speech and Language Disability'
    OTHER = 'other', 'Other Disability'


class DifficultyLevel(models.TextChoices):
    """Washington Group standard functional difficulty levels (self-reported)."""
    NONE = 'none', 'No difficulty'
    SOME = 'some_difficulty', 'Some difficulty'
    A_LOT = 'lot_of_difficulty', 'A lot of difficulty'
    CANNOT_DO = 'cannot_do_at_all', 'Cannot do at all'


class CandidateProfile(models.Model):
    """Primary profile for a candidate containing personal details and preferences."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_profile'
    )

    # Personal Information
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        blank=True,
        default='',
        choices=[
            ('male', 'Male'),
            ('female', 'Female'),
            ('other', 'Other'),
            ('prefer_not_to_say', 'Prefer not to say'),
        ]
    )
    alternate_phone = models.CharField(max_length=20, blank=True, default='')
    address_line = models.CharField(max_length=255, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    pincode = models.CharField(max_length=10, blank=True, default='')
    bio = models.TextField(blank=True, default='')

    # Career Preferences
    preferred_sector = models.CharField(
        max_length=20,
        default='any',
        choices=[
            ('govt', 'Government Departments'),
            ('psu', 'Public Sector Undertakings (PSUs)'),
            ('private', 'Private Sector (Equal Opportunity)'),
            ('any', 'Any / Open to all sectors'),
        ]
    )
    preferred_work_mode = models.CharField(
        max_length=20,
        default='any',
        choices=[
            ('on_site', 'On-site Office'),
            ('remote', 'Work From Home / Remote'),
            ('hybrid', 'Hybrid (Office + Remote)'),
            ('any', 'Any mode'),
        ]
    )
    preferred_locations = models.JSONField(default=list, blank=True)
    preferred_job_categories = models.JSONField(default=list, blank=True)
    expected_salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Calculated completion percentage (0 - 100)
    completion_percentage = models.PositiveSmallIntegerField(default=10)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Candidate Profile: {self.user.full_name} ({self.user.email})"


class AccessibilityProfile(models.Model):
    """Accessibility, disability category, functional difficulties, and accommodation needs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.OneToOneField(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='accessibility_profile'
    )

    # Disability Category & percentage
    primary_disability = models.CharField(
        max_length=50,
        choices=DisabilityType.choices,
        default=DisabilityType.OTHER,
        help_text='Primary disability classification'
    )
    disability_percentage = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text='Certified disability percentage (if applicable)'
    )

    # UDID Information - private and sensitive
    udid_number = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text='Unique Disability Identity Card number (kept confidential)'
    )
    udid_verification_status = models.CharField(
        max_length=20,
        default='not_provided',
        choices=[
            ('not_provided', 'Not Provided'),
            ('self_declared', 'Self Declared'),
            ('verified', 'Verified'),
        ]
    )

    # Functional Difficulties (Washington Group Extended Set)
    # Stored as user selections without medical diagnoses
    difficulty_seeing = models.CharField(
        max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.NONE
    )
    difficulty_hearing = models.CharField(
        max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.NONE
    )
    difficulty_walking_mobility = models.CharField(
        max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.NONE
    )
    difficulty_remembering_concentrating = models.CharField(
        max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.NONE
    )
    difficulty_self_care = models.CharField(
        max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.NONE
    )
    difficulty_communicating = models.CharField(
        max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.NONE
    )
    difficulty_upper_body = models.CharField(
        max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.NONE
    )

    # Assistive Devices
    assistive_devices_used = models.JSONField(
        default=list,
        blank=True,
        help_text='List of assistive devices candidate currently uses'
    )
    assistive_devices_required = models.JSONField(
        default=list,
        blank=True,
        help_text='List of assistive devices candidate needs at work or during exam'
    )

    # Human Assistance & Exam Accommodations
    needs_scribe = models.BooleanField(default=False)
    needs_sign_language_interpreter = models.BooleanField(default=False)
    needs_personal_attendant = models.BooleanField(default=False)
    needs_extra_time_for_exams = models.BooleanField(default=False)
    needs_ground_floor_access = models.BooleanField(default=False)
    other_assistance_notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Accessibility Profile for {self.candidate.user.full_name}"


class Education(models.Model):
    """Academic qualifications of a candidate."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='educations'
    )
    qualification = models.CharField(
        max_length=100,
        help_text='e.g. 10th Standard, 12th Standard, Bachelor of Arts, ITI Certificate'
    )
    institution = models.CharField(max_length=200)
    board_or_university = models.CharField(max_length=200, blank=True, default='')
    year_of_passing = models.PositiveIntegerField()
    percentage_or_cgpa = models.CharField(max_length=20, blank=True, default='')
    specialization = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        ordering = ['-year_of_passing']

    def __str__(self):
        return f"{self.qualification} - {self.institution}"


class Skill(models.Model):
    """Skills added by a candidate."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='skills'
    )
    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=30,
        default='general',
        choices=[
            ('technical', 'Technical / IT'),
            ('computer', 'Computer & Office Software'),
            ('communication', 'Communication & Language'),
            ('vocational', 'Vocational / Handicraft'),
            ('soft_skill', 'Workplace Soft Skills'),
            ('general', 'General'),
        ]
    )
    proficiency = models.CharField(
        max_length=20,
        default='intermediate',
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
        ]
    )

    def __str__(self):
        return f"{self.name} ({self.proficiency})"


class Training(models.Model):
    """Training programs or certifications completed by a candidate."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='trainings'
    )
    course_name = models.CharField(max_length=200)
    institution = models.CharField(max_length=200)
    certificate_id = models.CharField(max_length=100, blank=True, default='')
    completion_year = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.course_name} by {self.institution}"


class Experience(models.Model):
    """Work experience or apprenticeship records."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='experiences'
    )
    organization = models.CharField(max_length=200)
    role_title = models.CharField(max_length=150)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.role_title} at {self.organization}"


class DocumentType(models.TextChoices):
    RESUME = 'resume', 'Resume / Curriculum Vitae'
    CERTIFICATE = 'certificate', 'Education / Training Certificate'
    OTHER = 'other', 'Other Supporting Document'


class CandidateDocument(models.Model):
    """
    Candidate uploaded documents (resumes, certificates, other supporting documents).
    Files are stored under random UUID-based keys in private storage (never public URLs).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        default=DocumentType.RESUME
    )
    original_filename = models.CharField(max_length=255)
    stored_key = models.CharField(max_length=255, unique=True)
    content_type = models.CharField(max_length=100)
    size = models.PositiveIntegerField(help_text="File size in bytes")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    application = models.ForeignKey(
        'applications.JobApplication',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attached_documents'
    )

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_filename} ({self.get_document_type_display()}) - {self.owner.user.full_name}"


from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=CandidateDocument)
def cleanup_document_file_on_delete(sender, instance, **kwargs):
    """Purge file from physical/cloud storage when database record is deleted."""
    try:
        from .storage import document_storage
        document_storage.delete_file(instance.stored_key)
    except Exception:
        pass

