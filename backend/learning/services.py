from datetime import datetime, timezone
from decimal import Decimal
from django.core.exceptions import ValidationError
from profiles.models import CandidateProfile
from .models import MockTest, Question, TestAttempt, TestAnswer, TimeMode


def start_test_attempt(
    candidate: CandidateProfile,
    mock_test: MockTest,
    time_mode: str = TimeMode.STANDARD
) -> TestAttempt:
    """
    Starts a new attempt or resumes an unsubmitted attempt for the candidate.
    """
    # Check if there is an in-progress unsubmitted attempt
    existing = TestAttempt.objects.filter(
        candidate=candidate,
        mock_test=mock_test,
        is_submitted=False
    ).first()

    if existing:
        return existing

    attempt = TestAttempt.objects.create(
        candidate=candidate,
        mock_test=mock_test,
        time_mode=time_mode,
        total_questions=mock_test.questions.count()
    )
    return attempt


def save_test_answer(
    attempt: TestAttempt,
    question_id: str,
    selected_option_id: str,
    is_marked_for_review: bool = False
) -> TestAnswer:
    """
    Saves or updates candidate's answer for a single question.
    """
    if attempt.is_submitted:
        raise ValidationError("Cannot update answers for an already submitted test.")

    try:
        question = Question.objects.get(id=question_id, mock_test=attempt.mock_test)
    except Question.DoesNotExist:
        raise ValidationError("Invalid question for this mock test.")

    # Check correctness at saving or evaluate on submit
    is_correct = (selected_option_id.upper() == question.correct_option_id.upper()) if selected_option_id else False

    answer, _ = TestAnswer.objects.update_or_create(
        attempt=attempt,
        question=question,
        defaults={
            'selected_option_id': selected_option_id,
            'is_correct': is_correct,
            'is_marked_for_review': is_marked_for_review,
        }
    )
    return answer


def evaluate_and_submit_attempt(
    attempt: TestAttempt,
    time_spent_seconds: int = 0
) -> TestAttempt:
    """
    Auto-evaluates mock test answers:
    - Calculates overall score and percentage
    - Tallies correct, incorrect, and unanswered counts
    - Computes subject-wise performance breakdown
    - Identifies weak subject for targeted practice recommendation
    """
    if attempt.is_submitted:
        return attempt

    mock_test = attempt.mock_test
    questions = mock_test.questions.all()
    total_questions = questions.count()

    # Pre-fetch recorded answers
    recorded_answers = {
        str(ans.question_id): ans
        for ans in attempt.answers.all()
    }

    total_marks_possible = sum(q.marks for q in questions) or 1
    raw_score = Decimal('0.00')
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    # Subject performance tracker:
    # { subject_name: {"total": int, "correct": int, "incorrect": int} }
    subject_stats: dict[str, dict] = {}

    for q in questions:
        q_id = str(q.id)
        subj = q.subject or "General"
        if subj not in subject_stats:
            subject_stats[subj] = {"total": 0, "correct": 0, "incorrect": 0}

        subject_stats[subj]["total"] += 1

        ans = recorded_answers.get(q_id)
        if not ans or not ans.selected_option_id:
            unanswered_count += 1
            continue

        if ans.selected_option_id.upper() == q.correct_option_id.upper():
            correct_count += 1
            raw_score += Decimal(str(q.marks))
            subject_stats[subj]["correct"] += 1
            ans.is_correct = True
            ans.save()
        else:
            incorrect_count += 1
            raw_score -= Decimal(str(q.negative_marks))
            subject_stats[subj]["incorrect"] += 1
            ans.is_correct = False
            ans.save()

    # Score cannot be less than zero
    if raw_score < Decimal('0.00'):
        raw_score = Decimal('0.00')

    score_percentage = Decimal(round((float(raw_score) / float(total_marks_possible)) * 100, 2))

    # Calculate subject-wise percentages
    subject_breakdown = {}
    weakest_subject = None
    lowest_pct = 101.0

    for subj, data in subject_stats.items():
        total_in_subj = data["total"]
        corr_in_subj = data["correct"]
        pct = round((corr_in_subj / total_in_subj) * 100, 1) if total_in_subj > 0 else 0.0

        subject_breakdown[subj] = {
            "total": total_in_subj,
            "correct": corr_in_subj,
            "incorrect": data["incorrect"],
            "percentage": pct
        }

        # Track lowest scoring subject
        if pct < lowest_pct:
            lowest_pct = pct
            weakest_subject = subj

    # Set weak subject suggestion if score in that subject is < 100%
    weak_subject_suggestion = f"{weakest_subject} Practice" if weakest_subject and lowest_pct < 100.0 else "General Revision"

    passed = score_percentage >= Decimal(str(mock_test.passing_percentage))

    attempt.score = raw_score
    attempt.score_percentage = score_percentage
    attempt.total_questions = total_questions
    attempt.correct_count = correct_count
    attempt.incorrect_count = incorrect_count
    attempt.unanswered_count = unanswered_count
    attempt.subject_breakdown = subject_breakdown
    attempt.weak_subject_suggestion = weak_subject_suggestion
    attempt.passed = passed
    attempt.is_submitted = True
    attempt.time_spent_seconds = time_spent_seconds
    attempt.completed_at = datetime.now(timezone.utc)
    attempt.save()

    return attempt
