# Udyog Saarthi — Comprehensive Project Audit & Status Report

**Report Date:** October 2026  
**Auditor:** Senior Application Security Engineer & Full-Stack Architect  
**Codebase Version:** 1.0.0-rc  
**Target Environment:** Django 5.1 REST API + Next.js 14 App Router  

---

## 1. Overview

### What the Application Does
Udyog Saarthi is an accessible employment and career preparation platform designed for Persons with Disabilities (PwD) in India, built for the Smart India Hackathon (SIH). It connects candidates with reserved government, PSU, and equal-opportunity private jobs, provides accessible learning materials and untimed/compensatory mock exams, offers dedicated job coaching and guardian delegation, and includes an explainable AI assistant to demystify complex job notices.

### Actual Tech Stack & Versions
- **Frontend:** Next.js `14.2.15`, React `18.3.1`, TypeScript `5.4.5`, Tailwind CSS `3.4.4`, Zod `4.6.5`, Sharp `0.35.5`.
- **Backend:** Python `3.13` (venv), Django `5.1.x`, Django REST Framework `3.15.2`, SimpleJWT `5.3.1`, django-cors-headers `4.3.1`, Argon2-cffi `25.1.0`, BCrypt `5.0.0`, Celery `5.3.6`, Redis `5.0.0`, Boto3 `1.34.0`.
- **Database:** PostgreSQL (production ready) with zero-config SQLite option (`USE_SQLITE=True`) for local testing.
- **Extra Services:** Cloudflare Turnstile (spam defense), Plausible Analytics (cookieless privacy analytics), Google Gemini (`gemini-1.5-flash` or heuristic fallback).

### Folder Structure (Main Folders)
- `backend/`: Django project root containing settings, authentication, domain apps, migrations, and test suites.
- `frontend/`: Next.js 14 App Router project containing pages, client/server components, context providers, and public assets.
- `docs/`: Master documentation including PRD, architecture plan, launch audit, lighthouse audit, deploy checklist, and this report.
- `scripts/`: Operational utilities for link crawling, image compression, lighthouse audits, and workspace validation.
- `adapters/`: Configuration guidelines for AI assistants and agent development.

---

## 2. How to Run It

### Starting the Servers

#### 1. Backend (Django REST API)
```bash
# From repository root
cd backend
# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1
# Apply database migrations
python manage.py migrate
# Seed all initial demo data (users, jobs, learning, support, admin)
python manage.py seed_demo_users
python manage.py seed_demo_jobs
python manage.py seed_demo_learning
python manage.py seed_demo_notifications
python manage.py seed_demo_support
python manage.py seed_demo_admin_data
# Start API server on port 8000
python manage.py runserver 8000
```

#### 2. Frontend (Next.js 14)
```bash
# From repository root
cd frontend
npm install
npm run dev
# Starts web application on http://localhost:3000
```

#### 3. Database & Background Workers
- **Database:** PostgreSQL running on `127.0.0.1:5432`, or set `USE_SQLITE=True` in `backend/.env` for zero-install development.
- **Celery Worker (Optional):** `celery -A core worker -l info` (or keep `CELERY_ALWAYS_EAGER=True` in development).

### Environment Variables Needed (Names Only)
- **Backend (`backend/.env`):**  
  `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `FRONTEND_BASE_URL`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `USE_SQLITE`, `CORS_ALLOWED_ORIGINS`, `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS`, `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `CELERY_ALWAYS_EAGER`, `AI_ASSISTANT_API_KEY`, `AI_MODEL_NAME`, `USE_S3_STORAGE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_REGION_NAME`, `AWS_S3_ENDPOINT_URL`, `TURNSTILE_SECRET_KEY`.
- **Frontend (`frontend/.env.local`):**  
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_PLAUSIBLE_API_HOST`.

### Current Setup Roadblocks
1. **API URL Hardcoding in Browser:** In `frontend/src/services/api.ts`, line 7 hardcodes `http://${hostname}:8000/api` when running in the browser. In production over HTTPS (`https://udyogsaarthi.in`), this will fail due to mixed content unless updated to use `NEXT_PUBLIC_API_URL`.
2. **Link Crawler Requires Live Servers:** The crawler script (`npm run test:links`) exits with error code 0/20 unless both backend (port 8000) and frontend (port 3000) are running beforehand.

---

## 3. Feature Status (Actual Code vs. PRD)

| PRD Feature Area | Implementation Status | Explanation of Actual Code Reality |
| :--- | :---: | :--- |
| **Authentication & RBAC** | **Complete** | Full JWT login/register, token refresh, password reset flow, and 4-role RBAC (Candidate, Guardian, Coach, Admin). |
| **Candidate Profile** | **Complete** | Personal details, Washington Group accessibility profile, education, skills, experience, and profile completion scoring. |
| **Job Discovery & Bookmarks** | **Complete** | Search, filter by sector/work mode/disability/city, job details, and candidate bookmarking (`SavedJob`). |
| **Application Tracking** | **Complete** | Internal application submission with requested accommodations, status timeline history, and external redirect tracking. |
| **Learning & Mock Tests** | **Complete** | Course library, markdown learning resources, and full MCQ test engine with 4 timing accommodation modes (Standard, Compensatory, Relaxed, Untimed) + weak-subject diagnostics. |
| **Notifications** | **Complete** | In-app notification center, unread count badges, read status toggles, user notification preferences, and deadline checks. |
| **Support & Grievance Desk** | **Complete** | Support ticket submission with category tags, status workflow, and threaded conversation messages. |
| **Job Coaching** | **Complete** | Coach dashboard, assigned candidate list, confidential coach notes, and direct job recommendations to candidates. |
| **Parent / Guardian Delegation**| **Complete** | Candidates grant granular permissions (view profile, applications, learning, tickets); guardian portal displays permitted data. |
| **Admin Panel** | **Complete** | Full metrics dashboard and CRUD management across users, jobs, courses, resources, mock tests, tickets, and audit logs. |
| **Success Stories & Feedback** | **Complete** | Public success stories directory; public 5-star feedback submission with Turnstile; admin moderation views. |
| **AI Features** | **Complete** | Explainable rule-based scoring (no black-box bias); weak-subject learning suggestions; job notice explainer with disclaimer and heuristic fallback if Gemini key is unset. |
| **Legal Pages & Cookie Consent**| **Complete** | Plain-language `/privacy-policy` (DPDP Act 2023 aligned), `/terms` with draft notice, and keyboard-accessible cookie consent banner. |
| **SEO & Social Sharing** | **Complete** | Next.js Metadata API, JobPosting JSON-LD with XSS escaping, `sitemap.xml`, `robots.txt`, OpenGraph SVG cards, favicon, and web manifest. |
| **Document Uploads (S3)** | **Missing** | PRD planned private S3 storage for resumes/UDID cards; `boto3` is in `requirements.txt`, but no `CandidateDocument` model, upload API, or UI exists. |
| **End-to-End (E2E) Browser Tests**| **Missing** | PRD section 44 outlines 4 candidate journeys; while 52 Django backend tests exist, no Cypress or Playwright browser tests are present. |
| **Docker & GitHub CI** | **Missing** | No `Dockerfile`, `docker-compose.yml`, or `.github/workflows` files exist in the repository. |

---

## 4. Database Architecture & Sensitive Data

### Entity Relationship Overview
The database uses a normalized relational architecture:
```
User (accounts)
  ├── 1:1 ── CandidateProfile (profiles)
  │            ├── 1:1 ── AccessibilityProfile (disability & accommodations)
  │            ├── 1:N ── Education, Skill, Training, Experience
  │            ├── 1:N ── JobApplication ── 1:N ── ApplicationStatusHistory
  │            ├── 1:N ── TestAttempt ── 1:N ── TestAnswer
  │            ├── 1:N ── SupportTicket ── 1:N ── SupportMessage
  │            ├── 1:N ── CoachNote (written by assigned Job Coach)
  │            ├── 1:N ── CoachJobRecommendation
  │            └── 1:N ── GuardianAccess (delegated access toggles)
  ├── 1:N ── SavedJob (M:N with Job)
  ├── 1:N ── Notification
  └── 1:1 ── NotificationPreference

Organization (jobs) ── 1:N ── Job
Course (learning) ── 1:N ── LearningResource
MockTest (learning) ── 1:N ── Question
AdminAuditLog (admin_panel)
SuccessStory & Feedback (support)
```

### Sensitive Data Protection
1. **Disability Classifications & Washington Group Questions (`AccessibilityProfile`):**
   - Stored in `AccessibilityProfile` linked to `CandidateProfile`.
   - Never exposed through public APIs or list endpoints.
2. **UDID Number (`AccessibilityProfile.udid_number`):**
   - Protected by field-level serialization rules in `CandidateProfileSerializer`.
   - **Protection Rule:** Only the candidate profile owner can view their own `udid_number`. When accessed by coaches, employers, or administrators, `udid_number` is stripped and returns `null`.
3. **Confidential Guidance Notes (`CoachNote`):**
   - Accessible only by the authoring coach and system administrators; never exposed to other candidates or public users.

---

## 5. API Endpoints & Access Control

| Domain | Endpoint | HTTP Method | Allowed Roles | Description |
| :--- | :--- | :---: | :--- | :--- |
| **Auth** | `/api/auth/register/` | `POST` | Public | Candidate and Guardian account registration |
| | `/api/auth/login/` | `POST` | Public | Issues JWT access and refresh tokens |
| | `/api/auth/me/` | `GET` | Authenticated | Returns current authenticated user |
| | `/api/auth/password-reset/` | `POST` | Public | Requests password reset link |
| | `/api/auth/password-reset-confirm/` | `POST` | Public (Throttled) | Validates reset token and sets new password |
| **Profiles** | `/api/profiles/me/` | `GET, PUT` | Candidate | Read/update own personal profile |
| | `/api/profiles/me/accessibility/` | `PUT` | Candidate | Update disability and exam accommodation needs |
| | `/api/profiles/<id>/` | `GET` | Owner, Coach, Admin | Read profile (UDID stripped for non-owners) |
| | `/api/profiles/me/education/` | `GET, POST` | Candidate | Manage academic qualifications |
| | `/api/profiles/me/skills/` | `GET, POST` | Candidate | Manage skills inventory |
| **Jobs** | `/api/jobs/` | `GET` | Public | Search and filter published vacancies |
| | `/api/jobs/<id>/` | `GET` | Public | View job details, eligibility, accommodations |
| | `/api/jobs/<id>/save/` | `POST` | Candidate | Bookmark or unbookmark a vacancy |
| | `/api/jobs/saved/` | `GET` | Candidate | List candidate's saved vacancies |
| **Applications** | `/api/applications/` | `GET, POST` | Candidate | List or submit job applications |
| | `/api/applications/<id>/` | `GET` | Owner, Coach, Admin | View application details and history |
| | `/api/applications/<id>/status/` | `POST` | Coach, Admin | Update application status stage |
| **Learning** | `/api/learning/courses/` | `GET` | Public | List structured learning tracks |
| | `/api/learning/resources/<id>/` | `GET` | Public | Read accessible study resource |
| | `/api/learning/tests/` | `GET` | Public | List available mock exams |
| | `/api/learning/tests/<id>/start/`| `POST` | Candidate | Initialize mock exam with timing accommodations |
| | `/api/learning/tests/attempts/<id>/submit/` | `POST` | Candidate | Submit test, calculate score and diagnostics |
| **Support** | `/api/support/tickets/` | `GET, POST` | Candidate, Guardian | List or open support request tickets |
| | `/api/support/tickets/<id>/messages/` | `POST` | Ticket participants | Post message in ticket thread |
| | `/api/support/coach/candidates/`| `GET` | Coach | List candidates assigned to coach |
| | `/api/support/guardian/access/` | `GET, POST` | Candidate, Guardian | Manage or review delegated guardian links |
| **Admin** | `/api/admin-panel/stats/` | `GET` | Admin only | System-wide performance and metrics overview |
| | `/api/admin-panel/users/` | `GET, PATCH` | Admin only | Manage user accounts and active roles |
| | `/api/admin-panel/jobs/` | `GET, POST` | Admin only | Create and publish verified job notices |
| | `/api/admin-panel/audit-logs/` | `GET` | Admin only | Review immutable administrative action logs |
| **AI Assistant** | `/api/ai-assistant/jobs/recommendations/` | `GET` | Candidate | Explainable job matching scores |
| | `/api/ai-assistant/learning/recommendations/` | `GET` | Candidate | Weak-subject targeted study recommendations |
| | `/api/ai-assistant/jobs/<id>/explain/` | `POST` | Authenticated (Throttled)| Plain-language job summary with legal disclaimer |

---

## 6. Security & Privacy Audit

### 1. Authentication & Token Storage (Code vs. Docs Difference)
- **Documentation (`docs/PLAN.md`):** Proposed using HttpOnly SameSite cookies for JWT storage.
- **Actual Code (`AuthContext.tsx` & `api.ts`):** JWT tokens are stored in the browser's `localStorage` (`access_token` and `refresh_token`).  
  *Risk:* `localStorage` tokens are accessible to JavaScript. While CSP mitigates injection, migrating to HttpOnly cookies is recommended before enterprise production.

### 2. Permissions & Backend RBAC
- All views inherit `IsAuthenticated` by default.
- Administrative endpoints inherit `AdminRolePermission` and fail closed.
- `AdminUsersListView` enforces self-lockout prevention (admins cannot deactivate or demote themselves, and non-superusers cannot alter superusers).
- Cross-tenant candidate profile and application access is guarded by explicit ownership checks (`user == profile.user`), active coach assignment checks (`JobCoachAssignment`), and verified guardian delegations (`GuardianAccess`).

### 3. Secrets & Public Environment Variables
- `scratch/sec_scan.py` confirmed **0 hardcoded secrets** in the repository.
- Both `backend/.gitignore` and `frontend/.gitignore` exclude credential files (`.env`, `.env.local`, `*.key`, `*.pem`).
- Only safe variables prefixed with `NEXT_PUBLIC_` reach the browser: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_PLAUSIBLE_API_HOST`.

### 4. Defense-in-Depth Measures
- **Password Security:** Multi-hasher pipeline prioritizing Argon2id (`Argon2PasswordHasher`), BCrypt, and PBKDF2. 4-tier Django validators enforced.
- **Database Transport:** PostgreSQL connection enforces `sslmode=require` in production.
- **Input Sanitization:** Serializers use Django's `strip_tags` to sanitize text inputs on support tickets, feedback, and notes.
- **Output Encoding:** Next.js JSON-LD `<script>` tags escape `<` to `\u003c` to neutralize script breakout.
- **Rate Limiting:** DRF scoped throttles (`anon`: 30/min, `user`: 120/min, `auth`: 5/min, `contact`: 3/hr, `ai`: 20/min).
- **Spam Protection:** Cloudflare Turnstile token validation active on login, register, reset-password, and feedback endpoints.
- **HTTP Security Headers:** HSTS (31536000s), CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `poweredByHeader: false`.
- **Audit Logging:** Administrative actions are logged to `AdminAuditLog` with timestamp, admin ID, and client IP address.

---

## 7. Accessibility Evaluation

### What Has Been Implemented in Code
1. **Accessibility Control Bar (`AccessibilityBar.tsx`):**
   - Font size scaling: Standard (`100%`), Medium (`115%`), Large (`130%`).
   - High-contrast toggle: Pure black background (`#000000`), white text, `#ffff00` borders and focus rings.
   - Reduced motion toggle: Disables CSS animations and transitions globally.
2. **Keyboard Navigation & Focus Management:**
   - Universal `SkipLink` component at top of body to bypass navigation landmarks.
   - High-contrast focus rings (`outline-3 outline-[#ffff00]` or `ring-2 ring-blue-600 ring-offset-2`).
   - All interactive buttons and inputs meet the **minimum 44x44px touch target** standard (WCAG 2.5.5 / 2.5.8).
3. **Screen Reader Optimizations:**
   - Semantic HTML5 structure (`<main>`, `<nav>`, `<header>`, `<footer>`, `aria-expanded`, `aria-controls`).
   - Responsive admin tables include row header scopes, explicit captions, and touch-scrolling wrappers.
   - Meaningful images include descriptive alt text; decorative icons use `alt=""` and `aria-hidden="true"`.
4. **Accessible Mock Test Engine:**
   - Supports 4 timing modes: Standard (1.0x), Compensatory (+20 min/hr, 1.33x), Relaxed (1.5x), and Untimed.
   - Candidates can pause, resume, and review questions without time pressure.

### What Has Not Been Tested
- **Physical Assistive Tech Verification:** Automated Lighthouse scored 100/100, but physical verification with actual screen readers (NVDA on Windows, VoiceOver on iOS/macOS, TalkBack on Android) and hardware refreshable braille displays has not been conducted.

---

## 8. Quality & Test Results

### Automated Test Suite Execution
- **Backend Tests:** Ran `python manage.py test backend/`.
  - **Total Tests:** 52
  - **Passed:** 52
  - **Failed:** 0
  - **Execution Time:** ~5.1 seconds
  - **Coverage:** User authentication, password validation, RBAC, UDID privacy masking, applications, mock test auto-grading, AI explainers, and admin audit logging.
- **Frontend Build Validation:** Ran `npm run build`.
  - **Result:** Success (Exit Code 0).
  - **Routes Compiled:** 27 static and dynamic routes compiled without errors.
- **TypeScript Type Checking:** Ran `npx tsc --noEmit`.
  - **Result:** 0 errors across all frontend files.
- **Lighthouse Performance & Accessibility Scores (`docs/LIGHTHOUSE.md`):**

| Route | Performance | Accessibility | Best Practices | SEO |
| :--- | :---: | :---: | :---: | :---: |
| `/` (Home) | 99 | 100 | 100 | 100 |
| `/jobs` (Job Directory) | 98 | 100 | 100 | 100 |
| `/jobs/[id]` (Job Details) | 98 | 100 | 100 | 100 |
| `/login` (Login Page) | 98 | 100 | 100 | 100 |
| `/dashboard` (Candidate Portal) | 99 | 100 | 100 | 100 |

---

## 9. Demo Data & Third-Party Services Status

### Seeded Demo Data Available
The repository includes complete management commands with realistic Indian public sector data:
- `seed_demo_users`: Creates 4 test accounts:
  - Candidate: `candidate@demo.com` (`Password123!`)
  - Guardian: `guardian@demo.com` (`Password123!`)
  - Coach: `coach@demo.com` (`Password123!`)
  - Admin: `admin@demo.com` (`Password123!`)
- `seed_demo_jobs`: Seeds 8 public/PSU vacancies with PwD reservations and accommodations.
- `seed_demo_learning`: Seeds 6 courses and 2 full 15-question mock exams with explanations.
- `seed_demo_notifications`: Seeds in-app alerts and deadline reminders.
- `seed_demo_support`: Seeds support tickets and job coach assignments.
- `seed_demo_admin_data`: Seeds success stories and candidate feedback ratings.

### Third-Party Services Reality Check

| Service | Reality in Current Code | How It Works Today |
| :--- | :---: | :--- |
| **Email Gateway** | **Simulated** | Uses Django's `console.EmailBackend`. Emails print to terminal; requires SMTP credentials (e.g. SendGrid/SES) for real delivery. |
| **SMS Gateway** | **Simulated** | Custom console logger (`[SMS GATEWAY - UDYOG SAARTHI]`). Needs SMS API provider (e.g. Twilio/MSG91). |
| **Document Storage** | **Not Connected** | Settings and `boto3` exist, but S3 upload service and bucket connection are not implemented. |
| **AI Assistant (Gemini)** | **Hybrid / Real** | If `AI_ASSISTANT_API_KEY` is provided, calls Gemini 1.5; otherwise falls back gracefully to deterministic plain-language parsing. |
| **Analytics (Plausible)** | **Real** | Integrates cookieless Plausible script, loaded only after explicit user cookie consent. |
| **Turnstile (Spam)** | **Real** | Verifies tokens against Cloudflare; supports Cloudflare test bypass key `1x00000000000000000000AA`. |

---

## 10. Known Problems & Technical Risks (Ranked by Severity)

1. **High Severity — Client-Side API Base URL Hardcoded to Port 8000 (`frontend/src/services/api.ts`):**  
   `getApiBaseUrl()` returns `http://${hostname}:8000/api` whenever running in the browser. In production under HTTPS (`https://udyogsaarthi.in`), the browser will attempt to call port 8000 over HTTP, causing mixed-content blocking.  
   *Fix:* Must prioritize `process.env.NEXT_PUBLIC_API_URL`.
2. **Medium Severity — JWT Stored in LocalStorage Instead of HttpOnly Cookies:**  
   `AuthContext.tsx` saves tokens to `localStorage`. While standard for SPAs, storing JWTs in HttpOnly SameSite cookies provides better protection against token exfiltration if an XSS vulnerability occurs.
3. **Medium Severity — Document Upload Feature Missing:**  
   Candidates currently cannot upload resume files or UDID disability certificates. Object storage (S3 presigned URLs) and document upload models need implementation.
4. **Low Severity — Missing Containerization & CI/CD Pipelines:**  
   There are no `Dockerfile`, `docker-compose.yml`, or GitHub Actions workflows in the repository. Deploying requires manual host setup.
5. **Low Severity — ESLint Interactive Configuration Prompt:**  
   Running `npm run lint` prompts to set up `.eslintrc.json`. A non-interactive ESLint configuration file should be checked into the repository.

---

## 11. What is Left Before Launch

### Prioritized Task Breakdown
- **Must Fix (Blocking Launch):**
  1. Fix `getApiBaseUrl()` in `frontend/src/services/api.ts` to use `NEXT_PUBLIC_API_URL` instead of hardcoding port 8000.
  2. Implement `CandidateDocument` model and secure upload endpoint (S3 presigned URLs or protected media views).
  3. Replace legal placeholders in `/privacy-policy` and `/terms` with real legal identity, contact email, and Grievance Officer details.
- **Should Fix (Operational Hardening):**
  4. Migrate JWT tokens from `localStorage` to secure HttpOnly cookies.
  5. Add Dockerfiles, `docker-compose.yml`, and GitHub Actions CI workflow for automated testing on pull requests.
  6. Connect real SMTP email gateway (SendGrid, AWS SES) and real SMS provider.
- **Nice to Have (Post-Launch Polish):**
  7. Add Playwright E2E browser tests for the 4 core candidate journeys.
  8. Conduct manual assistive technology verification with native screen readers (NVDA / TalkBack).

### What You Must Provide Yourself
- **Domain & SSL:** Domain registration (e.g., `udyogsaarthi.in`) and TLS certificate.
- **Contact & Legal Info:** Official organization name, contact email, registered address, and designated Grievance Officer contact under the DPDP Act 2023.
- **API Credentials:**
  - Google Gemini API Key (for live AI job explainer)
  - Cloudflare Turnstile Site Key & Secret Key
  - SMTP Credentials (for account activation & password reset emails)
  - AWS S3 or Cloudflare R2 bucket credentials (for document storage)
- **Official Job Content:** Replace demo job notices with verified government gazette notifications.

---

## 12. Suggested Next 5 Steps

1. **Fix `frontend/src/services/api.ts` Base URL Logic**  
   *Reason:* Ensures the frontend reliably routes API calls through `NEXT_PUBLIC_API_URL` in both local and production HTTPS environments.
2. **Build Document Uploads with Private Storage**  
   *Reason:* Candidates need to attach resumes and UDID certificates to complete real job applications.
3. **Migrate JWT Auth to HttpOnly Cookies**  
   *Reason:* Protects authentication tokens against XSS attacks before opening the platform to public users.
4. **Add Dockerfiles & GitHub Actions CI Workflow**  
   *Reason:* Guarantees repeatable local deployment and ensures all 52 tests and builds pass automatically on every commit.
5. **Fill in Real Legal & Third-Party API Credentials**  
   *Reason:* Replaces placeholders in policies and activates live email, Turnstile spam protection, and AI features.
