"""
Service 2: Weak-Subject Learning Recommendation Service
========================================================
Rules & Principles:
1. Analyzes candidate's mock-test attempts and subject-breakdown percentages.
2. Identifies subject areas scoring below 70% or the lowest scoring subject.
3. Recommends relevant courses and learning resources specifically targeting those weak spots.
4. If no attempts exist yet, recommends fundamental courses for government exam preparation.
"""

from typing import List, Dict, Any
from django.db.models import Avg
from profiles.models import CandidateProfile
from learning.models import TestAttempt, Course, LearningResource


def get_learning_recommendations_for_candidate(candidate: CandidateProfile) -> Dict[str, Any]:
    """
    Analyzes candidate's completed mock tests and recommends tailored study modules.
    """
    attempts = TestAttempt.objects.filter(
        candidate=candidate,
        is_submitted=True
    ).order_by('-completed_at')

    # Subject performance aggregators
    subject_scores: Dict[str, List[float]] = {}
    total_attempts_count = attempts.count()

    for att in attempts:
        breakdown = att.subject_breakdown or {}
        for subj, stats in breakdown.items():
            if isinstance(stats, dict) and 'percentage' in stats:
                pct = float(stats['percentage'])
                subject_scores.setdefault(subj, []).append(pct)

    # Calculate average per subject
    weak_subjects = []
    subject_averages: Dict[str, float] = {}

    for subj, pcts in subject_scores.items():
        avg_score = round(sum(pcts) / len(pcts), 1)
        subject_averages[subj] = avg_score
        if avg_score < 70.0:
            weak_subjects.append({
                "subject": subj,
                "average_percentage": avg_score,
                "needs_practice": True
            })

    # Sort weak subjects by lowest score first
    weak_subjects.sort(key=lambda x: x['average_percentage'])

    # Determine recommended target subject
    target_subject = weak_subjects[0]['subject'] if weak_subjects else None

    # Find relevant courses
    recommended_courses: List[Dict[str, Any]] = []

    if target_subject:
        # Match courses based on weak subject keyword
        kw = target_subject.lower()
        matched_courses = Course.objects.filter(
            is_published=True
        ).filter(
            title__icontains=kw
        ) | Course.objects.filter(
            is_published=True,
            category__icontains=kw
        )

        for c in matched_courses[:3]:
            recommended_courses.append({
                "id": str(c.id),
                "title": c.title,
                "category": c.get_category_display(),
                "level": c.get_level_display(),
                "reason": f"Directly targets improvement in {target_subject} (current average: {subject_averages.get(target_subject, 0)}%)"
            })

    # Fallback if no specific weak subject courses found or no tests taken yet
    if not recommended_courses:
        general_courses = Course.objects.filter(is_published=True)[:3]
        for c in general_courses:
            recommended_courses.append({
                "id": str(c.id),
                "title": c.title,
                "category": c.get_category_display(),
                "level": c.get_level_display(),
                "reason": "Core foundation course recommended for competitive exam preparation"
            })

    # Also suggest practical learning resources
    recommended_resources: List[Dict[str, Any]] = []
    resources_qs = LearningResource.objects.all()
    if target_subject:
        resources_qs = resources_qs.filter(title__icontains=target_subject.lower()) | resources_qs

    for r in resources_qs[:3]:
        recommended_resources.append({
            "id": str(r.id),
            "title": r.title,
            "resource_type": r.get_resource_type_display(),
            "course_title": r.course.title if r.course else "Self-study Guide"
        })

    return {
        "candidate_id": str(candidate.id),
        "total_tests_taken": total_attempts_count,
        "subject_performance": subject_averages,
        "identified_weak_areas": weak_subjects,
        "primary_focus_subject": target_subject or "General Aptitude",
        "recommended_courses": recommended_courses,
        "recommended_resources": recommended_resources,
        "advice_summary": (
            f"Based on your recent tests, focusing on {target_subject} practice will provide the highest score boost."
            if target_subject else
            "Take mock tests in Reasoning, English, and Aptitude to receive personalized diagnostic recommendations."
        )
    }
