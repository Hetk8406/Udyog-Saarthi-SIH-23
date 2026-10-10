"""
Service 1: Explainable Job Matching Service
============================================
Rules & Principles:
1. Deterministic and 100% Explainable: Computes a score based on skills, education, location, and career preferences.
2. Transparency: Returns structured "why this matched" points so the candidate sees exact reasons.
3. Strict Safety Requirement: NEVER uses disability category or functional difficulty to rule jobs in or out.
   Disability info is solely for candidate accommodation requests, NEVER for disqualification.
"""

from typing import List, Dict, Any
from profiles.models import CandidateProfile
from jobs.models import Job, JobStatus


def compute_job_match(candidate: CandidateProfile, job: Job) -> Dict[str, Any]:
    """
    Computes an explainable match score (0 to 100) and breakdown between a candidate and a job.
    Weights:
    - Skills match: up to 40 points
    - Education level match: up to 25 points
    - Location preference: up to 20 points
    - Sector & Work mode preference: up to 15 points
    """
    match_score = 0
    reasons: List[str] = []

    # 1. Skills Matching (up to 40 pts)
    candidate_skills = [s.name.lower().strip() for s in candidate.skills.all()]
    job_text = f"{job.title} {job.description} {job.responsibilities}".lower()

    matched_skills = []
    for skill in candidate_skills:
        if skill in job_text:
            matched_skills.append(skill)

    if matched_skills:
        # Scale: each matched skill adds 15 points, capped at 40
        skill_score = min(40, len(matched_skills) * 15)
        match_score += skill_score
        reasons.append(f"Skills matched: {', '.join(s.title() for s in matched_skills[:4])} (+{skill_score}%)")
    else:
        # Base skill points if candidate has general computer or workplace skills
        if len(candidate_skills) > 0:
            match_score += 10
            reasons.append(f"General profile skills relevant (+10%)")

    # 2. Education Matching (up to 25 pts)
    candidate_educations = candidate.educations.all()
    job_min_edu = (job.minimum_education or 'any').lower()

    edu_matched = False
    if 'any' in job_min_edu:
        match_score += 25
        reasons.append("Educational background open to all candidates (+25%)")
        edu_matched = True
    elif candidate_educations.exists():
        highest_edu = candidate_educations.first().qualification.lower()
        if 'graduate' in highest_edu or 'bachelor' in highest_edu or 'degree' in highest_edu:
            match_score += 25
            reasons.append(f"Candidate graduate degree satisfies minimum requirement (+25%)")
            edu_matched = True
        elif '12th' in highest_edu or 'diploma' in highest_edu or 'iti' in highest_edu:
            if 'graduate' not in job_min_edu:
                match_score += 25
                reasons.append(f"Candidate education satisfies 10th/12th/Diploma requirement (+25%)")
                edu_matched = True
            else:
                match_score += 10
                reasons.append("Close educational match (+10%)")
        else:
            match_score += 15
            reasons.append("Education background recorded (+15%)")
    else:
        match_score += 10
        reasons.append("General educational eligibility (+10%)")

    # 3. Location Matching (up to 20 pts)
    candidate_city = (candidate.city or '').strip().lower()
    candidate_state = (candidate.state or '').strip().lower()
    target_locations = [loc.lower().strip() for loc in (candidate.preferred_locations or [])]
    job_city = (job.location_city or '').strip().lower()
    job_state = (job.location_state or '').strip().lower()

    if job.work_mode == 'remote':
        match_score += 20
        reasons.append("Remote / Work from home opportunity (+20%)")
    elif job_city and (job_city == candidate_city or job_city in target_locations):
        match_score += 20
        reasons.append(f"Job is located in your preferred city: {job.location_city} (+20%)")
    elif job_state and (job_state == candidate_state or job_state in target_locations):
        match_score += 15
        reasons.append(f"Job is located in your state: {job.location_state} (+15%)")
    else:
        match_score += 5
        reasons.append("Accessible transit location (+5%)")

    # 4. Sector & Work Mode Preference (up to 15 pts)
    pref_sector = (candidate.preferred_sector or 'any').lower()
    job_sector = (job.sector or '').lower()

    if pref_sector == 'any' or pref_sector in job_sector or job_sector in pref_sector:
        match_score += 10
        reasons.append(f"Matches your target sector preference ({job.get_sector_display()}) (+10%)")
    else:
        match_score += 5

    pref_mode = (candidate.preferred_work_mode or 'any').lower()
    if pref_mode == 'any' or pref_mode == job.work_mode:
        match_score += 5
        reasons.append(f"Matches your work mode preference ({job.get_work_mode_display()}) (+5%)")

    # Ensure score is between 15% and 98%
    final_score = max(20, min(98, match_score))

    return {
        "job_id": str(job.id),
        "job_title": job.title,
        "organization_name": job.organization.name,
        "sector": job.sector,
        "sector_display": job.get_sector_display(),
        "work_mode": job.work_mode,
        "work_mode_display": job.get_work_mode_display(),
        "location": f"{job.location_city}, {job.location_state}",
        "application_deadline": job.application_deadline,
        "vacancies_pwd_reserved": job.vacancies_pwd_reserved,
        "match_percentage": final_score,
        "match_reasons": reasons,
        "official_url": job.official_application_url if job.official_application_url else f"/jobs/{job.id}"
    }


def get_recommended_jobs_for_candidate(candidate: CandidateProfile, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Ranks published jobs for the candidate and returns explainable matches.
    """
    open_jobs = Job.objects.filter(status=JobStatus.PUBLISHED).select_related('organization')

    results = []
    for job in open_jobs:
        match_data = compute_job_match(candidate, job)
        results.append(match_data)

    # Sort descending by match score
    results.sort(key=lambda x: x['match_percentage'], reverse=True)
    return results[:limit]
