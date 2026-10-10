"""
Business logic and helpers for candidate profile calculations and management.
"""

from .models import CandidateProfile, AccessibilityProfile


def calculate_completion_percentage(profile: CandidateProfile) -> int:
    """Calculates and updates the profile completion score (0-100%)."""
    score = 0

    # 1. Personal details (up to 20%)
    if profile.date_of_birth and profile.gender:
        score += 10
    if profile.city and profile.state:
        score += 10

    # 2. Accessibility profile (up to 30%)
    if hasattr(profile, 'accessibility_profile'):
        acc = profile.accessibility_profile
        # Primary disability chosen
        if acc.primary_disability:
            score += 15
        # Functional difficulties / accommodation selected
        if acc.assistive_devices_used or acc.assistive_devices_required or acc.needs_scribe or acc.needs_extra_time_for_exams:
            score += 15

    # 3. Education (up to 20%)
    if profile.educations.exists():
        score += 20

    # 4. Skills (up to 15%)
    if profile.skills.exists():
        score += 15

    # 5. Career Preferences (up to 15%)
    if profile.preferred_sector or profile.preferred_work_mode != 'any' or profile.preferred_locations:
        score += 15

    # Cap between 0 and 100
    final_score = min(max(score, 5), 100)

    if profile.completion_percentage != final_score:
        profile.completion_percentage = final_score
        profile.save(update_fields=['completion_percentage'])

    return final_score


def get_or_create_candidate_profile(user) -> CandidateProfile:
    """Retrieves or creates candidate profile and attached accessibility record."""
    profile, _ = CandidateProfile.objects.get_or_create(user=user)
    if not hasattr(profile, 'accessibility_profile'):
        AccessibilityProfile.objects.get_or_create(candidate=profile)
    return profile
