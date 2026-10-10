from rest_framework import serializers
from .models import (
    Course,
    LearningResource,
    MockTest,
    Question,
    TestAttempt,
    TestAnswer
)


class LearningResourceSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    resource_type_display = serializers.CharField(source='get_resource_type_display', read_only=True)

    class Meta:
        model = LearningResource
        fields = [
            'id',
            'course',
            'title',
            'category',
            'category_display',
            'resource_type',
            'resource_type_display',
            'content_text',
            'external_url',
            'accessibility_notes',
            'estimated_minutes',
            'created_at',
        ]


class CourseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    resources = LearningResourceSerializer(many=True, read_only=True)
    resource_count = serializers.IntegerField(source='resources.count', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'category',
            'category_display',
            'description',
            'level',
            'level_display',
            'resource_count',
            'resources',
            'created_at',
        ]


class MockTestListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = MockTest
        fields = [
            'id',
            'title',
            'category',
            'category_display',
            'description',
            'instructions',
            'duration_minutes',
            'total_marks',
            'passing_percentage',
            'question_count',
            'created_at',
        ]

    def get_question_count(self, obj) -> int:
        count = getattr(obj, 'question_count', None)
        if count is not None:
            return count
        return obj.questions.count()


class QuestionTakingSerializer(serializers.ModelSerializer):
    """
    Serializer used WHILE taking the test:
    Hides correct_option_id and explanation to preserve exam integrity.
    """
    class Meta:
        model = Question
        fields = [
            'id',
            'question_text',
            'subject',
            'marks',
            'negative_marks',
            'options',
            'order',
        ]


class QuestionReviewSerializer(serializers.ModelSerializer):
    """
    Serializer used AFTER test submission:
    Reveals correct_option_id and solution explanation.
    """
    class Meta:
        model = Question
        fields = [
            'id',
            'question_text',
            'subject',
            'marks',
            'negative_marks',
            'options',
            'correct_option_id',
            'explanation',
            'order',
        ]


class TestAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAnswer
        fields = [
            'id',
            'question',
            'selected_option_id',
            'is_correct',
            'is_marked_for_review',
            'answered_at',
        ]


class SaveAnswerPayloadSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    selected_option_id = serializers.CharField(allow_blank=True, default='')
    is_marked_for_review = serializers.BooleanField(default=False)


class SubmitAttemptPayloadSerializer(serializers.Serializer):
    time_spent_seconds = serializers.IntegerField(default=0, min_value=0)


class TestAttemptDetailSerializer(serializers.ModelSerializer):
    mock_test = MockTestListSerializer(read_only=True)
    answers = TestAnswerSerializer(many=True, read_only=True)
    questions = serializers.SerializerMethodField()

    class Meta:
        model = TestAttempt
        fields = [
            'id',
            'mock_test',
            'time_mode',
            'time_spent_seconds',
            'is_submitted',
            'score',
            'score_percentage',
            'total_questions',
            'correct_count',
            'incorrect_count',
            'unanswered_count',
            'subject_breakdown',
            'weak_subject_suggestion',
            'passed',
            'started_at',
            'completed_at',
            'answers',
            'questions',
        ]

    def get_questions(self, obj):
        questions = obj.mock_test.questions.all()
        # If test is submitted, return questions with correct answer and explanation for review
        if obj.is_submitted:
            return QuestionReviewSerializer(questions, many=True).data
        # Otherwise return safe taking format
        return QuestionTakingSerializer(questions, many=True).data
