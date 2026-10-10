from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError

from .models import JobApplication, ApplicationStatus
from .serializers import (
    JobApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationStatusUpdateSerializer,
)
from .services import (
    create_or_record_application,
    update_application_status,
    get_application_stage_summary,
)
from jobs.models import Job
from profiles.services import get_or_create_candidate_profile
from accounts.models import Role


class ApplicationListCreateView(APIView):
    """List current user's applications or submit/record a new job application."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_or_create_candidate_profile(request.user)
        queryset = JobApplication.objects.filter(candidate=profile).select_related('job', 'job__organization').prefetch_related('status_history')

        # Filter by status if provided (e.g. ?status=submitted)
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        serializer = JobApplicationSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ApplicationCreateSerializer(data=request.data)
        if serializer.is_valid():
            profile = get_or_create_candidate_profile(request.user)
            job = Job.objects.get(pk=serializer.validated_data['job_id'])

            try:
                app = create_or_record_application(
                    candidate=profile,
                    job=job,
                    application_type=serializer.validated_data['application_type'],
                    accommodations=serializer.validated_data.get('accommodations_requested', []),
                    candidate_notes=serializer.validated_data.get('candidate_notes', ''),
                    user=request.user,
                    document_ids=serializer.validated_data.get('document_ids', []),
                )
                return Response(
                    JobApplicationSerializer(app, context={'request': request}).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApplicationDetailView(APIView):
    """Retrieve application detail with status history timeline."""
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        try:
            app = JobApplication.objects.select_related('job', 'job__organization').prefetch_related('status_history').get(pk=pk)
        except JobApplication.DoesNotExist:
            raise NotFound("Application record not found.")

        # Strict authorization checks:
        user = request.user
        if user.role == Role.ADMIN or user.is_staff or user.is_superuser:
            pass
        elif user.role == Role.CANDIDATE:
            if app.candidate.user != user:
                raise PermissionDenied("You do not have permission to view another candidate's application.")
        elif user.role == Role.COACH:
            from support.models import JobCoachAssignment
            if not JobCoachAssignment.objects.filter(coach=user, candidate=app.candidate, is_active=True).exists():
                raise PermissionDenied("You are not assigned to coach this candidate.")
        elif user.role == Role.GUARDIAN:
            from support.models import GuardianAccess
            if not GuardianAccess.objects.filter(guardian=user, candidate=app.candidate).exists():
                raise PermissionDenied("You do not have guardian delegation access for this candidate.")
        else:
            raise PermissionDenied("You do not have permission to view this application.")

        return app

    def get(self, request, pk):
        app = self.get_object(request, pk)
        serializer = JobApplicationSerializer(app, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ApplicationStatusUpdateView(APIView):
    """Update milestone status and record history audit trail."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            app = JobApplication.objects.get(pk=pk)
        except JobApplication.DoesNotExist:
            raise NotFound("Application record not found.")

        # Strict authorization checks:
        user = request.user
        if user.role == Role.ADMIN or user.is_staff or user.is_superuser:
            pass
        elif user.role == Role.CANDIDATE:
            if app.candidate.user != user:
                raise PermissionDenied("You cannot update another candidate's application status.")
        elif user.role == Role.COACH:
            from support.models import JobCoachAssignment
            if not JobCoachAssignment.objects.filter(coach=user, candidate=app.candidate, is_active=True).exists():
                raise PermissionDenied("You are not assigned to coach this candidate.")
        else:
            raise PermissionDenied("You do not have permission to update this application status.")

        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                updated_app = update_application_status(
                    application=app,
                    new_status=serializer.validated_data['status'],
                    note=serializer.validated_data.get('note', ''),
                    changed_by=request.user,
                )
                return Response(
                    JobApplicationSerializer(updated_app, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApplicationSummaryView(APIView):
    """Returns candidate's application counts grouped by recruitment stages."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_or_create_candidate_profile(request.user)
        summary = get_application_stage_summary(profile)
        return Response(summary, status=status.HTTP_200_OK)
