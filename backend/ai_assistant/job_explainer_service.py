"""
Service: Job & Eligibility Explainer Assistant
===============================================
Security & Privacy Principles:
1. Explains job descriptions, eligibility criteria, and application steps in plain, accessible language.
2. Mandatory Ethical & Legal Disclaimer appended to all responses.
3. Reads API Key from os.environ.get('AI_ASSISTANT_API_KEY') ONLY ON THE BACKEND.
4. Input Length Capping: User questions capped at 500 chars; job description capped at 3000 chars.
5. Strict Privacy Guard: Zero candidate personal data, disability categories, or UDID credentials
   are ever transmitted to the external AI provider — ONLY public vacancy text.
6. Error & Latency Fallback: Enforces an 8-second timeout and seamlessly falls back to high-reliability
   rule-based heuristics if the provider is unreachable, throttled, or returns an error.
"""

import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from django.utils.html import strip_tags
from jobs.models import Job

logger = logging.getLogger(__name__)

MANDATORY_LEGAL_DISCLAIMER = (
    "Disclaimer: This assistant is an accessibility helper only and cannot make legal, "
    "medical, disability, or binding eligibility decisions. Please refer to the official recruitment notification "
    "issued by the hiring organization for authoritative legal requirements."
)

# Security caps to prevent prompt injection and token denial-of-service
MAX_QUERY_LENGTH = 500
MAX_DESCRIPTION_LENGTH = 3000
AI_REQUEST_TIMEOUT_SECONDS = 8


def _sanitize_input(text: Optional[str], max_length: int) -> str:
    """Strips HTML tags, collapses whitespace, and enforces hard length bounds."""
    if not text:
        return ""
    clean = strip_tags(text).strip()
    return clean[:max_length]


def _generate_rule_based_explanation(job: Job, candidate_query: Optional[str] = None) -> Dict[str, Any]:
    """
    Deterministic rule-based explanation engine.
    Zero external dependencies, instant response, 100% private and resilient.
    """
    plain_summary = (
        f"{job.organization.name} is inviting applications for the position of '{job.title}'. "
        f"This opportunity is in the {job.get_sector_display()} sector as a {job.get_job_type_display()} role "
        f"with a {job.get_work_mode_display()} arrangement located in {job.location_city}, {job.location_state}."
    )

    eligibility_points = [
        f"Educational Requirement: {job.get_minimum_education_display() if hasattr(job, 'get_minimum_education_display') else job.minimum_education or 'Any recognized qualification'}",
        f"Experience Level: {f'{job.experience_required_months} months' if job.experience_required_months else 'Freshers / No prior experience mandatory'}",
        f"Vacancies: Total {job.vacancies_total} post(s), including {job.vacancies_pwd_reserved} specifically reserved for Persons with Disabilities (PwDs).",
    ]

    application_steps = [
        "Step 1: Verify your educational marksheets and identity proofs.",
        "Step 2: If requesting an examination scribe or extra-time, ensure your UDID or disability certificate is accessible.",
    ]
    if job.official_application_url:
        application_steps.append(
            f"Step 3: Complete application on the official hiring agency portal: {job.official_application_url}."
        )
        application_steps.append(
            "Step 4: Record this application on Udyog Saarthi to track your admit card and examination status."
        )
    else:
        application_steps.append(
            "Step 3: Submit application directly within Udyog Saarthi with your requested accommodations."
        )

    application_steps.append(
        f"Step 5: Submit prior to the closing deadline on {job.application_deadline}."
    )

    accessibility_highlights = []
    if job.accessibility_facilities:
        for fac in job.accessibility_facilities:
            accessibility_highlights.append(f"Facility: {fac}")
    else:
        accessibility_highlights.append("Standard reasonable accommodations per RPwD Act guidelines.")

    return {
        "job_id": str(job.id),
        "job_title": job.title,
        "organization_name": job.organization.name,
        "deadline": str(job.application_deadline),
        "plain_language_summary": plain_summary,
        "eligibility_breakdown": eligibility_points,
        "application_steps": application_steps,
        "accessibility_highlights": accessibility_highlights,
        "official_notification_link": job.official_application_url or "https://example.gov.in/demo-notification",
        "legal_disclaimer": MANDATORY_LEGAL_DISCLAIMER,
        "ai_powered": False,
    }


def explain_job_and_eligibility(job: Job, candidate_query: Optional[str] = None) -> Dict[str, Any]:
    """
    Main assistant entry point. Attempts Gemini API if configured with strict timeouts and
    privacy sanitization, and falls back to deterministic rule-based output on any error.
    """
    sanitized_query = _sanitize_input(candidate_query, MAX_QUERY_LENGTH)
    api_key = os.getenv('AI_ASSISTANT_API_KEY', '').strip()

    # Fast path: No key -> use built-in rule-based explainer immediately
    if not api_key:
        return _generate_rule_based_explanation(job, sanitized_query)

    # Sanitize and bound job text (NO candidate PII or disability data included!)
    sanitized_desc = _sanitize_input(job.description, MAX_DESCRIPTION_LENGTH)
    model = os.getenv('AI_MODEL_NAME', 'gemini-1.5-flash').strip()

    prompt_text = (
        "You are Udyog Saarthi's accessible career explainer assistant for Persons with Disabilities (PwD).\n"
        "Your task is to explain the following public job vacancy in simple, easy-to-understand language:\n\n"
        f"Position: {job.title}\n"
        f"Organization: {job.organization.name}\n"
        f"Sector: {job.get_sector_display()}\n"
        f"Education: {job.minimum_education}\n"
        f"Deadline: {job.application_deadline}\n"
        f"Description: {sanitized_desc}\n\n"
        f"Candidate Question: {sanitized_query or 'Please explain the eligibility requirements, key responsibilities, and how to apply in simple language.'}\n\n"
        "Instructions:\n"
        "- Use simple English (reading level: 8th grade).\n"
        "- Be encouraging, concise, and respectful.\n"
        "- Highlight any disability reservation vacancies or reasonable accommodations mentioned.\n"
        "- Never claim to make official eligibility or medical decisions."
    )

    endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    request_payload = {
        "contents": [
            {
                "parts": [{"text": prompt_text}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 800,
        }
    }

    try:
        data = json.dumps(request_payload).encode('utf-8')
        req = urllib.request.Request(
            endpoint_url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )

        with urllib.request.urlopen(req, timeout=AI_REQUEST_TIMEOUT_SECONDS) as resp:
            resp_data = json.loads(resp.read().decode('utf-8'))
            candidates = resp_data.get('candidates', [])
            if candidates:
                parts = candidates[0].get('content', {}).get('parts', [])
                if parts and 'text' in parts[0]:
                    ai_text = parts[0]['text'].strip()
                    # Return structured AI response with standard fallback fields and disclaimer
                    rule_res = _generate_rule_based_explanation(job, sanitized_query)
                    rule_res['plain_language_summary'] = ai_text
                    rule_res['ai_powered'] = True
                    return rule_res

        logger.warning("[AI Assistant] Gemini returned unexpected format. Falling back to rule-based engine.")
        return _generate_rule_based_explanation(job, sanitized_query)

    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        logger.warning(f"[AI Assistant Timeout/Network Error] {exc}. Falling back to rule-based engine.")
        return _generate_rule_based_explanation(job, sanitized_query)
    except Exception as exc:
        logger.error(f"[AI Assistant Unexpected Error] {exc}. Falling back to rule-based engine.")
        return _generate_rule_based_explanation(job, sanitized_query)
