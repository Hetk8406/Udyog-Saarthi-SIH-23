import logging
from datetime import date, timedelta
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.core.paginator import Paginator

from accounts.models import User, Role
from accounts.permissions import IsAdminRole
from profiles.models import CandidateProfile
from jobs.models import Organization, Job
from applications.models import JobApplication, ApplicationStatus
from learning.models import Course, LearningResource, Question, MockTest
from support.models import SupportTicket, SupportMessage, JobCoachAssignment, SuccessStory, Feedback, TicketStatus
from core.turnstile import verify_turnstile
from .models import AdminAuditLog
from .serializers import (
    AdminUserSerializer,
    AdminCandidateProfileSerializer,
    AdminCoachSerializer,
    AdminOrganizationSerializer,
    AdminJobSerializer,
    AdminCourseSerializer,
    AdminLearningResourceSerializer,
    AdminMockTestSerializer,
    AdminQuestionSerializer,
    AdminSupportTicketSerializer,
    SuccessStorySerializer,
    FeedbackSerializer,
    AdminAuditLogSerializer
)


logger = logging.getLogger(__name__)


def log_admin_action(request, action_type: str, target_entity: str, target_id: str, details: str):
    """Utility to record an audit entry for sensitive administrative operations."""
    try:
        ip = request.META.get('REMOTE_ADDR')
        AdminAuditLog.objects.create(
            admin_user=request.user,
            action_type=action_type,
            target_entity=target_entity,
            target_id=str(target_id),
            details=details,
            ip_address=ip
        )
    except Exception as e:
        logger.warning("Audit log error: %s", e)


def paginate_queryset(queryset, request, default_page_size=10):
    page_number = request.query_params.get('page', 1)
    page_size = request.query_params.get('page_size', default_page_size)
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page_number)
    return {
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'results': page_obj.object_list
    }


# ==============================================================================
# STATS OVERVIEW
# ==============================================================================

class AdminStatsOverviewView(APIView):
    """
    Overview statistics for the Admin Panel:
    users, jobs, applications, upcoming deadlines, tickets, placements.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        today = date.today()
        upcoming_window = today + timedelta(days=14)

        users_count = User.objects.count()
        candidates_count = CandidateProfile.objects.count()
        coaches_count = User.objects.filter(role=Role.COACH).count()
        jobs_count = Job.objects.count()
        applications_count = JobApplication.objects.count()
        open_tickets_count = SupportTicket.objects.exclude(status=TicketStatus.CLOSED).count()

        # Upcoming job application deadlines (within next 14 days)
        upcoming_deadlines_count = Job.objects.filter(
            application_deadline__gte=today,
            application_deadline__lte=upcoming_window
        ).count()

        # Placements (selected or placed)
        placements_count = JobApplication.objects.filter(
            status__in=[ApplicationStatus.SELECTED, ApplicationStatus.PLACED]
        ).count()

        mock_tests_count = MockTest.objects.count()
        feedback_count = Feedback.objects.count()

        return Response({
            "users_total": users_count,
            "candidates_total": candidates_count,
            "coaches_total": coaches_count,
            "jobs_total": jobs_count,
            "applications_total": applications_count,
            "upcoming_deadlines_total": upcoming_deadlines_count,
            "open_tickets_total": open_tickets_count,
            "placements_total": placements_count,
            "mock_tests_total": mock_tests_count,
            "feedback_total": feedback_count,
        }, status=status.HTTP_200_OK)


# ==============================================================================
# ENTITY MANAGEMENT VIEWS (SEARCH, FILTER, PAGINATION, AUDIT LOGGED)
# ==============================================================================

class AdminUsersListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = User.objects.all().order_by('-date_joined')
        search = request.query_params.get('search')
        role = request.query_params.get('role')
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(full_name__icontains=search))
        if role:
            qs = qs.filter(role=role)

        data = paginate_queryset(qs, request)
        serializer = AdminUserSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})

    def patch(self, request):
        user_id = request.data.get('id')
        user = get_object_or_404(User, id=user_id)
        role = request.data.get('role')
        is_active = request.data.get('is_active')

        # Security check: Non-superusers cannot modify superuser accounts
        if user.is_superuser and not request.user.is_superuser:
            return Response(
                {"error": "Only superusers have permission to modify superuser accounts."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Security check: Prevent self-lockout or self-demotion
        if str(user.id) == str(request.user.id):
            if is_active is False:
                return Response(
                    {"error": "Administrators cannot deactivate their own active account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if role and role != user.role:
                return Response(
                    {"error": "Administrators cannot alter their own account role."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        details = []
        if role and role != user.role:
            if role not in Role.values:
                return Response({"error": f"Invalid role. Must be one of: {', '.join(Role.values)}"}, status=status.HTTP_400_BAD_REQUEST)
            old_role = user.role
            user.role = role
            details.append(f"Role changed from {old_role} to {role}")
        if is_active is not None and is_active != user.is_active:
            user.is_active = is_active
            details.append(f"Status changed to {'Active' if is_active else 'Inactive'}")

        user.save()
        log_admin_action(request, 'UPDATE', 'User', user.id, "; ".join(details) or "User updated")
        return Response(AdminUserSerializer(user).data)


class AdminCandidatesListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = CandidateProfile.objects.select_related('user', 'accessibility_profile').all().order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(user__full_name__icontains=search) | Q(user__email__icontains=search) | Q(city__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminCandidateProfileSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})


class AdminCoachesListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = JobCoachAssignment.objects.select_related('coach', 'candidate__user').all().order_by('-assigned_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(coach__full_name__icontains=search) | Q(candidate__user__full_name__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminCoachSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})

    def post(self, request):
        coach_id = request.data.get('coach_id')
        candidate_id = request.data.get('candidate_id')
        coach = get_object_or_404(User, id=coach_id, role=Role.COACH)
        candidate = get_object_or_404(CandidateProfile, id=candidate_id)

        assignment, created = JobCoachAssignment.objects.get_or_create(
            coach=coach, candidate=candidate, defaults={'is_active': True}
        )
        if not created and not assignment.is_active:
            assignment.is_active = True
            assignment.save()

        log_admin_action(
            request,
            'ASSIGN' if created else 'REACTIVATE',
            'JobCoachAssignment',
            assignment.id,
            f"Assigned coach {coach.full_name} to candidate {candidate.user.full_name}"
        )
        return Response(AdminCoachSerializer(assignment).data, status=status.HTTP_201_CREATED)


class AdminOrganizationsListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = Organization.objects.all().order_by('name')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminOrganizationSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})

    def post(self, request):
        serializer = AdminOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = serializer.save()
        log_admin_action(request, 'CREATE', 'Organization', org.id, f"Created organization '{org.name}'")
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminJobsListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = Job.objects.select_related('organization').all().order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(organization__name__icontains=search) | Q(location_city__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminJobSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})

    def patch(self, request):
        job_id = request.data.get('id')
        job = get_object_or_404(Job, id=job_id)
        new_status = request.data.get('status')
        if new_status:
            old_st = job.status
            job.status = new_status
            job.save()
            log_admin_action(request, 'UPDATE', 'Job', job.id, f"Job '{job.title}' status changed: {old_st} -> {new_status}")
        return Response(AdminJobSerializer(job).data)


class AdminCoursesListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = Course.objects.all().order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminCourseSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})

    def post(self, request):
        title = request.data.get('title')
        category = request.data.get('category', 'govt_exam_prep')
        level = request.data.get('level', 'beginner')
        description = request.data.get('description', '')
        course = Course.objects.create(
            title=title, category=category, level=level, description=description, is_published=True
        )
        log_admin_action(request, 'CREATE', 'Course', course.id, f"Created course '{course.title}'")
        return Response(AdminCourseSerializer(course).data, status=status.HTTP_201_CREATED)


class AdminResourcesListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = LearningResource.objects.select_related('course').all().order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(course__title__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminLearningResourceSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})


class AdminMockTestsListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = MockTest.objects.all().order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(category__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminMockTestSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})


class AdminQuestionsListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = Question.objects.select_related('mock_test').all().order_by('mock_test', 'order')
        search = request.query_params.get('search')
        test_id = request.query_params.get('mock_test')
        if test_id:
            qs = qs.filter(mock_test_id=test_id)
        if search:
            qs = qs.filter(Q(question_text__icontains=search) | Q(subject__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminQuestionSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})


class AdminSupportTicketsListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = SupportTicket.objects.select_related('candidate__user', 'assigned_coach').all().order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(subject__icontains=search) | Q(candidate__user__full_name__icontains=search))

        data = paginate_queryset(qs, request)
        serializer = AdminSupportTicketSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})

    def patch(self, request):
        ticket_id = request.data.get('id')
        ticket = get_object_or_404(SupportTicket, id=ticket_id)
        status_val = request.data.get('status')
        coach_id = request.data.get('assigned_coach')

        if status_val:
            old_st = ticket.status
            ticket.status = status_val
            log_admin_action(request, 'UPDATE', 'SupportTicket', ticket.id, f"Ticket #{ticket.id} status: {old_st} -> {status_val}")

        if coach_id is not None:
            coach = get_object_or_404(User, id=coach_id, role=Role.COACH) if coach_id else None
            ticket.assigned_coach = coach
            log_admin_action(request, 'ASSIGN', 'SupportTicket', ticket.id, f"Assigned to {coach.full_name if coach else 'Unassigned'}")

        ticket.save()
        return Response(AdminSupportTicketSerializer(ticket).data)


class AdminAuditLogsListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = AdminAuditLog.objects.select_related('admin_user').all().order_by('-created_at')
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(Q(target_entity__icontains=search) | Q(details__icontains=search) | Q(admin_user__full_name__icontains=search))

        data = paginate_queryset(qs, request, default_page_size=15)
        serializer = AdminAuditLogSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})


# ==============================================================================
# PUBLIC SUCCESS STORIES & FEEDBACK VIEWS
# ==============================================================================

class PublicSuccessStoriesListView(APIView):
    """Publicly accessible list of inspirational stories."""
    permission_classes = [AllowAny]

    def get(self, request):
        stories = SuccessStory.objects.filter(is_featured=True).order_by('-created_at')
        serializer = SuccessStorySerializer(stories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminSuccessStoriesListView(APIView):
    """Admin management for Success Stories."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = SuccessStory.objects.all().order_by('-created_at')
        data = paginate_queryset(qs, request)
        serializer = SuccessStorySerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})

    def post(self, request):
        serializer = SuccessStorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        story = serializer.save()
        log_admin_action(request, 'CREATE', 'SuccessStory', story.id, f"Created story for {story.candidate_name}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PublicFeedbackSubmitView(APIView):
    """Allows visitors or logged-in users to submit platform feedback."""
    permission_classes = [AllowAny]
    throttle_scope = 'contact'

    def post(self, request):
        turnstile_token = request.data.get('turnstile_token')
        client_ip = request.META.get('REMOTE_ADDR')
        if not verify_turnstile(turnstile_token, remote_ip=client_ip):
            return Response(
                {"turnstile_token": ["Security verification challenge failed. Please refresh and try again."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user if request.user.is_authenticated else None
        serializer = FeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save(user=user)
        return Response(FeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED)


class AdminFeedbackListView(APIView):
    """Admin view of all collected feedback and ratings."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = Feedback.objects.select_related('user').all().order_by('-created_at')
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        data = paginate_queryset(qs, request)
        serializer = FeedbackSerializer(data['results'], many=True)
        return Response({**data, 'results': serializer.data})
