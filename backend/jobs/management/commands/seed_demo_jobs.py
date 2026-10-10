from datetime import date, timedelta
from django.core.management.base import BaseCommand
from jobs.models import Organization, Job, SectorType, WorkMode, EducationLevel, JobStatus
from core.demo_guard import check_demo_seed_allowed


class Command(BaseCommand):
    help = 'Seeds 15 realistic demo jobs clearly marked as DEMO DATA across Government, PSU, and Private sectors'

    def handle(self, *args, **options):
        check_demo_seed_allowed()
        today = date.today()

        # Seed Organizations
        orgs_data = [
            # Government
            {'name': 'Central Staff Selection Commission (DEMO MOCK DEPT)', 'org_type': 'government_dept', 'website': 'http://localhost:3000/demo-portal'},
            {'name': 'State Postal & Communications Circle (DEMO MOCK ORG)', 'org_type': 'government_dept', 'website': 'http://localhost:3000/demo-portal'},
            {'name': 'National Statistical & Records Office (DEMO MOCK DEPT)', 'org_type': 'government_dept', 'website': 'http://localhost:3000/demo-portal'},
            {'name': 'Municipal Corporation Administration (DEMO MOCK DEPT)', 'org_type': 'government_dept', 'website': 'http://localhost:3000/demo-portal'},
            # PSU
            {'name': 'National Power Transmission Corp (DEMO MOCK PSU)', 'org_type': 'psu', 'website': 'http://localhost:3000/demo-portal'},
            {'name': 'Bharat Electronics Systems Ltd (DEMO MOCK PSU)', 'org_type': 'psu', 'website': 'http://localhost:3000/demo-portal'},
            {'name': 'State Bank of Enterprise & Finance (DEMO MOCK PSU)', 'org_type': 'psu', 'website': 'http://localhost:3000/demo-portal'},
            {'name': 'National Food Storage Corporation (DEMO MOCK PSU)', 'org_type': 'psu', 'website': 'http://localhost:3000/demo-portal'},
            # Private Sector
            {'name': 'Accessible Cloud Solutions India (DEMO FIRM)', 'org_type': 'private_sector', 'website': 'https://example.com/demo-cloud'},
            {'name': 'Inclusive Retail & Operations Ltd (DEMO FIRM)', 'org_type': 'private_sector', 'website': 'https://example.com/demo-retail'},
            {'name': 'Digital Assist Services Pvt Ltd (DEMO FIRM)', 'org_type': 'private_sector', 'website': 'https://example.com/demo-assist'},
            {'name': 'Equal Opportunity BPO & Tech (DEMO FIRM)', 'org_type': 'private_sector', 'website': 'https://example.com/demo-bpo'},
        ]

        org_objects = {}
        for o in orgs_data:
            org, _ = Organization.objects.get_or_create(
                name=o['name'],
                defaults={'org_type': o['org_type'], 'website': o['website'], 'verified': True}
            )
            org_objects[o['name']] = org

        # 15 Demo Jobs
        demo_jobs = [
            # 1
            {
                'org': 'Central Staff Selection Commission (DEMO MOCK DEPT)',
                'title': 'Junior Office Clerk (DEMO DATA - SIMULATED VACANCY)',
                'sector': SectorType.GOVERNMENT,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'New Delhi',
                'location_state': 'Delhi',
                'description': '[DEMO DATA] General office filing, routine correspondence, and dispatch documentation support.',
                'responsibilities': 'Drafting routine notices, entering file status into the central record system, coordinating office archives.',
                'minimum_education': EducationLevel.TWELFTH,
                'experience_required_months': 0,
                'salary_display': 'Pay Level 2 (₹19,900 - ₹63,200 / month)',
                'vacancies_total': 18,
                'vacancies_pwd_reserved': 6,
                'eligible_disabilities': ['locomotor', 'hearing_impairment', 'visual_impairment'],
                'accessibility_facilities': ['Wheelchair Ramp', 'Elevator Access', 'Ground Floor Exam Hall', 'Accessible Restroom'],
                'days_to_deadline': 25,
            },
            # 2
            {
                'org': 'State Postal & Communications Circle (DEMO MOCK ORG)',
                'title': 'Postal Assistant & Sorting Clerk (DEMO DATA - SIMULATED VACANCY)',
                'sector': SectorType.GOVERNMENT,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Jaipur',
                'location_state': 'Rajasthan',
                'description': '[DEMO DATA] Sorting regional packages, verifying postal codes, and logging customer tracking slips.',
                'responsibilities': 'Operating counter terminal software, generating daily balance sheets, dispatching priority articles.',
                'minimum_education': EducationLevel.TWELFTH,
                'experience_required_months': 0,
                'salary_display': 'Pay Level 4 (₹25,500 - ₹81,100 / month)',
                'vacancies_total': 12,
                'vacancies_pwd_reserved': 4,
                'eligible_disabilities': ['locomotor', 'hearing_impairment', 'specific_learning'],
                'accessibility_facilities': ['Ergonomic Seating', 'Quiet Workspace', 'Step-Free Entrance'],
                'days_to_deadline': 18,
            },
            # 3
            {
                'org': 'National Statistical & Records Office (DEMO MOCK DEPT)',
                'title': 'Data Entry Operator Grade B (DEMO DATA - SIMULATED VACANCY)',
                'sector': SectorType.GOVERNMENT,
                'work_mode': WorkMode.HYBRID,
                'location_city': 'Kolkata',
                'location_state': 'West Bengal',
                'description': '[DEMO DATA] High-accuracy numerical and statistical data transcription into the national statistical portal.',
                'responsibilities': 'Verify survey data spreadsheets, transcribe physical survey sheets, produce weekly summaries.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 6,
                'salary_display': 'Pay Level 5 (₹29,200 - ₹92,300 / month)',
                'vacancies_total': 8,
                'vacancies_pwd_reserved': 3,
                'eligible_disabilities': ['visual_impairment', 'locomotor', 'autism_spectrum'],
                'accessibility_facilities': ['Screen Reader Software (JAWS/NVDA)', 'High Contrast Monitor Display', 'Large Print Guidelines'],
                'days_to_deadline': 32,
            },
            # 4
            {
                'org': 'Municipal Corporation Administration (DEMO MOCK DEPT)',
                'title': 'Citizen Helpline Executive (DEMO DATA - SIMULATED VACANCY)',
                'sector': SectorType.GOVERNMENT,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Lucknow',
                'location_state': 'Uttar Pradesh',
                'description': '[DEMO DATA] Attending civic helpline inquiries, recording grievances, and directing citizens to respective departments.',
                'responsibilities': 'Log incoming caller inquiries, provide standard departmental phone numbers and service guidelines.',
                'minimum_education': EducationLevel.TENTH,
                'experience_required_months': 0,
                'salary_display': '₹18,000 - ₹24,000 / month',
                'vacancies_total': 15,
                'vacancies_pwd_reserved': 5,
                'eligible_disabilities': ['locomotor', 'visual_impairment'],
                'accessibility_facilities': ['Headset with Volume Booster', 'Ground Floor Workstation', 'Wheelchair Ramp'],
                'days_to_deadline': 40,
            },
            # 5 - PSU
            {
                'org': 'State Bank of Enterprise & Finance (DEMO MOCK PSU)',
                'title': 'Junior Customer Associate (DEMO DATA - SIMULATED PSU VACANCY)',
                'sector': SectorType.PSU,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Mumbai',
                'location_state': 'Maharashtra',
                'description': '[DEMO DATA] Front-office banking customer service, ledger verification, and account opening documentation.',
                'responsibilities': 'Assisting branch account holders, updating passbooks, scanning customer KYC identification cards.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 0,
                'salary_display': '₹26,000 - ₹38,000 / month + PSU Allowances',
                'vacancies_total': 25,
                'vacancies_pwd_reserved': 8,
                'eligible_disabilities': ['locomotor', 'hearing_impairment', 'visual_impairment', 'intellectual_disability'],
                'accessibility_facilities': ['Scribe Permitted in Exam', 'Extra 20 Mins/Hour in Exam', 'Low Counter Height', 'Elevator Access'],
                'days_to_deadline': 20,
            },
            # 6 - PSU
            {
                'org': 'National Power Transmission Corp (DEMO MOCK PSU)',
                'title': 'Assistant HR Officer (Trainee) (DEMO DATA - SIMULATED PSU VACANCY)',
                'sector': SectorType.PSU,
                'work_mode': WorkMode.HYBRID,
                'location_city': 'Noida',
                'location_state': 'Uttar Pradesh',
                'description': '[DEMO DATA] Assisting internal welfare policies, tracking employee attendance sheets, and onboarding coordination.',
                'responsibilities': 'Prepare monthly training rosters, manage employee records, coordinate disability inclusion initiatives.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 12,
                'salary_display': '₹40,000 - ₹55,000 / month',
                'vacancies_total': 4,
                'vacancies_pwd_reserved': 2,
                'eligible_disabilities': ['locomotor', 'speech_language', 'specific_learning'],
                'accessibility_facilities': ['Flexible Break Times', 'Ergonomic Desk', 'Hybrid Work Option'],
                'days_to_deadline': 35,
            },
            # 7 - PSU
            {
                'org': 'Bharat Electronics Systems Ltd (DEMO MOCK PSU)',
                'title': 'Electronics Technician Trainee (DEMO DATA - SIMULATED PSU VACANCY)',
                'sector': SectorType.PSU,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Bengaluru',
                'location_state': 'Karnataka',
                'description': '[DEMO DATA] Assembly line inspection, circuit testing, and component record cataloguing.',
                'responsibilities': 'Perform continuity testing on electronic boards, record quality assurance logs, sort micro-components.',
                'minimum_education': EducationLevel.DIPLOMA,
                'experience_required_months': 0,
                'salary_display': '₹22,500 - ₹31,000 / month',
                'vacancies_total': 6,
                'vacancies_pwd_reserved': 2,
                'eligible_disabilities': ['hearing_impairment', 'locomotor'],
                'accessibility_facilities': ['Visual Signal Warning Lights', 'Vibrating Alerts', 'Sign Language Interpreter for Meetings'],
                'days_to_deadline': 14,
            },
            # 8 - PSU
            {
                'org': 'National Food Storage Corporation (DEMO MOCK PSU)',
                'title': 'Inventory Documentation Assistant (DEMO DATA - SIMULATED PSU VACANCY)',
                'sector': SectorType.PSU,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Chandigarh',
                'location_state': 'Punjab',
                'description': '[DEMO DATA] Maintain computer inventory registers of commodities dispatched and received across depots.',
                'responsibilities': 'Enter daily gate-pass logs, generate weekly stock ledger reports, reconcile stock counts.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 0,
                'salary_display': '₹24,000 - ₹33,000 / month',
                'vacancies_total': 7,
                'vacancies_pwd_reserved': 3,
                'eligible_disabilities': ['locomotor', 'mental_illness', 'specific_learning'],
                'accessibility_facilities': ['Predictable Shift Timings', 'Dedicated Support Mentor', 'Wheelchair Accessible Desk'],
                'days_to_deadline': 28,
            },
            # 9 - Private
            {
                'org': 'Accessible Cloud Solutions India (DEMO FIRM)',
                'title': 'Accessibility QA Tester (DEMO DATA - SIMULATED PRIVATE VACANCY)',
                'sector': SectorType.PRIVATE,
                'work_mode': WorkMode.REMOTE,
                'location_city': 'Remote / Any City',
                'location_state': 'All India',
                'description': '[DEMO DATA] Test web and mobile apps using screen readers (NVDA, JAWS, VoiceOver) and WCAG checklist.',
                'responsibilities': 'Perform keyboard-only audits, write accessibility bug reports, advise engineers on aria-labels.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 6,
                'salary_display': '₹35,000 - ₹50,000 / month',
                'vacancies_total': 5,
                'vacancies_pwd_reserved': 5,
                'eligible_disabilities': ['visual_impairment', 'locomotor'],
                'accessibility_facilities': ['100% Work From Home', 'Software License Provided', 'Flexible Hours'],
                'days_to_deadline': 45,
            },
            # 10 - Private
            {
                'org': 'Digital Assist Services Pvt Ltd (DEMO FIRM)',
                'title': 'Customer Support Chat Specialist (DEMO DATA - SIMULATED PRIVATE VACANCY)',
                'sector': SectorType.PRIVATE,
                'work_mode': WorkMode.REMOTE,
                'location_city': 'Remote / Any City',
                'location_state': 'All India',
                'description': '[DEMO DATA] Text-only customer support answering live product queries and ticketing chat tickets.',
                'responsibilities': 'Resolve incoming customer queries through chat and email, follow standard responses, escalate bugs.',
                'minimum_education': EducationLevel.TWELFTH,
                'experience_required_months': 0,
                'salary_display': '₹20,000 - ₹28,000 / month',
                'vacancies_total': 10,
                'vacancies_pwd_reserved': 8,
                'eligible_disabilities': ['hearing_impairment', 'speech_language', 'locomotor'],
                'accessibility_facilities': ['Text-Only Communication', 'No Voice Calls Required', 'Work From Home'],
                'days_to_deadline': 22,
            },
            # 11 - Private
            {
                'org': 'Equal Opportunity BPO & Tech (DEMO FIRM)',
                'title': 'Medical Record Indexer (DEMO DATA - SIMULATED PRIVATE VACANCY)',
                'sector': SectorType.PRIVATE,
                'work_mode': WorkMode.HYBRID,
                'location_city': 'Hyderabad',
                'location_state': 'Telangana',
                'description': '[DEMO DATA] Review digitized health documents and tag patient IDs, report types, and physician notes.',
                'responsibilities': 'Classify medical PDFs, check for missing pages, tag correct diagnostic codes.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 0,
                'salary_display': '₹22,000 - ₹30,000 / month',
                'vacancies_total': 12,
                'vacancies_pwd_reserved': 6,
                'eligible_disabilities': ['locomotor', 'autism_spectrum', 'specific_learning'],
                'accessibility_facilities': ['Structured Routine Tasks', 'Noise-Cancelling Headphones Provided', 'Sensory-Friendly Lighting'],
                'days_to_deadline': 30,
            },
            # 12 - Private
            {
                'org': 'Inclusive Retail & Operations Ltd (DEMO FIRM)',
                'title': 'Retail Inventory Associate (DEMO DATA - SIMULATED PRIVATE VACANCY)',
                'sector': SectorType.PRIVATE,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Pune',
                'location_state': 'Maharashtra',
                'description': '[DEMO DATA] Barcode scanning, merchandise shelf labeling, and receipt cataloging in departmental store.',
                'responsibilities': 'Scan newly arrived inventory cartons, print price tags, coordinate store shelf replenishment.',
                'minimum_education': EducationLevel.TENTH,
                'experience_required_months': 0,
                'salary_display': '₹16,000 - ₹21,000 / month',
                'vacancies_total': 6,
                'vacancies_pwd_reserved': 4,
                'eligible_disabilities': ['hearing_impairment', 'intellectual_disability', 'autism_spectrum'],
                'accessibility_facilities': ['Visual Instruction Cards', 'Buddy Mentorship System', 'Step-Free Stockroom'],
                'days_to_deadline': 12,
            },
            # 13 - Private
            {
                'org': 'Accessible Cloud Solutions India (DEMO FIRM)',
                'title': 'Junior Python Backend Developer (DEMO DATA - SIMULATED PRIVATE VACANCY)',
                'sector': SectorType.PRIVATE,
                'work_mode': WorkMode.REMOTE,
                'location_city': 'Remote / Any City',
                'location_state': 'All India',
                'description': '[DEMO DATA] Write clean Python/Django APIs, write unit tests, and maintain database models.',
                'responsibilities': 'Build RESTful endpoints, fix reported backend bugs, collaborate via GitHub pull requests.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 6,
                'salary_display': '₹40,000 - ₹60,000 / month',
                'vacancies_total': 3,
                'vacancies_pwd_reserved': 3,
                'eligible_disabilities': ['locomotor', 'visual_impairment', 'hearing_impairment', 'multiple_disabilities'],
                'accessibility_facilities': ['Screen Reader Compatible IDE Setup', 'Remote Work', 'Flexible Timings'],
                'days_to_deadline': 50,
            },
            # 14 - Government
            {
                'org': 'Central Staff Selection Commission (DEMO MOCK DEPT)',
                'title': 'Junior Statistical Assistant (DEMO DATA - SIMULATED GOVT VACANCY)',
                'sector': SectorType.GOVERNMENT,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Chennai',
                'location_state': 'Tamil Nadu',
                'description': '[DEMO DATA] Compile district-level economic indicators and assist senior statistical officers with tables.',
                'responsibilities': 'Format census tables, prepare graphs for annual bulletins, archive statistical survey reports.',
                'minimum_education': EducationLevel.GRADUATE,
                'experience_required_months': 0,
                'salary_display': 'Pay Level 4 (₹25,500 - ₹81,100 / month)',
                'vacancies_total': 5,
                'vacancies_pwd_reserved': 2,
                'eligible_disabilities': ['locomotor', 'visual_impairment', 'specific_learning'],
                'accessibility_facilities': ['Scribe Permitted in Exam', 'Extra Compensatory Time', 'Accessible Campus'],
                'days_to_deadline': 27,
            },
            # 15 - Government
            {
                'org': 'Municipal Corporation Administration (DEMO MOCK DEPT)',
                'title': 'Library Assistant & Cataloguer (DEMO DATA - SIMULATED GOVT VACANCY)',
                'sector': SectorType.GOVERNMENT,
                'work_mode': WorkMode.ON_SITE,
                'location_city': 'Ahmedabad',
                'location_state': 'Gujarat',
                'description': '[DEMO DATA] Digital cataloguing of public library books, managing book returns, assisting readers with disability section.',
                'responsibilities': 'Maintain digital accession register, assist visually impaired patrons with audio-book devices, check barcode tags.',
                'minimum_education': EducationLevel.TWELFTH,
                'experience_required_months': 0,
                'salary_display': '₹20,000 - ₹27,000 / month',
                'vacancies_total': 4,
                'vacancies_pwd_reserved': 2,
                'eligible_disabilities': ['locomotor', 'hearing_impairment', 'visual_impairment'],
                'accessibility_facilities': ['Braille Catalogues Available', 'Ground Floor Reading Hall', 'Wheelchair Ramp'],
                'days_to_deadline': 36,
            },
        ]

        count = 0
        for data in demo_jobs:
            org = org_objects[data['org']]
            job, created = Job.objects.get_or_create(
                title=data['title'],
                organization=org,
                defaults={
                    'sector': data['sector'],
                    'work_mode': data['work_mode'],
                    'location_city': data['location_city'],
                    'location_state': data['location_state'],
                    'description': data['description'],
                    'responsibilities': data.get('responsibilities', ''),
                    'minimum_education': data['minimum_education'],
                    'experience_required_months': data['experience_required_months'],
                    'salary_display': data['salary_display'],
                    'vacancies_total': data['vacancies_total'],
                    'vacancies_pwd_reserved': data['vacancies_pwd_reserved'],
                    'eligible_disabilities': data['eligible_disabilities'],
                    'accessibility_facilities': data['accessibility_facilities'],
                    'application_start_date': today - timedelta(days=5),
                    'application_deadline': today + timedelta(days=data['days_to_deadline']),
                    'official_application_url': f"http://localhost:3000/demo-portal",
                    'status': JobStatus.PUBLISHED,
                    'is_demo_data': True,
                }
            )
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} demo jobs! Total published jobs: {Job.objects.count()}"))

        # Seed sample applications for candidate@demo.com if present
        from accounts.models import User
        from profiles.models import CandidateProfile
        from applications.models import JobApplication, ApplicationStatusHistory, ApplicationStatus, ApplicationType

        demo_user = User.objects.filter(email='candidate@demo.com').first()
        if demo_user and hasattr(demo_user, 'candidate_profile'):
            profile = demo_user.candidate_profile
            job1 = Job.objects.filter(title__icontains='Junior Office Clerk').first()
            if job1 and not JobApplication.objects.filter(candidate=profile, job=job1).exists():
                app1 = JobApplication.objects.create(
                    candidate=profile,
                    job=job1,
                    application_type=ApplicationType.INTERNAL,
                    status=ApplicationStatus.EXAM_SCHEDULED,
                    accommodations_requested=['Scribe for Examinations', 'Compensatory Extra Time (20 min/hr)', 'Wheelchair Ramp'],
                    candidate_notes='Exam Admit Card received. Examination Centre: New Delhi South Centre.',
                )
                ApplicationStatusHistory.objects.create(
                    application=app1,
                    from_status=ApplicationStatus.APP_STARTED,
                    to_status=ApplicationStatus.SUBMITTED,
                    note='Application submitted with requested exam scribe accommodation.',
                    changed_by=demo_user,
                    created_at=today - timedelta(days=12),
                )
                ApplicationStatusHistory.objects.create(
                    application=app1,
                    from_status=ApplicationStatus.SUBMITTED,
                    to_status=ApplicationStatus.ADMIT_CARD_RELEASED,
                    note='Admit card issued with Roll No. DL-992104.',
                    changed_by=demo_user,
                    created_at=today - timedelta(days=5),
                )
                ApplicationStatusHistory.objects.create(
                    application=app1,
                    from_status=ApplicationStatus.ADMIT_CARD_RELEASED,
                    to_status=ApplicationStatus.EXAM_SCHEDULED,
                    note='Exam scheduled for 25th of this month.',
                    changed_by=demo_user,
                    created_at=today - timedelta(days=2),
                )
                self.stdout.write(self.style.SUCCESS("Seeded sample internal application for candidate@demo.com"))

            job2 = Job.objects.filter(title__icontains='Junior Customer Associate').first()
            if job2 and not JobApplication.objects.filter(candidate=profile, job=job2).exists():
                app2 = JobApplication.objects.create(
                    candidate=profile,
                    job=job2,
                    application_type=ApplicationType.EXTERNAL_REDIRECT,
                    status=ApplicationStatus.APPLIED,
                    accommodations_requested=['Ground Floor Seating / Ramp Access'],
                    candidate_notes='Registered on official PSU portal with Application Reference: SBEF-2026-88190.',
                )
                ApplicationStatusHistory.objects.create(
                    application=app2,
                    from_status=ApplicationStatus.APP_STARTED,
                    to_status=ApplicationStatus.APPLIED,
                    note='Candidate confirmed submission on official State Bank PSU portal.',
                    changed_by=demo_user,
                    created_at=today - timedelta(days=8),
                )
                self.stdout.write(self.style.SUCCESS("Seeded sample external application for candidate@demo.com"))
