# Udyog Saarthi — Master Project & Architecture Plan

## 1. Ambiguities & Missing Requirements (Max 10)

| # | Ambiguity / Missing Requirement | PRD Context | Suggested Working Decision |
|---|---|---|---|
| **1** | **User Role Assignment & Signup Flow** | Section 3 describes 4 roles: Candidate, Parent/Guardian, Job Coach, Admin. How do coaches and admins get created? | Public registration is strictly for **Candidate** and **Parent/Guardian** roles. **Job Coaches** are invited or assigned by Admins. **Admins** are created via Django createsuperuser or internal admin invite. |
| **2** | **Parent/Guardian Authorization Link** | Section 3.2 allows parents to view progress without exposing sensitive data without authorization. | A candidate can invite or link a parent via email/invite code with explicit consent and select permission checkboxes (e.g. view applications, view schedules; excluding sensitive health/UDID records). |
| **3** | **UDID & Disability Verification** | Section 6 mentions UDID without medical diagnosis invention. Is real-time government UDID portal API verification expected? | No third-party government portal integration exists for testing. We store self-declared UDID number (encrypted/masked) and disability details for accommodations, marked with a `verification_status` flag (`Self-Declared`, `Pending`, `Verified`). Never expose UDID via public endpoints. |
| **4** | **Internal vs External Job Applications** | Section 11 distinguishes between direct portal applications and external redirects. | Each job has an `application_type` (`INTERNAL` vs `EXTERNAL_REDIRECT`). For external jobs, clicking "Apply" redirects to the official URL in a new tab, but prompts the candidate: "Did you complete this application? Track it on your dashboard" to create a tracked application record. |
| **5** | **Application Status Updates Lifecycle** | Section 12 lists 12+ statuses from Saved to Placed. Who updates these statuses? | For internal jobs: Employer/Admin updates statuses (Admit Card, Exam, Interview, Selected). For external jobs: Candidates can manually update their milestone status (e.g. "I got an exam date") with notes so they can use the platform as a personal tracker. |
| **6** | **Mock Test Format & Timing Accessibility** | Section 14 describes timed tests with MCQs. How do timed tests handle disability accommodations? | Candidates with accommodations (e.g. learning disabilities, visual impairments) can be granted standard extra time (e.g., +20 mins per hour / 1.5x time factor) based on their accessibility profile, with pause and resume options. |
| **7** | **Document Uploads & Privacy in Development** | Section 31 specifies object storage (S3/R2) for resumes and certificates. | In local development, use Django's local media storage behind a protected download endpoint requiring authentication and object-level permissions, before switching to pre-signed S3 URLs for production. |
| **8** | **Job Coach to Candidate Mapping** | Section 17 allows coaches to view assigned candidates. | A clean `JobCoachAssignment` relation where Admins can assign a coach to a candidate, or candidates can request a coach via support ticket. Coaches can only read details of their actively assigned candidates. |
| **9** | **Authentication Mechanism** | Section 5 & 26 mention login, logout, password reset, and role-based auth. Session cookies vs JWT? | Use standard HTTP-only, SameSite secure session cookies or JWT tokens stored in HTTP-only cookies. For Next.js + Django REST, HTTP-only secure JWT cookies or standard DRF session authentication with CSRF tokens ensure strong security without storing tokens in `localStorage`. |
| **10** | **Offline/Low-Bandwidth Experience** | Target audience may have low-end devices or slow rural connectivity across India. | Keep frontend bundle lean, avoid heavy 3D/animation packages, rely on native HTML form controls and Tailwind, and implement clean server-side pagination with modest page sizes (10-20 items). |

---

## 2. Final Architecture (In Simple Words)

### High-Level System Architecture
```
┌────────────────────────────────────────────────────────┐
│                   Browser / Client                     │
│  (Accessible UI, Keyboard Nav, Screen Reader Support)  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│             Next.js Frontend (Port 3000)               │
│  - TypeScript (strict) + Tailwind CSS                  │
│  - App Router: Server Components + Client Islands      │
│  - Accessibility Toolbar (Text Size, Contrast, Motion) │
│  - API Client layer calling Django backend             │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs (/api/...)
                            ▼
┌────────────────────────────────────────────────────────┐
│          Django REST Framework Backend (Port 8000)     │
│  - Python 3.11+ / Django 5+                            │
│  - Custom User Model + Role-Based Access Control       │
│  - Domain-separated apps (accounts, jobs, learning...) │
│  - Service layer for business logic                    │
│  - Serializers for strict input validation             │
│  - Protected media views for candidate docs            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                   │
│  - Relational schemas, foreign keys, indexes           │
│  - Demo seed fixtures for offline testing              │
└────────────────────────────────────────────────────────┘
```

### What Runs Where
1. **Frontend (`frontend/`)**:
   - **Framework**: Next.js (React 18/19, TypeScript strict mode).
   - **Styling**: Tailwind CSS with custom focus rings, high-contrast palette tokens, and fluid accessible typography.
   - **State**: React Context for Accessibility Preferences (font size, contrast, reduced motion) and Auth state.
   - **Runs on**: Node.js dev server (`http://localhost:3000`).

2. **Backend (`backend/`)**:
   - **Framework**: Django + Django REST Framework (DRF).
   - **Organization**: Clean Django apps (`accounts`, `profiles`, `jobs`, `applications`, `learning`, `support`, `notifications`).
   - **Security**: Password hashing via Argon2/PBKDF2, Django CSRF/CORS middleware, backend permission checks on every viewset.
   - **Runs on**: Python virtual environment (`http://localhost:8000`).

3. **Database**:
   - **Database**: PostgreSQL (can fallback to SQLite in initial development for instant zero-config setup if PostgreSQL is not yet locally provisioned, then seamless migration to PostgreSQL).

---

## 3. Core Database Schema

Clean, normalized schema covering all primary requirements without over-engineering:

### 3.1 Accounts & Profiles Domain
* **`User`** (`accounts_user`):
  * `id`: UUID (PK)
  * `email`: String (Unique)
  * `full_name`: String
  * `phone`: String (Optional)
  * `role`: Enum (`CANDIDATE`, `PARENT_GUARDIAN`, `JOB_COACH`, `ADMIN`)
  * `is_active`: Boolean
  * `is_staff`: Boolean
  * `date_joined`: DateTime

* **`CandidateProfile`** (`profiles_candidateprofile`):
  * `id`: UUID (PK)
  * `user`: OneToOne(`User`, cascade=CASCADE)
  * `date_of_birth`: Date
  * `gender`: String
  * `city`: String
  * `state`: String
  * `pincode`: String
  * `bio`: Text
  * `profile_completion_percentage`: Integer (0-100)
  * `created_at`, `updated_at`: DateTime

* **`AccessibilityProfile`** (`profiles_accessibilityprofile`):
  * `id`: UUID (PK)
  * `candidate`: OneToOne(`CandidateProfile`)
  * `primary_disability_category`: Enum (`INTELLECTUAL`, `AUTISM`, `MULTIPLE`, `MENTAL_ILLNESS`, `LEARNING_DISABILITY`, `LOCOMOTOR`, `VISUAL`, `HEARING`, `OTHER`)
  * `disability_percentage`: Integer (Optional, 0-100)
  * `udid_number`: String (Encrypted/Masked, private)
  * `udid_verification_status`: Enum (`NOT_PROVIDED`, `SELF_DECLARED`, `VERIFIED`)
  * `functional_difficulties`: JSONField (Washington Group items: seeing, hearing, walking, remembering, communicating)
  * `assistive_devices_used`: JSONField (List of strings)
  * `assistive_devices_required`: JSONField (List of strings)
  * `human_assistance_requirements`: JSONField (Scribe, Interpreter, Personal Assistant, Extra Time)

* **`Education`** (`profiles_education`):
  * `id`: UUID (PK)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `qualification`: String (e.g. 10th, 12th, Graduate, ITI, Diploma)
  * `institution`: String
  * `board_or_university`: String
  * `year_of_passing`: Integer
  * `percentage_or_cgpa`: String

* **`Skill`** (`profiles_skill`):
  * `id`: UUID (PK)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `name`: String
  * `category`: Enum (`TECHNICAL`, `SOFT_SKILL`, `COMPUTER`, `COMMUNICATION`, `OTHER`)
  * `proficiency_level`: Enum (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`)

* **`Experience`** (`profiles_experience`):
  * `id`: UUID (PK)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `organization`: String
  * `role_title`: String
  * `start_date`: Date
  * `end_date`: Date (Nullable)
  * `is_current`: Boolean
  * `description`: Text

---

### 3.2 Organizations & Jobs Domain
* **`Organization`** (`jobs_organization`):
  * `id`: UUID (PK)
  * `name`: String
  * `org_type`: Enum (`GOVERNMENT_DEPT`, `PSU`, `PRIVATE_SECTOR`, `TRAINING_INSTITUTE`, `NGO`)
  * `website`: URL
  * `description`: Text
  * `logo_url`: String (Optional)
  * `verified`: Boolean

* **`Job`** (`jobs_job`):
  * `id`: UUID (PK)
  * `organization`: ForeignKey(`Organization`)
  * `title`: String
  * `job_type`: Enum (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `APPRENTICESHIP`)
  * `sector`: Enum (`GOVERNMENT`, `PSU`, `PRIVATE`)
  * `work_mode`: Enum (`ON_SITE`, `REMOTE`, `HYBRID`)
  * `location_city`: String
  * `location_state`: String
  * `description`: Text
  * `responsibilities`: Text
  * `salary_display`: String (e.g. "Rs 25,000 - 35,000 / month" or "Pay Level 4")
  * `minimum_education`: String
  * `experience_required_months`: Integer
  * `vacancies_total`: Integer
  * `vacancies_pwd_reserved`: Integer
  * `eligible_disabilities`: JSONField (List of disability categories)
  * `accessibility_facilities`: JSONField (Wheelchair ramp, accessible restroom, assistive tech provided)
  * `application_type`: Enum (`INTERNAL`, `EXTERNAL_REDIRECT`)
  * `external_application_url`: URL (Optional)
  * `application_start_date`: Date
  * `application_deadline`: Date
  * `exam_date`: Date (Optional)
  * `status`: Enum (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`)
  * `created_at`: DateTime

* **`SavedJob`** (`jobs_savedjob`):
  * `id`: UUID (PK)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `job`: ForeignKey(`Job`)
  * `saved_at`: DateTime
  * *Constraint: Unique(candidate, job)*

---

### 3.3 Applications Domain
* **`JobApplication`** (`applications_jobapplication`):
  * `id`: UUID (PK)
  * `job`: ForeignKey(`Job`)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `current_status`: Enum (`SAVED`, `APPLIED`, `SUBMITTED`, `ADMIT_CARD_ISSUED`, `EXAM_SCHEDULED`, `EXAM_ATTENDED`, `RESULT_PUBLISHED`, `INTERVIEW_SCHEDULED`, `SELECTED`, `PLACED`, `REJECTED`, `WITHDRAWN`)
  * `is_external_application`: Boolean
  * `application_notes`: Text
  * `accommodations_requested`: JSONField (e.g. Scribe, Ground floor exam hall, Extra time)
  * `applied_at`: DateTime
  * `updated_at`: DateTime
  * *Constraint: Unique(job, candidate)*

* **`ApplicationStatusHistory`** (`applications_statuslog`):
  * `id`: UUID (PK)
  * `application`: ForeignKey(`JobApplication`, cascade=CASCADE)
  * `from_status`: String
  * `to_status`: String
  * `note`: Text
  * `created_by`: ForeignKey(`User`, nullable=True)
  * `created_at`: DateTime

---

### 3.4 Learning & Mock Tests Domain
* **`Course`** (`learning_course`):
  * `id`: UUID (PK)
  * `title`: String
  * `category`: Enum (`GOVT_EXAM_PREP`, `REASONING`, `APTITUDE`, `ENGLISH`, `COMPUTER_SKILLS`, `INTERVIEW_PREP`, `WORKPLACE_SKILLS`)
  * `description`: Text
  * `level`: Enum (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`)
  * `is_published`: Boolean

* **`LearningResource`** (`learning_resource`):
  * `id`: UUID (PK)
  * `course`: ForeignKey(`Course`, nullable=True)
  * `title`: String
  * `resource_type`: Enum (`ARTICLE`, `VIDEO_LINK`, `STUDY_GUIDE_PDF`, `MODEL_PAPER`)
  * `content_text`: Text (Markdown / Simple Accessible Text)
  * `file_url`: String (Optional)
  * `external_url`: URL (Optional)
  * `accessibility_notes`: Text (e.g. Transcript included, audio described)

* **`MockTest`** (`learning_mocktest`):
  * `id`: UUID (PK)
  * `title`: String
  * `category`: String
  * `duration_minutes`: Integer (Base duration)
  * `total_marks`: Integer
  * `passing_percentage`: Integer
  * `instructions`: Text
  * `is_published`: Boolean

* **`Question`** (`learning_question`):
  * `id`: UUID (PK)
  * `mock_test`: ForeignKey(`MockTest`, cascade=CASCADE)
  * `question_text`: Text
  * `subject`: String (e.g. Reasoning, Quantitative, English)
  * `options`: JSONField (e.g. `[{"id": "A", "text": "..."}, {"id": "B", "text": "..."}]`)
  * `correct_option_id`: String ("A", "B", "C", "D")
  * `explanation`: Text

* **`TestAttempt`** (`learning_testattempt`):
  * `id`: UUID (PK)
  * `mock_test`: ForeignKey(`MockTest`)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `score`: Decimal
  * `total_questions`: Integer
  * `correct_count`: Integer
  * `incorrect_count`: Integer
  * `subject_breakdown`: JSONField
  * `started_at`: DateTime
  * `completed_at`: DateTime (Nullable)
  * `is_submitted`: Boolean

---

### 3.5 Support, Coaching & Notifications
* **`SupportTicket`** (`support_ticket`):
  * `id`: UUID (PK)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `category`: Enum (`APPLICATION_HELP`, `EXAM_ASSISTANCE`, `ACCESSIBILITY_NEEDS`, `COUNSELLING`, `TECHNICAL`, `COACH_REQUEST`)
  * `subject`: String
  * `description`: Text
  * `status`: Enum (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
  * `assigned_coach`: ForeignKey(`User`, nullable=True)
  * `created_at`, `updated_at`: DateTime

* **`SupportMessage`** (`support_message`):
  * `id`: UUID (PK)
  * `ticket`: ForeignKey(`SupportTicket`, cascade=CASCADE)
  * `sender`: ForeignKey(`User`)
  * `message`: Text
  * `created_at`: DateTime

* **`JobCoachAssignment`** (`support_coachassignment`):
  * `id`: UUID (PK)
  * `coach`: ForeignKey(`User`)
  * `candidate`: ForeignKey(`CandidateProfile`)
  * `is_active`: Boolean
  * `assigned_at`: DateTime
  * *Constraint: Unique(coach, candidate)*

* **`Notification`** (`notifications_notification`):
  * `id`: UUID (PK)
  * `user`: ForeignKey(`User`)
  * `title`: String
  * `message`: Text
  * `notification_type`: Enum (`JOB_ALERT`, `APPLICATION_UPDATE`, `EXAM_REMINDER`, `SUPPORT_REPLY`, `ANNOUNCEMENT`)
  * `link_url`: String
  * `is_read`: Boolean
  * `created_at`: DateTime

* **`SuccessStory`** (`support_successstory`):
  * `id`: UUID (PK)
  * `candidate_name`: String
  * `job_title`: String
  * `organization_name`: String
  * `story_text`: Text
  * `challenges_faced`: Text
  * `how_support_helped`: Text
  * `is_featured`: Boolean

* **`Feedback`** (`support_feedback`):
  * `id`: UUID (PK)
  * `user`: ForeignKey(`User`, nullable=True)
  * `rating`: Integer (1-5)
  * `category`: String
  * `feedback_text`: Text
  * `created_at`: DateTime

---

## 4. API Structure Grouped by Domain

All APIs follow `/api/<domain>/` with standard HTTP verbs, status codes, and JSON error bodies (`{"error": "message", "details": {...}}`).

### 4.1 Authentication & User Management (`/api/auth/`)
* `POST /api/auth/register/` — Register new Candidate or Parent
* `POST /api/auth/login/` — Authenticate and obtain session / JWT
* `POST /api/auth/logout/` — Invalidate session / blacklist token
* `GET  /api/auth/me/` — Retrieve authenticated user role and identity
* `POST /api/auth/password-reset/` — Password reset request (demo-ready)

### 4.2 Candidate Profiles (`/api/profiles/`)
* `GET    /api/profiles/me/` — Get full profile of current candidate
* `PUT    /api/profiles/me/personal/` — Update personal and contact details
* `PUT    /api/profiles/me/accessibility/` — Update disability category & accommodation needs
* `GET    /api/profiles/me/education/` & `POST /api/profiles/me/education/` — Education entries
* `DELETE /api/profiles/me/education/{id}/` — Remove education entry
* `GET    /api/profiles/me/skills/` & `POST /api/profiles/me/skills/` — Skills management
* `DELETE /api/profiles/me/skills/{id}/` — Remove skill entry
* `GET    /api/profiles/me/experience/` & `POST /api/profiles/me/experience/` — Experience entries

### 4.3 Jobs & Organizations (`/api/jobs/`)
* `GET  /api/jobs/` — List & search jobs (Query params: `search`, `sector`, `city`, `disability`, `page`)
* `GET  /api/jobs/{id}/` — View detailed job specifications and accessibility provisions
* `POST /api/jobs/{id}/save/` — Bookmark job
* `DELETE /api/jobs/{id}/unsave/` — Remove bookmark
* `GET  /api/jobs/saved/` — List saved jobs for the logged-in candidate
* `GET  /api/organizations/` — List organizations (Government / PSU / Private)
* `GET  /api/organizations/{id}/` — View organization profile & active job openings

### 4.4 Applications & Tracking (`/api/applications/`)
* `GET  /api/applications/` — Candidate's active applications list with current milestone
* `POST /api/applications/` — Submit application (internal) or log external application
* `GET  /api/applications/{id}/` — View application detail, requested accommodations, and timeline history
* `PATCH /api/applications/{id}/status/` — Update status (for candidates tracking external jobs or admins/employers)

### 4.5 Learning & Mock Tests (`/api/learning/`)
* `GET  /api/learning/courses/` — List accessible preparation courses
* `GET  /api/learning/courses/{id}/` — Course details & lessons/resources
* `GET  /api/learning/resources/` — List study materials, articles, and model papers
* `GET  /api/learning/mock-tests/` — List available mock exams
* `GET  /api/learning/mock-tests/{id}/` — Test metadata & instructions
* `POST /api/learning/mock-tests/{id}/start/` — Start attempt (returns questions without answers)
* `POST /api/learning/mock-tests/{id}/submit/` — Submit answers, calculates score & breakdown
* `GET  /api/learning/attempts/{id}/` — View attempt result and detailed explanations

### 4.6 Support & Coaching (`/api/support/`)
* `GET  /api/support/tickets/` — List user's support requests
* `POST /api/support/tickets/` — Open a new support ticket
* `GET  /api/support/tickets/{id}/` — View ticket dialogue
* `POST /api/support/tickets/{id}/messages/` — Send follow-up message in ticket
* `GET  /api/support/success-stories/` — Public list of inspirational stories
* `POST /api/support/feedback/` — Submit platform feedback

### 4.7 Job Coach Specific Endpoints (`/api/coach/`)
* `GET  /api/coach/candidates/` — List candidates assigned to this coach
* `GET  /api/coach/candidates/{id}/` — View candidate's career & accommodation profile (permitted fields only)
* `POST /api/coach/candidates/{id}/recommend-job/` — Recommend a specific job to the candidate
* `POST /api/coach/candidates/{id}/notes/` — Add private coaching observation note

### 4.8 Notifications (`/api/notifications/`)
* `GET   /api/notifications/` — List notifications for user
* `PATCH /api/notifications/{id}/read/` — Mark single notification as read
* `POST  /api/notifications/mark-all-read/` — Mark all as read

---

## 5. Frontend Folder Structure and Page List

### 5.1 Folder Structure (`frontend/`)
```text
frontend/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Font, Theme/A11y Provider, Header, Footer)
│   │   ├── page.tsx                  # Public Landing / Homepage
│   │   ├── login/page.tsx            # Login Page
│   │   ├── register/page.tsx         # Registration Page
│   │   ├── jobs/
│   │   │   ├── page.tsx              # Job Search & Filter Listing
│   │   │   └── [id]/page.tsx         # Job Detail Page & Apply Modal
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Personalized Candidate Dashboard
│   │   │   ├── profile/page.tsx      # Comprehensive Profile & Accessibility Settings
│   │   │   ├── applications/page.tsx # Application Tracking Timeline & Milestones
│   │   │   ├── saved-jobs/page.tsx   # Bookmarked Jobs
│   │   │   ├── notifications/page.tsx# Notifications Center
│   │   │   └── settings/page.tsx     # Account & Accessibility Preferences
│   │   ├── learning/
│   │   │   ├── page.tsx              # Learning Catalog & Prep Modules
│   │   │   ├── courses/[id]/page.tsx # Course & Lesson Viewer
│   │   │   └── mock-tests/
│   │   │       ├── page.tsx          # Available Mock Tests List
│   │   │       ├── [id]/page.tsx     # Accessible Test Engine
│   │   │       └── [id]/results/page.tsx # Performance & Score Breakdown
│   │   ├── support/
│   │   │   ├── page.tsx              # Support Center & Ticket Form
│   │   │   └── tickets/[id]/page.tsx # Support Ticket Discussion
│   │   ├── coach/
│   │   │   └── page.tsx              # Job Coach Dashboard (Assigned Candidates)
│   │   ├── success-stories/page.tsx  # Inclusive Success Stories
│   │   └── feedback/page.tsx         # Feedback Form
│   ├── components/
│   │   ├── common/                   # Core Accessible Primitives
│   │   │   ├── Button.tsx            # High-contrast, keyboard-focusable button
│   │   │   ├── Input.tsx             # Accessible labeled input with error aria-describedby
│   │   │   ├── Select.tsx            # Semantic native select with accessible styling
│   │   │   ├── Modal.tsx             # Focus-trapped accessible dialog
│   │   │   ├── Badge.tsx             # Semantic badge (no color-only indicator)
│   │   │   ├── LoadingSpinner.tsx    # Screen-reader announced spinner
│   │   │   └── SkipLink.tsx          # "Skip to Main Content" accessible bypass link
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Responsive, fully keyboard accessible navbar
│   │   │   ├── Footer.tsx            # Simple, well-structured footer
│   │   │   └── AccessibilityBar.tsx  # Quick controls: Text Size (A- / A / A+), High Contrast, Reduced Motion
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx           # Job item with badges, deadline countdown, save button
│   │   │   ├── JobFilters.tsx        # Accessible sidebar filter controls
│   │   │   └── ApplyModal.tsx        # Accommodation request checklist & application submit
│   │   ├── applications/
│   │   │   └── StatusTimeline.tsx    # Step-by-step progress tracker with readable status badges
│   │   └── learning/
│   │       └── TestQuestionCard.tsx  # Keyboard navigable question with clear radio choices
│   ├── context/
│   │   ├── AccessibilityContext.tsx  # Text size, contrast mode, reduced motion state
│   │   └── AuthContext.tsx           # Auth session, current user, role helpers
│   ├── services/
│   │   ├── api.ts                    # Reusable fetch client with auth token/cookie handling
│   │   ├── authService.ts
│   │   ├── jobService.ts
│   │   ├── applicationService.ts
│   │   ├── learningService.ts
│   │   └── supportService.ts
│   ├── types/                        # TypeScript interfaces and types
│   │   ├── user.ts
│   │   ├── profile.ts
│   │   ├── job.ts
│   │   ├── application.ts
│   │   ├── learning.ts
│   │   └── support.ts
│   └── styles/
│       └── globals.css               # Focus outlines, high-contrast tokens, typography
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 6. Build Phases (Each with Runnable & Testable Milestones)

### Phase 1 — Project Foundation & Authentication Setup
* **What is built**:
  * Next.js setup with Tailwind and strict TypeScript.
  * Accessibility baseline: `SkipLink`, `AccessibilityBar` (font sizing, contrast switch), semantic accessible `Navbar` and `Footer`.
  * Django project setup with custom `User` model (`Candidate`, `Parent`, `Coach`, `Admin`), DRF, CORS, and auth endpoints (`/api/auth/register/`, `/api/auth/login/`, `/api/auth/me/`).
* **How to run & test**:
  * Run Django: `python manage.py runserver`.
  * Run Next.js: `npm run dev`.
  * Open `http://localhost:3000`: Verify home page, toggle font size/high contrast. Register a candidate, log in, view current user state.

### Phase 2 — Candidate Profile & Accessibility Needs
* **What is built**:
  * Backend models & endpoints for `CandidateProfile`, `AccessibilityProfile` (disability category, Washington Group difficulties, assistive devices, human assistance needs), `Education`, and `Skills`.
  * Frontend Profile page: Tabbed, accessible forms with clear headings, field validation, and assistive device / accommodation checklist.
* **How to run & test**:
  * Log in as candidate; navigate to `/dashboard/profile`.
  * Fill in personal info and accessibility requirements; verify data persists and computes profile completion score.

### Phase 3 — Jobs Discovery, Search & Bookmarks
* **What is built**:
  * `Organization` and `Job` models with sample fixtures (10+ realistic demo jobs across Govt, PSU, and Private sectors, with clear demo disclaimers).
  * Filterable search endpoint (`/api/jobs/`) with keyword, sector, and disability-suitability filters.
  * Frontend Job Search page (`/jobs`) and Job Detail page (`/jobs/[id]`) with deadline indicators, accommodation tags, and "Save Job" feature.
* **How to run & test**:
  * Browse `/jobs`: Filter by Government / Private or search by keyword; save a job; verify saved jobs under `/dashboard/saved-jobs`.

### Phase 4 — Application Submission & Progress Tracking
* **What is built**:
  * `JobApplication` model and status transition history. Support both direct application and external redirect tracking.
  * Accessible Apply modal where candidate selects required accommodations (e.g. Scribe, Extra Time).
  * Candidate Applications page (`/dashboard/applications`) with visual milestone timeline (Saved → Applied → Exam → Interview → Selected).
* **How to run & test**:
  * Apply for a job, select accommodations, and view application status timeline in `/dashboard/applications`.

### Phase 5 — Learning Materials & Accessible Mock Test Engine
* **What is built**:
  * `Course`, `LearningResource`, `MockTest`, `Question`, and `TestAttempt` models with demo test papers (Reasoning, Aptitude, Computer Skills).
  * Frontend Learning section (`/learning`) and Mock Test Engine (`/learning/mock-tests/[id]`):
    * Accessible question viewer with large radio buttons, keyboard shortcut support (Option A/B/C/D), accessible timer, and post-test review with subject breakdown.
* **How to run & test**:
  * Navigate to `/learning/mock-tests`, take a 10-question practice test, submit, and inspect score breakdown and correct answers.

### Phase 6 — Support Center, Notifications & Job Coach Workflows
* **What is built**:
  * `SupportTicket`, `SupportMessage`, and `JobCoachAssignment`.
  * In-app `Notification` center with real-time or polled alert badges.
  * Support request submission form and Coach view (`/coach`) to inspect assigned candidate progress and provide notes.
  * Public Success Stories and Feedback modules.
* **How to run & test**:
  * Submit a support ticket as candidate; log in as Job Coach to view the ticket and candidate's accommodation requirements.

---

## 7. PRD Items to Postpone (And Why)

| Feature / Component | PRD Section | Why Postpone | Initial Simple Alternative |
|---|---|---|---|
| **Redis & Celery** | Section 33 | Adds external daemon dependencies (Redis server, Celery worker process) that complicate initial development, cross-platform local setup, and debugging. | Standard synchronous Django signals / service calls. Asynchronous queues can be enabled in Phase 10 before production. |
| **Cloud Object Storage (AWS S3 / Cloudflare R2)** | Section 31 | Requires external cloud credentials, billing accounts, and network access during initial local pairing. | Django's built-in `FileSystemStorage` configured with private media paths and a protected DRF file download view. Seamless drop-in to `django-storages` later. |
| **Twilio SMS Gateway & Transactional Email (Resend/SES)** | Section 32 | Requires paid SMS API keys, Twilio sender registration, and DLT registration in India for transactional SMS. | Django's console email backend (`EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`) and in-app Notification center. All notifications render in the UI. |
| **AI Matching & Conversational Bot** | Section 23 | The PRD explicitly states: *"AI should be implemented as a supporting capability, not as the foundation... Do not make unsupported legal/disability decisions."* High-risk of hallucinating job rules or eligibility. | Robust deterministic rules-based matching (matching candidate skills, education, and accommodation capabilities against job requirements), which is 100% transparent, explainable, and testable. LLM assistive features can be layered after core workflows are verified. |
| **Elasticsearch / OpenSearch** | Section 34 | PRD explicitly states: *"Start with PostgreSQL search/filtering. Do not introduce Elasticsearch/OpenSearch unless the application's scale actually requires it."* | PostgreSQL `icontains` and full-text search (`SearchVector`), keeping the stack lean and zero-maintenance. |

---

## 8. Development & Safety Guidelines Reminder
* **Code Clarity**: Simple, readable code with short, natural comments. No clever tricks or unnecessary libraries.
* **Clean Architecture**: Business logic isolated in `services/`, models and serializers cleanly separated. Views remain thin.
* **Security & Privacy**: Passwords hashed, permissions enforced on Django REST backend, sensitive fields (UDID, disability diagnosis) hidden from public endpoints.
* **Accessibility**: Semantic HTML, labels for every control, visible focus indicators, aria attributes, no color-only status indicators, responsive mobile layouts.
* **Demo Data Integrity**: Clearly marked mock government/PSU jobs and exam schedules with explicit demo tags.
