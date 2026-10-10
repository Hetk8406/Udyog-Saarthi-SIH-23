# Udyog Saarthi (उद्योग सारथी)

> **An Accessible Employment and Career Preparation Platform for Persons with Disabilities (PwD)**  
> Built for **Smart India Hackathon (SIH 2023)** | **Problem Statement SIH-1333**  
> Aligned with the **Rights of Persons with Disabilities (RPwD) Act 2016** and the **Digital Personal Data Protection (DPDP) Act 2023**.

[![CI Pipeline](https://github.com/Hetk8406/Udyog-Saarthi-SIH-23/actions/workflows/ci.yml/badge.svg)](https://github.com/Hetk8406/Udyog-Saarthi-SIH-23/actions/workflows/ci.yml)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Django 5.1](https://img.shields.io/badge/Django-5.1-092E20?style=flat&logo=django)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [The Candidate Journey](#the-candidate-journey)
3. [Key Features](#key-features)
4. [Accessibility Implementation](#accessibility-implementation)
5. [Security & Privacy Architecture](#security--privacy-architecture)
6. [Tech Stack](#tech-stack)
7. [System Architecture](#system-architecture)
8. [Folder Structure](#folder-structure)
9. [Getting Started](#getting-started)
10. [Running with Docker](#running-with-docker)
11. [Environment Variables](#environment-variables)
12. [Seeded Demo Accounts](#seeded-demo-accounts)
13. [Running Tests & Quality Checks](#running-tests--quality-checks)
14. [API Overview](#api-overview)
15. [Screenshots](#screenshots)
16. [Current Status & Limitations](#current-status--limitations)
17. [Roadmap](#roadmap)
18. [Documentation Index](#documentation-index)
19. [Contributing, Licence & Contact](#contributing-licence--contact)

---

## About the Project

### The Problem
Finding meaningful employment remains an uphill struggle for Persons with Disabilities (PwD) across India, particularly individuals with neurodivergent conditions, intellectual disabilities, autism spectrum disorders, mental illness, or multiple disabilities. Government and Public Sector Undertaking (PSU) job notifications are often dense, multi-page PDFs with difficult language, obscure reservation breakdowns (such as the mandatory 4% reservation under Section 34 of the RPwD Act 2016), and inaccessible application gateways. Furthermore, candidates rarely receive reasonable accommodations during preparatory examinations or structured guidance from specialized job coaches.

### Who It Is For
- **Candidates with Disabilities:** Job seekers across all 21 categories recognized by the RPwD Act 2016, with accommodations for locomotor, visual, hearing, intellectual, and neurodivergent conditions.
- **Parents and Guardians:** Authorized family members who can review opportunities, manage documents, and follow up on applications with explicit candidate consent.
- **Job Coaches & Counsellors:** Vocational experts who review candidate barriers, formulate personalized guidance notes, and suggest suitable openings.
- **Employers & System Administrators:** Government agencies, PSUs, and inclusive private employers who post vacancies and monitor employment pipelines.

### What It Does
Built for **Smart India Hackathon 2023 (Problem Statement 1333: Coach Programme & Job Support Services)**, Udyog Saarthi provides an end-to-end accessible career ecosystem:
1. Translates intricate job notices into plain, accessible summaries.
2. Identifies matching vacancies based on disability reservation quotas and personal functional profiles.
3. Provides mock tests with government-mandated compensatory time accommodations.
4. Connects candidates with assigned coaches and supports authorized guardian delegation.

---

## The Candidate Journey

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│  1. Onboarding  │ ──> │ 2. Profile & Needs   │ ──> │ 3. Job Discovery       │
│ Register & consent    │ Complete functional  │     │ Search 4% reservations │
│ to DPDP notice  │     │ Washington Group Qs  │     │ & private openings     │
└─────────────────┘     └──────────────────────┘     └────────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│ 6. Placed!      │ <── │ 5. Learn & Prepare   │ <── │ 4. Apply & Track       │
│ Onboarding &    │     │ Take compensatory    │     │ Upload documents &     │
│ workplace audit │     │ mock tests & courses │     │ track status timeline  │
└─────────────────┘     └──────────────────────┘     └────────────────────────┘
```

1. **"I want a job":** Candidate signs up securely, acknowledges clear consent under the DPDP Act 2023, and logs in.
2. **Build an Accommodation Profile:** Candidate documents their qualifications, functional needs using the Washington Group Extended Set questions, assistive devices, and exam requirements (e.g., scribe, extra time).
3. **Discover Verified Jobs:** Portal filters vacancies across Central/State Government, PSUs, and private equal-opportunity employers by specific reservation categories.
4. **Apply & Upload Documents:** Candidate attaches their resume and certificates using private, virus-checked storage with signed download URLs.
5. **Practice with Accommodations:** Candidate takes accessible mock exams with automatic compensatory time (+20 minutes/hour) or untimed modes, reviewing detailed answer explanations.
6. **Coaching & Placement:** Assigned job coaches provide guidance through support tickets, track application stages, and celebrate successful job placement.

---

## Key Features

### Accounts & Role-Based Access Control (RBAC)
- **Four Distinct Roles:** Candidate, Parent/Guardian, Job Coach, and Administrator, each with tailored navigation, permissions, and security controls.

### Candidate Profile & Functional Accommodations
- **RPwD & Washington Group Profiles:** Captures functional difficulty levels (vision, hearing, mobility, cognition), assistive devices, and exam scribe requirements.
- **UDID Privacy:** UDID numbers are masked and never publicly displayed.

### Job Discovery & Reservation Matching
- **Sector Filtering:** Search government vacancies, PSUs, and private inclusive employers by location, salary, experience, and specific disability quota.
- **Plain-Language Explanations:** Explains legal eligibility terms, medical requirements, and physical suitability standards.

### Application Tracking & Timelines
- **Multi-Stage Visual Timeline:** Tracks applications through *Submitted*, *Under Review*, *Shortlisted*, *Interview Scheduled*, *Rejected*, and *Offered*.
- **External Redirect Support:** Tracks applications submitted through external government portals (e.g., UPSC, SSC, state PSCs) alongside internal applications.

### Secure Document Vault
- **Private File Storage:** Accepts resumes and educational certificates (PDF, DOCX, PNG, JPG) up to 5 MB with strict magic-byte validation.
- **Expiring Signed URLs:** Documents are stored under random UUID keys and downloaded only via 5-minute signed URLs after permission checks.

### Accessible Learning & Mock Test Engine
- **Compensatory Time Allocations:** Automatically awards 20 minutes extra per hour in compliance with Ministry of Social Justice guidelines, alongside 1.5x and untimed modes.
- **Curated Course Library:** Open-access career preparation modules, computer skills courses, and interview preparation materials.

### Notification Center
- **In-App & Email Alerts:** Status changes, coach responses, ticket updates, and exam deadlines appear in the notification drawer and deliver via background tasks.

### Support Desk & Job Coach Workspace
- **Confidential Ticket System:** Two-way messaging between candidates and coaches for technical assistance, career counselling, and interview scheduling.
- **Coach Notes:** Coaches can attach private observations and recommended jobs to candidate records.

### Guardian Delegation
- **Granular Consent Controls:** Candidates can authorize guardians to view profile details, track applications, or download documents, with the ability to revoke access at any time.

### Administrator Command Center
- **Platform Governance:** Comprehensive metrics, job posting creation, vacancy approval, user role management, and immutable audit logging.

### Explainable AI Helpers (Gemini & Heuristic Engine)
- **Job Explainer:** Summarizes complex recruitment notices into 6th-grade plain language, highlighting duties, physical suitability, and key deadlines.
- **Smart Recommendations:** Suggests relevant openings and skill-building courses based on self-reported accommodations without sharing personal data with AI vendors.

### SEO, Cookie Consent & Compliance
- **Zero-PII Analytics:** Plausible analytics integration (cookieless and privacy-first).
- **Compliance Center:** Draft legal notices for DPDP Act 2023, Terms of Service, and an interactive cookie preferences manager.

---

## Accessibility Implementation

Accessibility is built directly into every page rather than added as an afterthought.

| Feature | Implementation Detail |
| :--- | :--- |
| **Accessibility Bar** | Persistent toolbar offering font scaling (100% to 130%), pure high contrast (black background `#000` with yellow text `#FFFF00`), and reduced motion. |
| **Skip-to-Content Link** | The first keyboard tab stop bypasses navigation bars and jumps directly to `<main id="main-content">`. |
| **Keyboard Navigation** | Visible 3px focus rings on all interactive elements; tab focus traps inside modals with <kbd>Escape</kbd> restoration. |
| **Touch Targets** | All buttons, links, and form inputs meet minimum touch targets of 44×44 pixels. |
| **Form Validation** | Descriptive inline error messages linked with `aria-describedby`; focus moves to the first invalid field upon submission failure. |
| **Semantic HTML** | Strict heading hierarchies (`<h1>` through `<h3>`), native `<button>` and `<dialog>` elements, and ARIA live regions for dynamic alerts. |
| **Automated Testing** | Integrated `@axe-core/playwright` test suite scans all 8 core public and authenticated pages with zero critical or serious WCAG 2.1 AA violations. |

> **Honest Note on User Testing:** While Udyog Saarthi passes automated WCAG 2.1 AA and AAA checks with axe-core and strict keyboard audits, **it has not yet undergone formal user testing with persons who rely on screen readers (such as NVDA, JAWS, or VoiceOver) on a daily basis**. Conducting moderated usability testing with diverse PwD users is planned in our roadmap.

---

## Security & Privacy Architecture

Security and privacy practices follow the Digital Personal Data Protection (DPDP) Act 2023:

- **HttpOnly Cookie Authentication:** JWT tokens are stored exclusively in HttpOnly, SameSite cookies (`access_token` and `refresh_token`), protecting against token theft via XSS.
- **CSRF Defense:** `django-cors-headers` combined with double-submit CSRF cookie checks (`csrftoken` header) on all state-changing endpoints.
- **UDID Data Protection:** Disability certificate numbers (UDID) are treated as sensitive health data. They are never transmitted to third parties, AI APIs, or unassigned accounts.
- **Rate Limiting:** Authentication, login, password reset, and upload endpoints enforce throttling (e.g., 5 requests/minute for login) to mitigate credential stuffing and DoS attacks.
- **Cloudflare Turnstile:** Bot and credential-stuffing defense on login and registration pages; fails closed in production (`DEBUG=False`).
- **File Upload Validation:** Files are checked against allowed extensions, maximum file sizes (5 MB), and verified binary magic bytes (`%PDF-`, `PK\x03\x04`, `\xFF\xD8\xFF`, `\x89PNG`).
- **Private Storage Isolation:** Documents are never stored in publicly reachable web roots. They are referenced by random UUID filenames and served through expiring signed URLs.
- **Audit Logging:** Every administrative action, document download by non-owners, and permission modification is logged with IP address and timestamp.
- **Security Headers:** Strict Content-Security-Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and HSTS.

---

## Tech Stack

All packages and versions are drawn directly from the codebase configuration files:

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js | `14.2.15` | App Router, SSR, Standalone Docker output |
| **UI Library** | React | `18.3.1` | Component lifecycle and hooks |
| **Language (Frontend)** | TypeScript | `5.4.5` | Strict static typing across client code |
| **Styling** | Tailwind CSS | `3.4.4` | Accessible utility styling & high-contrast variants |
| **Form Validation** | Zod | `4.6.5` | Client-side input and schema validation |
| **Image Processing** | Sharp | `0.35.5` | High-efficiency responsive image rendering |
| **Backend Framework** | Django | `5.1.x` (`>=5.0,<5.2`) | High-level Python web framework |
| **REST API** | Django REST Framework | `3.15.2` (`>=3.15.0`) | Serializers, views, and API permissions |
| **Authentication** | SimpleJWT | `5.3.1` (`>=5.3.0`) | HttpOnly cookie-based JWT authentication |
| **CORS Middleware** | django-cors-headers | `4.3.1` (`>=4.3.0`) | Controlled cross-origin resource sharing |
| **Password Hashing** | Argon2-cffi / BCrypt | `23.1.0` / `4.1.0` | Multi-algorithm password hashing |
| **Database** | PostgreSQL | `16-alpine` | Primary relational database |
| **Task Queue / Cache** | Redis & Celery | `7-alpine` / `5.3.6` | Asynchronous email and background task processing |
| **Object Storage** | Boto3 | `1.34.0` | S3 / MinIO / Cloudflare R2 signed URL downloads |
| **WSGI Server** | Gunicorn | `21.2.0` | Production Python WSGI HTTP server |
| **End-to-End Testing** | Playwright & axe-core | `1.64.0` / `4.13.0` | Automated browser, accessibility & keyboard testing |
| **Error Monitoring** | Sentry (Optional) | `@sentry/nextjs 8.55.2` / `sentry-sdk 2.0.0` | Privacy-scrubbed APM and error reporting |

---

## System Architecture

```mermaid
flowchart TD
    User["User Browser\n(Assistive Tech / Keyboard / Screen Reader)"]

    subgraph Frontend["Frontend Layer (Port 3000)"]
        NextJS["Next.js 14 App Router\n(Standalone Server)"]
        A11yBar["Accessibility Toolbar\n(Font / Contrast / Motion)"]
        Turnstile["Cloudflare Turnstile\n(Bot Shield)"]
    end

    subgraph Backend["API & Processing Layer (Port 8000)"]
        Gunicorn["Gunicorn WSGI / Django 5.1 REST API"]
        AuthModule["HttpOnly JWT Auth & RBAC"]
        AIEngine["Plain-Language AI Assistant\n(Gemini API / Heuristic Fallback)"]
        StorageEngine["Document Storage Engine\n(Local Private Vault / AWS S3 Boto3)"]
    end

    subgraph Workers["Background Asynchronous Layer"]
        Redis[("Redis 7 Broker & Cache")]
        CeleryWorker["Celery 5.3 Task Worker\n(Email & Notification Dispatch)"]
    end

    subgraph Storage["Data & Object Storage Layer"]
        Postgres[("PostgreSQL 16 DB\n(or SQLite in Dev)")]
        PrivateVault[("Private Bucket / Disk\n(UUID Keys, Signed URLs)")]
    end

    User -->|HTTPS Requests| NextJS
    NextJS -->|JSON REST over HttpOnly Cookies| Gunicorn
    Gunicorn --> AuthModule
    Gunicorn -->|CRUD Operations| Postgres
    Gunicorn -->|Enqueue Email / SMS| Redis
    Redis --> CeleryWorker
    Gunicorn --> StorageEngine
    StorageEngine --> PrivateVault
    Gunicorn -.->|Job Text Only (Zero PII)| AIEngine
```

---

## Folder Structure

```
udyog-saarthi/
├── backend/                   # Django REST Framework backend application
│   ├── accounts/              # User models, authentication views, and cookie handling
│   ├── admin_panel/           # Platform metrics, audit logs, and administration
│   ├── ai_assistant/          # Plain-language job notice explainer & recommendation engines
│   ├── applications/          # Job application models, status workflows, and timelines
│   ├── core/                  # Project settings, Turnstile helper, health check, and Celery setup
│   ├── jobs/                  # Vacancy listings, disability reservations, and bookmarks
│   ├── learning/              # Mock tests, question banks, and course resources
│   ├── notifications/         # In-app notifications and delivery preferences
│   ├── profiles/              # Candidate profiles, Washington Group assessments, and documents
│   └── support/               # Help tickets, coaching notes, and guardian delegation
├── frontend/                  # Next.js 14 App Router frontend application
│   ├── public/                # Static assets, logos, icons, and illustrations
│   ├── scripts/               # Lighthouse audits, image optimization, and link crawl checks
│   └── src/
│       ├── app/               # Accessible routes (jobs, learning, dashboard, support, admin)
│       ├── components/        # Accessible UI components, modal dialogues, and toolbars
│       ├── config/            # Legal metadata and compliance configuration
│       ├── context/           # Authentication and Accessibility context providers
│       ├── lib/               # Privacy-preserving analytics and Zod validation schemas
│       ├── services/          # Client-side API service connectors
│       └── types/             # TypeScript type and interface definitions
├── docs/                      # Architectural plans, PRD, audits, and checklists
├── e2e/                       # Playwright end-to-end tests (a11y, keyboard, journeys, mobile)
├── scripts/                   # Automated cross-platform setup, environment, and seed scripts
├── .github/                   # GitHub Actions CI workflow and Dependabot config
├── docker-compose.yml         # Container orchestration configuration
└── package.json               # Monorepo task runner (concurrent development)
```

---

## Getting Started

### Prerequisites

| Tool | Required Version | Verification Command |
| :--- | :--- | :--- |
| **Node.js** | `v18.0.0` or `v20.0.0+` | `node -v` |
| **npm** | `v9.0.0+` | `npm -v` |
| **Python** | `v3.10+` (tested on 3.12 & 3.13) | `python --version` |
| **PostgreSQL** | `v14+` *(Optional; SQLite supported locally)* | `psql --version` |
| **Docker & Compose** | Modern Docker Desktop *(Optional)* | `docker compose version` |

---

### Step-by-Step Installation (Local)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hetk8406/Udyog-Saarthi-SIH-23.git
   cd Udyog-Saarthi-SIH-23
   ```

2. **Copy environment configuration files:**
   ```bash
   # On Linux / macOS:
   cp backend/.env.example.dev backend/.env
   cp frontend/.env.local.example frontend/.env.local

   # On Windows (PowerShell):
   copy backend\.env.example.dev backend\.env
   copy frontend\.env.local.example frontend\.env.local
   ```

3. **Run the automated setup command:**
   ```bash
   npm run setup
   ```
   *This command automatically creates the Python virtual environment (`backend/.venv`), installs all backend dependencies from `requirements.txt`, installs root and frontend `npm` packages, and runs initial database migrations.*

4. **Seed initial demo accounts and listings:**
   ```bash
   npm run seed
   ```
   *Creates realistic demo users (candidate, guardian, coach, admin), vacancies with disability reservations, mock tests, and support tickets.*

5. **Start both development servers concurrently:**
   ```bash
   npm run dev
   ```

The applications will be available at:
- **Web Frontend:** [http://localhost:3000](http://localhost:3000)
- **REST API Backend:** [http://localhost:8000/api](http://localhost:8000/api)
- **System Health Check:** [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- **Django Admin Interface:** [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## Running with Docker

You can run the entire platform (PostgreSQL 16, Redis 7, Django API, Celery worker, and Next.js) in containers with Docker Compose.

```bash
# 1. Build container images and start services in the foreground
docker compose up --build

# Or run in detached background mode
docker compose up --build -d

# 2. Run migrations inside the container
docker compose exec backend python manage.py migrate

# 3. Seed demo data inside the container
docker compose exec backend python manage.py seed_demo_all

# 4. Stop all running containers
docker compose down
```

For live code editing with hot-reload inside Docker:
```bash
cp docker-compose.override.example.yml docker-compose.override.yml
docker compose up
```

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable Name | Purpose | Example / Default |
| :--- | :--- | :--- |
| `SECRET_KEY` | Cryptographic secret for signing sessions and tokens | *50+ character random string* |
| `DEBUG` | Enable developer debugging and error tracebacks | `True` (dev) / `False` (prod) |
| `ALLOWED_HOSTS` | Comma-separated list of valid Host header hostnames | `localhost,127.0.0.1` |
| `FRONTEND_BASE_URL` | Canonical URL of frontend for reset links | `http://localhost:3000` |
| `USE_SQLITE` | Toggle between SQLite and PostgreSQL | `True` (dev) / `False` (prod) |
| `DB_NAME` | PostgreSQL database name | `udyog_saarthi` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL user password | `postgres` |
| `DB_HOST` | PostgreSQL host address | `127.0.0.1` or `postgres` |
| `DB_PORT` | PostgreSQL network port | `5432` |
| `ALLOW_DEMO_SEED` | Guard preventing seed commands in production | `True` (dev) / `False` (prod) |
| `CORS_ALLOWED_ORIGINS` | Permitted cross-origin browser domains | `http://localhost:3000` |
| `COOKIE_SECURE` | Enforces `Secure` flag on JWT authentication cookies | `False` (http dev) / `True` (https) |
| `COOKIE_SAMESITE` | SameSite attribute for auth cookies | `Lax` |
| `EMAIL_BACKEND` | Django email backend class | `django.core.mail.backends.console.EmailBackend` |
| `EMAIL_FROM` | Default outgoing sender name and email address | `"Udyog Saarthi" <noreply@udyogsaarthi.in>` |
| `CELERY_BROKER_URL` | Redis connection URL for Celery task broker | `redis://127.0.0.1:6379/0` |
| `CELERY_ALWAYS_EAGER` | Runs Celery tasks synchronously (useful without Redis) | `True` (dev) / `False` (prod) |
| `AI_ASSISTANT_API_KEY` | Optional Google Gemini API key for plain-language summaries | *Optional (heuristics used if blank)* |
| `USE_S3_STORAGE` | Toggle between local disk vault and AWS S3 storage | `False` (local) / `True` (S3) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | Cloudflare dummy or live key |
| `SMS_PROVIDER` | Selected SMS dispatch driver (`fake`, `msg91`, `twilio`) | `fake` |
| `SENTRY_DSN` | Sentry backend error monitoring DSN | *Optional* |

### Frontend Configuration (`frontend/.env.local`)

| Variable Name | Purpose | Example / Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of Django REST API endpoints | `http://localhost:8000/api` |
| `NEXT_PUBLIC_SITE_URL` | Canonical base URL of Next.js frontend | `http://localhost:3000` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key | `1x00000000000000000000AA` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Domain identifier for Plausible analytics | `udyogsaarthi.in` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client monitoring DSN (PII scrubbed) | *Optional* |
| `NEXT_PUBLIC_ORG_NAME` | Official organization name for legal notices | `Udyog Saarthi Initiative` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | General contact email address | `contact@udyogsaarthi.in` |
| `NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME` | Grievance officer name under DPDP Act | `[NAME]` |
| `NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL` | Grievance redressal contact email | `grievance@udyogsaarthi.in` |
| `NEXT_PUBLIC_LEGAL_REVIEWED` | Toggle banner indicating draft legal text | `false` |

---

## Seeded Demo Accounts

> **DEMO USE ONLY:** These accounts are intended strictly for local development, hackathon evaluation, and exploratory testing. The seeding mechanism is blocked automatically whenever `DEBUG=False` or `ALLOW_DEMO_SEED=False`.

All demo accounts use the password: `Password123!`

| Role | Email | Purpose & Pre-Configured State |
| :--- | :--- | :--- |
| **Candidate** | `candidate@demo.com` | Primary job seeker profile with completed Washington Group accommodation needs, saved jobs, and submitted applications. |
| **Parent / Guardian** | `guardian@demo.com` | Delegated family account authorized to review candidate job opportunities and track application milestones. |
| **Job Coach** | `coach@demo.com` | Vocational specialist profile assigned to guide the demo candidate; access to coaching notes and support tickets. |
| **Administrator** | `admin@demo.com` | Superuser profile with full administrative permissions across `/admin-panel`, user controls, and system audit logs. |

---

## Running Tests & Quality Checks

All test suites can be executed using root npm scripts:

```bash
# 1. Run backend unit & integration tests (Django test runner)
npm test

# 2. Run frontend ESLint checks
npm --prefix frontend run lint

# 3. Run frontend TypeScript type checking
npm --prefix frontend run typecheck

# 4. Run frontend production build
npm --prefix frontend run build

# 5. Run automated Playwright end-to-end and accessibility test suite
npm run test:e2e
```

### Verified Test Suite Counts

- **Backend Test Suite (`npm test`):** **89 passed / 89 total**  
  *Covers authentication cookies, RBAC permissions, document magic-byte validation, signed URL generation, Turnstile verification, Celery email tasks, and rate limiters.*
- **Frontend Code Quality (`npm run lint` & `tsc`):** **0 errors / 0 warnings**
- **Playwright End-to-End Suite (`npm run test:e2e`):** **31 passed / 31 total**  
  *Covers user registration, application tracking, mock exams, support tickets, admin posting, keyboard-only navigation, mobile 375px viewports, and automated `@axe-core/playwright` accessibility audits across normal and high-contrast modes.*

---

## API Overview

All API endpoints are prefixed with `/api/`. A summary of primary endpoint groups:

| Endpoint Group | Primary Base URL | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| **Health** | `/api/health/` | Public | Unauthenticated health status for orchestrators |
| **Auth** | `/api/auth/` | Public / Authenticated | Register, login (cookies), logout, password reset |
| **Profiles** | `/api/profiles/` | Candidate, Coach, Guardian | Candidate profiles, functional needs, document vault |
| **Jobs** | `/api/jobs/` | Public / Authenticated | Job vacancies, search, filters, and bookmarks |
| **Applications** | `/api/applications/` | Candidate, Admin | Job applications, attachments, and status tracking |
| **Learning** | `/api/learning/` | Candidate, Coach | Practice courses, mock tests, timed exam attempts |
| **Notifications** | `/api/notifications/` | Authenticated | Notification list, mark-as-read, preferences |
| **Support** | `/api/support/` | Candidate, Coach, Guardian | Support tickets, messages, and coach case notes |
| **Admin Panel** | `/api/admin-panel/` | Admin only | Metrics, application review, audit log access |
| **AI Assistant** | `/api/ai-assistant/` | Authenticated | Plain-language job explainers and recommendations |

*For full request/response schemas, refer to the documentation in [docs/PLAN.md](docs/PLAN.md) and [docs/prd.md](docs/prd.md).*

---

## Screenshots

Placeholders for interface screenshots to include when preparing presentations:

| View | Screenshot Location | Description |
| :--- | :--- | :--- |
| **Home Page** | `![Home Page](docs/screenshots/home.png)` | Accessible landing page with high-contrast toggle and mission statement |
| **Candidate Dashboard** | `![Candidate Dashboard](docs/screenshots/dashboard.png)` | Application tracker, saved jobs, and profile completion checklist |
| **Job Discovery** | `![Job Discovery](docs/screenshots/jobs.png)` | Search filters showing 4% reservation categories and plain-language summaries |
| **Mock Exam Interface** | `![Mock Test](docs/screenshots/mock-test.png)` | Accessible test-taking screen with compensatory timer and contrast controls |
| **Admin Panel** | `![Admin Panel](docs/screenshots/admin-panel.png)` | Administrative dashboard with role management and audit logs |

> **To add your screenshots:** Create the directory `docs/screenshots/` and place your image files named `home.png`, `dashboard.png`, `jobs.png`, `mock-test.png`, and `admin-panel.png`.

---

## Current Status & Limitations

In the interest of full transparency for evaluators:

1. **Simulated Third-Party Services:** In the default local setup, outgoing emails are logged to the console or background worker logs, and SMS messages are handled by the pluggable fake driver. Real delivery requires valid credentials for Resend, Amazon SES, MSG91, or Twilio.
2. **Evaluation Data:** The database is populated with synthetic demo vacancies, mock questions, and test candidates.
3. **Draft Legal Documents:** The Privacy Policy, Terms of Service, and DPDP disclosures are structured drafts that require formal review by qualified legal counsel prior to commercial use.
4. **Automated Accessibility Testing:** The platform passes automated axe-core and keyboard accessibility checks; however, formal usability testing with native screen-reader users has not yet been performed.
5. **Single-Node Deployment:** Production deployment manifests are provided for containerized environments, but multi-region high-availability configurations are outside the hackathon scope.

---

## Roadmap

- [ ] **Empirical Usability Testing:** Conduct structured usability sessions with PwD participants using NVDA, JAWS, and mobile screen readers.
- [ ] **Multilingual Support:** Localize portal interfaces and job notices into Hindi, Tamil, Telugu, Marathi, and Bengali.
- [ ] **Official Government Portal Connectors:** Automate job discovery feeds from the National Career Service (NCS) and state disability portals.
- [ ] **Direct Employer Portal:** Dedicated self-service portal for verified employers to manage inclusive job listings and candidate interviews.
- [ ] **Audio Notice Narration:** Server-side generation of audio summaries for job descriptions to support low-literacy candidates.

---

## Documentation Index

Detailed documentation files located in the [`docs/`](docs/) directory:

- [docs/prd.md](docs/prd.md) — Comprehensive Product Requirements Document (PRD) detailing user personas, legal requirements, and system specifications.
- [docs/PLAN.md](docs/PLAN.md) — Architectural design, database schema diagrams, and technical specification.
- [docs/LAUNCH_AUDIT.md](docs/LAUNCH_AUDIT.md) — Pre-launch security, performance, and accessibility verification checklist.
- [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md) — Automated Lighthouse performance, SEO, and accessibility audit report.
- [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md) — Comprehensive project status report, security analysis, and test summary.
- [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md) — Production deployment instructions and environment configuration guide.

---

## Contributing, Licence & Contact

### Contributing
Contributions to improve accessibility, broaden test coverage, or add regional language translations are welcome. Please open an issue before submitting pull requests.

### Project Team & Contact
- **Project Lead / Developer:** `Het Bhalani / Jainam Gajjar, Het Kikani`
- **Email:** `hetkikani880@gmail.com`
- **Institution / Team:** Smart India Hackathon 2023 Team
- **GitHub Repository:** [https://github.com/Hetk8406/Udyog-Saarthi-SIH-23](https://github.com/Hetk8406/Udyog-Saarthi-SIH-23)
