# Udyog Saarthi — Production Deployment Checklist

> **Target Release:** Production Launch  
> **Applicable Stack:** Next.js 14 Frontend + Django REST Framework Backend + PostgreSQL + Redis/Celery

---

## 1. Secrets & Environment Configuration

### Backend (`backend/.env`)
- [ ] **`SECRET_KEY`**: Set to a cryptographically strong, random string (at least 50 characters).
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(50))"
  ```
- [ ] **`DEBUG`**: Explicitly set to `False`. *(The application will raise an error if SECRET_KEY is missing or empty when launching).*
- [ ] **`ALLOWED_HOSTS`**: Restricted strictly to your production domain(s) and load balancer IPs:
  ```env
  ALLOWED_HOSTS=api.udyogsaarthi.in,udyogsaarthi.in
  ```
- [ ] **`CORS_ALLOWED_ORIGINS`**: Restricted to your frontend origin:
  ```env
  CORS_ALLOWED_ORIGINS=https://udyogsaarthi.in
  ```
- [ ] **`FRONTEND_BASE_URL`**: Set to the public frontend URL (used in password reset emails):
  ```env
  FRONTEND_BASE_URL=https://udyogsaarthi.in
  ```
- [ ] **`DB_PASSWORD` & Credentials**: Strong production credentials for PostgreSQL (`USE_SQLITE=False`).
- [ ] **`AI_ASSISTANT_API_KEY`**: Production Gemini or OpenAI API key set (or leave blank to rely on the built-in heuristic plain-language generator).
- [ ] **Object Storage (`USE_S3_STORAGE=True`)**: Private AWS S3, MinIO, or Cloudflare R2 bucket with `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_STORAGE_BUCKET_NAME`.
- [ ] **Email Service**: Configure SMTP (`EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`) with SendGrid / Amazon SES / Mailgun credentials.

### Frontend (`frontend/.env.local`)
- [ ] **`NEXT_PUBLIC_API_URL`**: Pointing to the production backend HTTPS API:
  ```env
  NEXT_PUBLIC_API_URL=https://api.udyogsaarthi.in/api
  ```
- [ ] **No Secrets Exposed**: Confirm that **only** `NEXT_PUBLIC_API_URL` is exposed to the browser. Never place private keys or database passwords in frontend `.env`.

---

## 2. HTTPS & Network Security

- [ ] **SSL / TLS Certificate**: Valid certificate provisioned on Cloudflare, Nginx, Caddy, or AWS ALB.
- [ ] **Reverse Proxy SSL Header**: Reverse proxy forwards the protocol header:
  ```nginx
  proxy_set_header X-Forwarded-Proto $scheme;
  ```
  *(Django automatically honors `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` when `DEBUG=False`).*
- [ ] **HTTP to HTTPS Redirection**: Enforced via `SECURE_SSL_REDIRECT = True` or web server rewrite rules.
- [ ] **HSTS (HTTP Strict Transport Security)**: Active with 1-year duration (`31536000` seconds), preload, and subdomains enabled.
- [ ] **Secure Cookies**: Both `SESSION_COOKIE_SECURE = True` and `CSRF_COOKIE_SECURE = True` active.
- [ ] **SameSite**: Cookies set to `Lax` to safeguard against CSRF.

---

## 3. HttpOnly Cookie Authentication & Domain Alignment

The platform uses HttpOnly, secure JWT cookies (`access_token`, `refresh_token`) instead of localStorage, completely eliminating XSS token theft.

### Cookie Domain Alignment Architectures

| Deployment Pattern | Frontend URL | Backend API URL | `COOKIE_DOMAIN` | `COOKIE_SAMESITE` | `COOKIE_SECURE` |
|---|---|---|---|---|---|
| **Same Domain (Reverse Proxy / Recommended)** | `https://udyogsaarthi.in` | `https://udyogsaarthi.in/api` | *(leave empty / None)* | `Lax` | `True` |
| **Shared Parent Domain (Subdomains)** | `https://app.udyogsaarthi.in` | `https://api.udyogsaarthi.in` | `.udyogsaarthi.in` | `Lax` | `True` |
| **Distinct Cross-Domains** | `https://frontend.vercel.app` | `https://backend.railway.app` | *(leave empty / None)* | `None` *(requires HTTPS)* | `True` |
| **Local Development** | `http://localhost:3000` | `http://localhost:8000/api` | *(leave empty / None)* | `Lax` | `False` |

### Environment Variables Checklist

#### Backend (`backend/.env`)
- [ ] **`COOKIE_DOMAIN`**: Set to your shared root domain (e.g. `.udyogsaarthi.in`) if frontend and backend share subdomains, or leave empty if using reverse proxy or distinct domains.
- [ ] **`COOKIE_SECURE`**: Set to `True` for HTTPS environments (`False` only on local HTTP).
- [ ] **`COOKIE_SAMESITE`**: Set to `Lax` (recommended). If frontend and backend are completely separate top-level domains, set to `None` (which requires `COOKIE_SECURE=True`).
- [ ] **`CORS_ALLOWED_ORIGINS`**: Exact frontend origins (no wildcards `*` allowed when credentials are enabled):
  ```env
  CORS_ALLOWED_ORIGINS=https://udyogsaarthi.in,https://app.udyogsaarthi.in
  ```
- [ ] **`CSRF_TRUSTED_ORIGINS`**: Explicit origins trusted for CSRF token validation on write operations:
  ```env
  CSRF_TRUSTED_ORIGINS=https://udyogsaarthi.in,https://app.udyogsaarthi.in
  ```

#### Frontend (`frontend/.env.local`)
- [ ] **`NEXT_PUBLIC_API_URL`**: HTTPS URL to backend API without trailing slash:
  ```env
  NEXT_PUBLIC_API_URL=https://api.udyogsaarthi.in/api
  ```

### How to Inspect Cookies in Browser DevTools

1. Open DevTools (**F12** or **Ctrl+Shift+I** / **Cmd+Option+I**).
2. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox).
3. Expand **Cookies** in the left sidebar and click your domain.
4. Verify the following:
   - `access_token`: Has `HttpOnly` checked, `SameSite` set to `Lax`, `Path` is `/`.
   - `refresh_token`: Has `HttpOnly` checked, `SameSite` set to `Lax`, `Path` is `/api/auth/`.
   - `csrftoken`: Has `HttpOnly` **unchecked** (readable so frontend can send `X-CSRFToken` header).
   - In production, `Secure` must be checked for all cookies.
5. In the **Network** tab, inspect any `POST`/`PUT`/`PATCH`/`DELETE` request to `/api/`:
   - Under **Request Headers**, verify `Cookie: access_token=...; csrftoken=...` and `X-CSRFToken: ...`.

---

## 4. Security Headers Verification

Verify that both Next.js and Django return the following response headers:

| Header | Expected Value | Purpose |
|---|---|---|
| **Content-Security-Policy** | `default-src 'self' ...; frame-ancestors 'none';` | Blocks unauthorized script injection and clickjacking. |
| **X-Frame-Options** | `DENY` | Prevents iframe embedding / UI redressing. |
| **X-Content-Type-Options** | `nosniff` | Stops MIME-type sniffing. |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Protects candidate privacy across cross-origin links. |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=()` | Disables unused browser hardware sensors. |

Test using curl:
```bash
curl -I https://api.udyogsaarthi.in/api/jobs/
curl -I https://udyogsaarthi.in/
```

---

## 5. Database & Static Asset Setup

- [ ] Run latest migrations on the production database:
  ```bash
  python manage.py migrate --noinput
  ```
- [ ] Collect backend static assets:
  ```bash
  python manage.py collectstatic --noinput
  ```
- [ ] Seed initial administrative user or run setup commands:
  ```bash
  python manage.py createsuperuser
  ```
- [ ] Build and start the Next.js production server:
  ```bash
  npm run build
  npm start
  ```

---

## 6. Background Task Processing

- [ ] **Redis**: Running securely with authentication if exposed to public networks.
- [ ] **Celery Worker**: Spawn worker processes with:
  ```bash
  celery -A core worker -l info
  ```
- [ ] **Celery Beat**: Scheduler running for periodic deadline reminders:
  ```bash
  celery -A core beat -l info
  ```

---

## 7. Post-Deployment Smoke Test (Verification)

1. [ ] **Public Discovery**: Visit `/` and `/jobs` without logging in. Verify search and filter works.
2. [ ] **Cookie Consent**: Verify banner appears, choices save to `localStorage`, and footer "Cookie Settings" reopens it.
3. [ ] **Candidate Registration**: Register a new candidate account. Check that terms consent checkbox is enforced and timestamp recorded.
4. [ ] **Authentication**: Log in with candidate and admin accounts. Verify JWT tokens are stored securely.
5. [ ] **Accessible Test Engine**: Launch mock test `/learning/mock-tests/1/take`, test keyboard shortcuts, submit, and view scorecard.
6. [ ] **Admin Console**: Visit `/admin-panel` with non-admin (verify 403 Forbidden). Visit with admin (verify dashboard and audit log).
7. [ ] **Legal Pages**: Check `/privacy-policy` and `/terms` render cleanly with no layout breaks.
8. [ ] **Candidate Documents**: In `/dashboard/profile` Section 6, upload a test PDF/image document. Verify 5-minute signed URL download works and deletion removes the document.

---

## 8. Private Document Storage (S3 / Cloudflare R2) Configuration

Candidate documents (resumes, certificates) require private, non-public storage with signed URL access.

### 8.1 Environment Variables (`backend/.env`)

```env
USE_S3_STORAGE=True
AWS_ACCESS_KEY_ID=<your-iam-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-iam-secret-access-key>
AWS_STORAGE_BUCKET_NAME=udyog-saarthi-candidate-documents
AWS_S3_REGION_NAME=ap-south-1
# For Cloudflare R2 (optional, omit for native AWS S3):
# AWS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
```

### 8.2 AWS S3 Bucket Setup

1. **Bucket Creation**: Create a private S3 bucket (e.g. `udyog-saarthi-candidate-documents`).
2. **Block Public Access**: Ensure **all 4 Block Public Access settings are Enabled**:
   - [x] Block public ACLs
   - [x] Ignore public ACLs
   - [x] Block public bucket policies
   - [x] Restrict public bucket policies
3. **Default Encryption**: Enable Server-Side Encryption with Amazon S3 managed keys (**SSE-S3**) or AWS KMS.
4. **Bucket CORS Configuration**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["https://udyogsaarthi.in"],
       "ExposeHeaders": ["Content-Disposition", "Content-Type", "ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
5. **Lifecycle Rule**: Configure a lifecycle rule to abort incomplete multipart uploads after 7 days.

### 8.3 Cloudflare R2 Setup (Alternative to AWS S3)

1. Create an R2 bucket in Cloudflare dashboard.
2. Under bucket settings, verify that **Public Access is Disabled** (do not connect a custom domain or enable R2.dev public URL).
3. Generate an R2 API Token with **Object Read & Write** permissions.
4. Set `AWS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com` and `AWS_S3_REGION_NAME=auto`.

### 8.4 Local Development Mode

When `USE_S3_STORAGE=False` (default for local development):
- Documents are written to `PRIVATE_STORAGE_ROOT` (`backend/private_media/`).
- The directory is **NOT** served publicly via Django's static/media URL patterns.
- Downloads are served strictly through the authenticated `LocalDocumentDownloadStreamView` (`/api/profile/documents/<uuid>/download/stream/`) using short-lived (300-second TTL) cryptographically signed tokens (`django.core.signing.TimestampSigner`).

---

## 9. Third-Party Email Setup (Resend / Amazon SES / SMTP)

All platform emails (password resets, notifications) are generated with both plain text and accessible HTML, and dispatched asynchronously through Celery.

### 9.1 Where to Put the Values: `backend/.env`
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=<your-smtp-api-key-or-password>
EMAIL_FROM="Udyog Saarthi" <noreply@yourdomain.in>
EMAIL_REPLY_TO=support@yourdomain.in
```

### 9.2 Provider Specifics
- **Resend**: Host: `smtp.resend.com`, Port: `587`, User: `resend`, Password: `re_...`
- **Amazon SES**: Host: `email-smtp.<region>.amazonaws.com`, Port: `587`, User: `<SES_SMTP_USERNAME>`, Password: `<SES_SMTP_PASSWORD>`. Verify your sending domain and DKIM/SPF records in the AWS SES console.

### 9.3 Verification Command
Verify email dispatch without waiting for user action:
```bash
# Test synchronous direct delivery:
python manage.py send_test_email you@example.com --sync

# Test asynchronous delivery via Celery worker:
python manage.py send_test_email you@example.com
```

---

## 10. Cloudflare Turnstile Bot Protection

Turnstile protects public registration and support ticket creation.

### 10.1 Where to Put the Values
- **Backend (`backend/.env`)**:
  ```env
  TURNSTILE_SECRET_KEY=<0x4AAAAAA...your-real-secret-key>
  ```
- **Frontend (`frontend/.env.local`)**:
  ```env
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=<0x4AAAAAA...your-real-site-key>
  ```

### 10.2 Production Fail-Closed Rules
- In development (`DEBUG=True`), Cloudflare test pass tokens (`1x00000000000000000000AA`) are accepted.
- In production (`DEBUG=False`), test keys are **strictly rejected**. If Cloudflare servers cannot be contacted or the secret key is invalid, the backend **fails closed** (returns 400 with a friendly retry message).

---

## 11. AI Job Explainer Service & Zero-PII Policy

The AI job explainer simplifies complex government recruitment notices and jargon into plain, accessible language for candidates with diverse cognitive, visual, and sensory needs.

### 11.1 Where to Put the Values: `backend/.env`
```env
AI_ASSISTANT_API_KEY=<your-google-gemini-api-key>
AI_MODEL_NAME=gemini-1.5-flash
```
> [!IMPORTANT]
> The Gemini API key is **only read on the backend** and must **never** be added to `frontend/.env.local` or client-side code.

### 11.2 Privacy & Security Guarantees
- **Zero Candidate PII**: The prompt sent to Google Gemini contains *only* the job description and user query. Candidate names, emails, disability classifications, and UDID numbers are never sent to third-party AI APIs.
- **Fail-Safe Fallback**: If the Gemini API is unavailable or times out (>8 seconds), the backend automatically falls back to deterministic rule-based text simplification.
- **Input Capping**: Prompts are strictly capped (queries to 500 characters, job descriptions to 3000 characters) to avoid prompt injection and control API token consumption.

---

## 12. India SMS Provider Integration & TRAI DLT Registration

In India, commercial and transactional SMS messages (like OTPs and application deadline alerts) are governed by TRAI's Telecom Commercial Communications Customer Preference Regulations (TCCCPR, 2018). All businesses must register on a DLT (Distributed Ledger Technology) platform before sending SMS to Indian numbers.

### 12.1 TRAI DLT Registration Steps
1. **Choose a Telecom DLT Portal**: Register as an Enterprise on any one telecom DLT portal (e.g., Jio DLT, Airtel DLT, Vodafone Idea DLT, or BSNL DLT). Registration on one portal is recognized across all telecom operators.
2. **KYC Documents Required**:
   - Company PAN card, Certificate of Incorporation / Society Registration.
   - Authorized signatory identity and authorization letter on official letterhead.
3. **Register Principal Entity (PE)**: Obtain your unique **PE ID** (Principal Entity ID).
4. **Header (Sender ID) Registration**:
   - Apply for a 6-character alphabetic Header for Transactional / Service Implicit SMS (e.g. `UDYOGS`).
5. **Content Template Registration**:
   - Register templates for every message type (e.g. OTP verification, application status alert).
   - Use standardized placeholders: `{#var#}` for variables (such as OTP codes or candidate names).
   - Once approved by the telecom committee, each template receives a **DLT Template ID (`DLT_TE_ID`)**.
6. **Link DLT Account with SMS Gateway**:
   - In your MSG91 (or alternative SMS provider) dashboard, add your DLT PE ID, approved Sender ID (`UDYOGS`), and approved template IDs.

### 12.2 Where to Put the Values: `backend/.env`
For production MSG91:
```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=<your-msg91-auth-key>
MSG91_SENDER_ID=UDYOGS
MSG91_DLT_TE_ID=<110716...your-approved-dlt-template-id>
MSG91_ROUTE=4
```
For Twilio:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_FROM_NUMBER=+1...
```
For Local Dev / Staging:
```env
SMS_PROVIDER=fake
```
*(The fake provider logs OTPs to local console without sending external network requests).*

---

## 13. Sentry Error Monitoring & APM (Zero-PII)

Sentry tracks runtime exceptions and performance metrics across both the backend Django API and frontend Next.js application without logging any candidate personal or disability information.

### 13.1 Where to Put the Values
- **Backend (`backend/.env`)**:
  ```env
  SENTRY_DSN=https://<public-key>@<org>.ingest.sentry.io/<project-id>
  SENTRY_TRACES_SAMPLE_RATE=0.1
  ```
- **Frontend (`frontend/.env.local`)**:
  ```env
  NEXT_PUBLIC_SENTRY_DSN=https://<public-key>@<org>.ingest.sentry.io/<project-id>
  ```
*(Leave these variables empty in development or if error monitoring is not required; Sentry will remain completely inactive).*

### 13.2 Privacy & PII Scrubbing Rules Enforced
- **Candidate PII Scrubbing**: Both client and server configurations use a custom `before_send` hook that completely removes user emails, usernames, IP addresses, authentication tokens (`access_token`, `refresh_token`), CSRF tokens, and HTTP request body contents before error events leave the server.
- **No Document Leaks**: Document payloads and uploads are never captured in error traces.

---

## 14. Legal Pages & Compliance Configuration

Platform policies, terms of service, and grievance redressal officer details are managed dynamically via centralized configuration.

### 14.1 Where to Put the Values: `frontend/.env.local`
```env
NEXT_PUBLIC_ORG_NAME=Udyog Saarthi Initiative
NEXT_PUBLIC_CONTACT_EMAIL=contact@udyogsaarthi.in
NEXT_PUBLIC_LEGAL_EMAIL=legal@udyogsaarthi.in
NEXT_PUBLIC_HELPLINE_PHONE=+91 11 2345 6789
NEXT_PUBLIC_POSTAL_ADDRESS=Department of Empowerment of Persons with Disabilities, 5th Floor, Pt. Deendayal Antyodaya Bhawan, CGO Complex, Lodhi Road, New Delhi 110003, India
NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME=Smt. Priya Sharma
NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL=grievance@udyogsaarthi.in
NEXT_PUBLIC_LEGAL_LAST_UPDATED=October 9, 2026
NEXT_PUBLIC_LEGAL_REVIEWED=false
```

### 14.2 Legal Review Sign-Off
- When `NEXT_PUBLIC_LEGAL_REVIEWED=false` (default), a prominent warning banner is displayed at the top of `/terms` and `/privacy-policy` warning users and auditors that the text is an unreviewed draft.
- Once platform counsel signs off, toggle `NEXT_PUBLIC_LEGAL_REVIEWED=true` to dismiss the draft alert banner.
