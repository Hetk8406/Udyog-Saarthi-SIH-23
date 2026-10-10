import uuid
from django.db import models
from profiles.models import CandidateProfile


class CourseCategory(models.TextChoices):
    GOVT_EXAM_PREP = 'govt_exam_prep', 'Government Exam Preparation'
    REASONING = 'reasoning', 'Reasoning & Mental Ability'
    APTITUDE = 'aptitude', 'Quantitative Aptitude'
    ENGLISH = 'english', 'English & Comprehension'
    COMPUTER_SKILLS = 'computer_skills', 'Computer & Digital Skills'
    COMMUNICATION = 'communication', 'Communication & Soft Skills'
    INTERVIEW_PREP = 'interview_prep', 'Interview Preparation'
    WORKPLACE_SKILLS = 'workplace_skills', 'Workplace Accessibility & Skills'


class CourseLevel(models.TextChoices):
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'


class ResourceType(models.TextChoices):
    ARTICLE = 'article', 'Article / Reading Note'
    VIDEO_LINK = 'video_link', 'Accessible Video with Captions'
    STUDY_GUIDE = 'study_guide', 'Study Guide / Summary'
    MODEL_PAPER = 'model_paper', 'Model Question Paper'


class TimeMode(models.TextChoices):
    STANDARD = 'standard', 'Standard Time (1.0x)'
    COMPENSATORY = 'compensatory', 'Compensatory Extra Time (+20 min/hr, 1.33x)'
    EXTENDED = 'extended', 'Relaxed Practice Time (1.5x)'
    UNTIMED = 'untimed', 'Untimed Practice Mode (Timer Off)'


class Course(models.Model):
    """
    Structured learning track or syllabus unit.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50,
        choices=CourseCategory.choices,
        default=CourseCategory.GOVT_EXAM_PREP
    )
    description = models.TextField(help_text='Clear plain-language overview of what this course covers')
    level = models.CharField(max_length=20, choices=CourseLevel.choices, default=CourseLevel.BEGINNER)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'title']

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class LearningResource(models.Model):
    """
    Individual learning lesson, article, audio/video reference, or practice material.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resources'
    )
    title = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50,
        choices=CourseCategory.choices,
        default=CourseCategory.GOVT_EXAM_PREP
    )
    resource_type = models.CharField(
        max_length=30,
        choices=ResourceType.choices,
        default=ResourceType.ARTICLE
    )
    content_text = models.TextField(
        help_text='Semantic markdown or plain text readable by screen readers'
    )
    external_url = models.URLField(
        blank=True,
        default='',
        help_text='Optional external accessible learning link or video'
    )
    accessibility_notes = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='e.g. Screen reader compatible, Plain text summary, Audio transcript available'
    )
    estimated_minutes = models.PositiveIntegerField(
        default=10,
        help_text='Estimated read or study duration in minutes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} [{self.get_resource_type_display()}]"


class MockTest(models.Model):
    """
    Simulated competitive exam or practice test with timer and scoring.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    category = models.CharField(
        max_length=50,
        choices=CourseCategory.choices,
        default=CourseCategory.GOVT_EXAM_PREP
    )
    description = models.TextField(help_text='Brief overview of test subjects and target exams')
    instructions = models.TextField(
        help_text='Plain-language instructions on exam pattern, timing, and navigation'
    )
    duration_minutes = models.PositiveIntegerField(
        default=30,
        help_text='Base examination duration in minutes for standard timing'
    )
    total_marks = models.PositiveIntegerField(default=100)
    passing_percentage = models.PositiveIntegerField(default=40)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.duration_minutes} mins)"


class Question(models.Model):
    """
    Single multiple-choice question in a mock test with options and explanation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mock_test = models.ForeignKey(MockTest, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField(help_text='Accessible question statement')
    subject = models.CharField(
        max_length=100,
        help_text='Subject area e.g. Reasoning, Quantitative Aptitude, English, General Awareness'
    )
    marks = models.PositiveIntegerField(default=1)
    negative_marks = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    # List of options: [{"id": "A", "text": "Choice 1"}, {"id": "B", "text": "Choice 2"}]
    options = models.JSONField(help_text='Array of option objects with id and text')
    correct_option_id = models.CharField(max_length=10, help_text='ID of the correct option: A, B, C, or D')
    explanation = models.TextField(help_text='Step-by-step accessible explanation of the solution')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Q: {self.question_text[:50]}... ({self.subject})"


class TestAttempt(models.Model):
    """
    A candidate's attempt at taking a mock test, including auto-evaluation results.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mock_test = models.ForeignKey(MockTest, on_delete=models.CASCADE, related_name='attempts')
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name='mock_test_attempts')
    time_mode = models.CharField(
        max_length=20,
        choices=TimeMode.choices,
        default=TimeMode.STANDARD,
        help_text='Timing accommodation chosen by candidate (Standard, Compensatory, Relaxed, or Untimed)'
    )
    time_spent_seconds = models.PositiveIntegerField(default=0)
    is_submitted = models.BooleanField(default=False)
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    score_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    total_questions = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveIntegerField(default=0)
    incorrect_count = models.PositiveIntegerField(default=0)
    unanswered_count = models.PositiveIntegerField(default=0)
    # Subject breakdown format:
    # {"Reasoning": {"total": 5, "correct": 4, "incorrect": 1, "percentage": 80.0}, ...}
    subject_breakdown = models.JSONField(default=dict, blank=True)
    weak_subject_suggestion = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Recommended subject to practice based on lowest score percentage'
    )
    passed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        status = "Completed" if self.is_submitted else "In Progress"
        return f"{self.candidate.user.email} - {self.mock_test.title} ({status})"


class TestAnswer(models.Model):
    """
    Candidate's recorded answer for a specific question during a test attempt.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option_id = models.CharField(max_length=10, blank=True, default='')
    is_correct = models.BooleanField(default=False)
    is_marked_for_review = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Attempt {self.attempt.id} - Q {self.question.id}: {self.selected_option_id}"
