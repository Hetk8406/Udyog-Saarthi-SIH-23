from decimal import Decimal
from django.core.management.base import BaseCommand
from learning.models import (
    Course,
    CourseCategory,
    CourseLevel,
    LearningResource,
    ResourceType,
    MockTest,
    Question
)
from core.demo_guard import check_demo_seed_allowed


class Command(BaseCommand):
    help = 'Seeds accessible courses, study resources, and demo mock tests with questions'

    def handle(self, *args, **options):
        check_demo_seed_allowed()
        self.stdout.write("Seeding accessible learning courses and mock tests...")

        # 1. Seed Courses
        courses_data = [
            {
                'title': 'Government & Public Sector Exam Foundation (DEMO COURSE)',
                'category': CourseCategory.GOVT_EXAM_PREP,
                'level': CourseLevel.BEGINNER,
                'description': '[DEMO DATA] Comprehensive starter course on Indian competitive exam patterns, reservation criteria for PwD, and exam hall accommodations.'
            },
            {
                'title': 'Logical Reasoning & Verbal Ability for PwD Candidates (DEMO COURSE)',
                'category': CourseCategory.REASONING,
                'level': CourseLevel.INTERMEDIATE,
                'description': '[DEMO DATA] Accessible problem solving, non-visual deduction methods, syllogisms, and coding-decoding techniques.'
            },
            {
                'title': 'Quantitative Aptitude Essentials (DEMO COURSE)',
                'category': CourseCategory.APTITUDE,
                'level': CourseLevel.BEGINNER,
                'description': '[DEMO DATA] Mental math tricks, percentage calculations, ratios, and time-distance formulas tailored for competitive exams.'
            },
            {
                'title': 'Digital Workplace & Computer Proficiency (DEMO COURSE)',
                'category': CourseCategory.COMPUTER_SKILLS,
                'level': CourseLevel.BEGINNER,
                'description': '[DEMO DATA] Screen reader shortcuts, MS Office/LibreOffice essentials, email etiquette, and assistive technology basics.'
            },
        ]

        course_objects = {}
        for c in courses_data:
            course, _ = Course.objects.get_or_create(
                title=c['title'],
                defaults={
                    'category': c['category'],
                    'level': c['level'],
                    'description': c['description'],
                    'is_published': True
                }
            )
            course_objects[c['category']] = course

        # 2. Seed Learning Resources
        resources_data = [
            {
                'course': course_objects[CourseCategory.GOVT_EXAM_PREP],
                'title': 'Guidelines for Scribe & Compensatory Time in Central Govt Exams (DEMO GUIDE)',
                'category': CourseCategory.GOVT_EXAM_PREP,
                'resource_type': ResourceType.STUDY_GUIDE,
                'estimated_minutes': 8,
                'accessibility_notes': 'Screen reader optimized, semantic headings',
                'content_text': (
                    "### Official Accommodations Overview\n\n"
                    "Under Ministry of Social Justice & Empowerment guidelines, Persons with Benchmark Disabilities are entitled to:\n\n"
                    "1. **Compensatory Extra Time:** A minimum of 20 minutes per hour of examination duration.\n"
                    "2. **Scribe Assistance:** Candidate can opt for their own scribe or request the exam authority to provide one.\n"
                    "3. **Exam Center Facilities:** Ground floor seating, wheelchair ramp access, and sensory accommodations."
                )
            },
            {
                'course': course_objects[CourseCategory.REASONING],
                'title': 'Mastering Syllogisms without Complex Diagrams (DEMO ARTICLE)',
                'category': CourseCategory.REASONING,
                'resource_type': ResourceType.ARTICLE,
                'estimated_minutes': 12,
                'accessibility_notes': 'Text-only logical deduction formulas, no inaccessible images',
                'content_text': (
                    "### Verbal Deduction Rules\n\n"
                    "Instead of drawing overlapping circles (Venn diagrams), syllogisms can be solved with statement distribution rules:\n\n"
                    "- **Universal Positive ('All A are B'):** Subject A is distributed; Predicate B is not.\n"
                    "- **Particular Positive ('Some A are B'):** Neither A nor B is distributed.\n"
                    "- **Rule of Middle Term:** The common term must be distributed at least once in the premises for a valid deduction."
                )
            },
            {
                'course': course_objects[CourseCategory.APTITUDE],
                'title': 'Percentage & Ratio Shortcuts for Speed (DEMO NOTES)',
                'category': CourseCategory.APTITUDE,
                'resource_type': ResourceType.STUDY_GUIDE,
                'estimated_minutes': 15,
                'accessibility_notes': 'Clean tabular formula reference with screen-reader friendly descriptions',
                'content_text': (
                    "### Fractional Equivalents Table\n\n"
                    "- 1/2 = 50%\n"
                    "- 1/3 = 33.33%\n"
                    "- 1/4 = 25%\n"
                    "- 1/5 = 20%\n"
                    "- 1/6 = 16.67%\n"
                    "- 1/8 = 12.5%\n\n"
                    "Memorizing these fractions reduces mental arithmetic overhead during timed examinations."
                )
            },
            {
                'course': course_objects[CourseCategory.COMPUTER_SKILLS],
                'title': 'Accessible Keyboard Navigation & Screen Reader Shortcuts (DEMO GUIDE)',
                'category': CourseCategory.COMPUTER_SKILLS,
                'resource_type': ResourceType.ARTICLE,
                'estimated_minutes': 10,
                'accessibility_notes': 'NVDA, JAWS, and Windows Narrator keystroke table',
                'content_text': (
                    "### Essential Keystrokes for Computer Screening Tests\n\n"
                    "- `Tab` / `Shift+Tab`: Move between form inputs and option choices.\n"
                    "- `Spacebar`: Select/unselect radio buttons and checkboxes.\n"
                    "- `Enter`: Activate buttons and submit dialogs.\n"
                    "- `Alt + Left Arrow`: Return to previous question.\n"
                    "- `Alt + Right Arrow`: Proceed to next question."
                )
            },
        ]

        for r in resources_data:
            LearningResource.objects.get_or_create(
                title=r['title'],
                defaults={
                    'course': r['course'],
                    'category': r['category'],
                    'resource_type': r['resource_type'],
                    'estimated_minutes': r['estimated_minutes'],
                    'accessibility_notes': r['accessibility_notes'],
                    'content_text': r['content_text'],
                }
            )

        # 3. Seed Mock Tests
        test1, _ = MockTest.objects.get_or_create(
            title='General Aptitude & Reasoning Mock Test (DEMO TEST)',
            defaults={
                'category': CourseCategory.GOVT_EXAM_PREP,
                'description': '[DEMO DATA] Practice screening test featuring Reasoning, Mathematics, English, and General Awareness.',
                'instructions': (
                    "1. This mock test consists of multiple-choice questions.\n"
                    "2. You can navigate between questions using the Question Navigator or keyboard shortcuts.\n"
                    "3. Standard duration is 20 minutes. Candidates eligible for extra time can select 1.33x Compensatory Time or Untimed Practice Mode in the test settings.\n"
                    "4. Immediate score analysis and subject breakdown will be displayed upon submission."
                ),
                'duration_minutes': 20,
                'total_marks': 5,
                'passing_percentage': 40,
                'is_published': True,
            }
        )

        # Questions for Test 1 (5 questions covering Reasoning, Mathematics, English, Computer)
        questions_data = [
            {
                'mock_test': test1,
                'order': 1,
                'subject': 'Reasoning',
                'marks': 1,
                'negative_marks': Decimal('0.25'),
                'question_text': 'Statements: (1) All books are papers. (2) All papers are trees. Conclusion: All books are trees.',
                'options': [
                    {'id': 'A', 'text': 'Conclusion is True and Valid'},
                    {'id': 'B', 'text': 'Conclusion is False'},
                    {'id': 'C', 'text': 'Cannot be determined'},
                    {'id': 'D', 'text': 'Partially True'},
                ],
                'correct_option_id': 'A',
                'explanation': 'Since Books are entirely contained within Papers, and Papers are entirely within Trees, all Books are Trees by transitive deduction.'
            },
            {
                'mock_test': test1,
                'order': 2,
                'subject': 'Mathematics',
                'marks': 1,
                'negative_marks': Decimal('0.25'),
                'question_text': 'A candidate scores 45 marks out of 60. What is their score percentage?',
                'options': [
                    {'id': 'A', 'text': '70%'},
                    {'id': 'B', 'text': '75%'},
                    {'id': 'C', 'text': '80%'},
                    {'id': 'D', 'text': '65%'},
                ],
                'correct_option_id': 'B',
                'explanation': '(45 / 60) * 100 = (3 / 4) * 100 = 75%.'
            },
            {
                'mock_test': test1,
                'order': 3,
                'subject': 'English',
                'marks': 1,
                'negative_marks': Decimal('0.25'),
                'question_text': 'Select the word that correctly completes the sentence: "The new website was built to be fully _______ for people using screen readers."',
                'options': [
                    {'id': 'A', 'text': 'accessible'},
                    {'id': 'B', 'text': 'accelerated'},
                    {'id': 'C', 'text': 'acceded'},
                    {'id': 'D', 'text': 'accentuated'},
                ],
                'correct_option_id': 'A',
                'explanation': '"Accessible" means designed to be usable by people of all abilities, including assistive technology users.'
            },
            {
                'mock_test': test1,
                'order': 4,
                'subject': 'Mathematics',
                'marks': 1,
                'negative_marks': Decimal('0.25'),
                'question_text': 'If 5 workers complete a data entry assignment in 6 hours, how many hours will 10 workers take at the same speed?',
                'options': [
                    {'id': 'A', 'text': '12 hours'},
                    {'id': 'B', 'text': '6 hours'},
                    {'id': 'C', 'text': '3 hours'},
                    {'id': 'D', 'text': '4 hours'},
                ],
                'correct_option_id': 'C',
                'explanation': 'Total work = 5 * 6 = 30 worker-hours. With 10 workers, time taken = 30 / 10 = 3 hours.'
            },
            {
                'mock_test': test1,
                'order': 5,
                'subject': 'Computer Skills',
                'marks': 1,
                'negative_marks': Decimal('0.25'),
                'question_text': 'Which keyboard shortcut is universally used to move focus forward between accessible form controls and buttons?',
                'options': [
                    {'id': 'A', 'text': 'Ctrl + F'},
                    {'id': 'B', 'text': 'Tab key'},
                    {'id': 'C', 'text': 'Alt + Enter'},
                    {'id': 'D', 'text': 'Escape key'},
                ],
                'correct_option_id': 'B',
                'explanation': 'The Tab key navigates focus sequentially across interactive page elements in all accessible web browsers.'
            },
        ]

        for q in questions_data:
            Question.objects.get_or_create(
                mock_test=q['mock_test'],
                order=q['order'],
                defaults={
                    'subject': q['subject'],
                    'marks': q['marks'],
                    'negative_marks': q['negative_marks'],
                    'question_text': q['question_text'],
                    'options': q['options'],
                    'correct_option_id': q['correct_option_id'],
                    'explanation': q['explanation'],
                }
            )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded {Course.objects.count()} courses, {LearningResource.objects.count()} resources, "
            f"and {MockTest.objects.count()} mock tests with {Question.objects.count()} questions!"
        ))
