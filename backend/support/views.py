from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from django.shortcuts import get_object_or_404
from django.db.models import Q

from accounts.models import Role, User
from accounts.permissions import IsJobCoach, IsGuardian, IsCandidate
from profiles.models import CandidateProfile
from jobs.models import Job
from notifications.services import create_notification
from core.turnstile import verify_turnstile
from .models import (
    SupportTicket,
    SupportMessage,
    JobCoachAssignment,
    CoachNote,
    CoachJobRecommendation,
    GuardianAccess,
    TicketStatus
)
from .serializers import (
    SupportTicketListSerializer,
    SupportTicketDetailSerializer,
    CreateSupportTicketSerializer,
    SupportMessageSerializer,
    CoachCandidateSummarySerializer,
    CoachNoteSerializer,
    CoachJobRecommendationSerializer,
    GuardianAccessSerializer
)


class SupportTicketListCreateView(APIView):
    """
    List user's support requests or open a new support ticket.
    - Candidates see their own tickets.
    - Guardians see tickets for candidates who granted them allow_view_support_tickets=True.
    - Coaches see tickets assigned to them or for candidates assigned to them.
    - Admins see all tickets.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'contact'

    def get(self, request):
        user = request.user
        queryset = SupportTicket.objects.select_related('candidate__user', 'created_by', 'assigned_coach')

        if user.role == Role.ADMIN or user.is_staff or user.is_superuser:
            pass  # Admin sees all
        elif user.role == Role.COACH:
            # Coaches see tickets explicitly assigned to them OR tickets from their assigned candidates
            assigned_candidate_ids = JobCoachAssignment.objects.filter(
                coach=user, is_active=True
            ).values_list('candidate_id', flat=True)

            queryset = queryset.filter(
                Q(assigned_coach=user) | Q(candidate_id__in=assigned_candidate_ids)
            )
        elif user.role == Role.GUARDIAN:
            # Guardians only see tickets for candidates who allowed allow_view_support_tickets
            allowed_candidate_ids = GuardianAccess.objects.filter(
                guardian=user, allow_view_support_tickets=True
            ).values_list('candidate_id', flat=True)

            queryset = queryset.filter(
                Q(created_by=user) | Q(candidate_id__in=allowed_candidate_ids)
            )
        else:
            # Candidate sees only their own tickets
            if not hasattr(user, 'candidate_profile'):
                return Response([], status=status.HTTP_200_OK)
            queryset = queryset.filter(candidate=user.candidate_profile)

        # Filtering by status or category
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        category_param = request.query_params.get('category')
        if category_param:
            queryset = queryset.filter(category=category_param)

        serializer = SupportTicketListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        turnstile_token = request.data.get('turnstile_token')
        client_ip = request.META.get('REMOTE_ADDR')
        if not verify_turnstile(turnstile_token, remote_ip=client_ip):
            return Response(
                {"turnstile_token": ["Security verification challenge failed. Please refresh and try again."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        serializer = CreateSupportTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        candidate_profile = None

        if user.role == Role.CANDIDATE:
            if not hasattr(user, 'candidate_profile'):
                return Response(
                    {"error": "Candidate profile not found. Please complete profile registration."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            candidate_profile = user.candidate_profile
        elif user.role == Role.GUARDIAN:
            # If guardian creates ticket, they must specify candidate_id for whom they are authorized
            candidate_id = request.data.get('candidate_id')
            if not candidate_id:
                # Fallback to the first authorized candidate if only one
                delegations = GuardianAccess.objects.filter(
                    guardian=user, allow_view_support_tickets=True
                )
                if delegations.exists():
                    candidate_profile = delegations.first().candidate
                else:
                    return Response(
                        {"error": "No authorized candidate found for this guardian."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                has_access = GuardianAccess.objects.filter(
                    guardian=user, candidate_id=candidate_id, allow_view_support_tickets=True
                ).exists()
                if not has_access:
                    raise PermissionDenied("You do not have permission to open tickets for this candidate.")
                candidate_profile = get_object_or_404(CandidateProfile, id=candidate_id)
        elif user.role in [Role.ADMIN, Role.COACH]:
            candidate_id = request.data.get('candidate_id')
            if not candidate_id:
                return Response({"error": "candidate_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            candidate_profile = get_object_or_404(CandidateProfile, id=candidate_id)
        else:
            return Response({"error": "Unauthorized role for opening support tickets."}, status=status.HTTP_403_FORBIDDEN)

        # Create ticket
        ticket = SupportTicket.objects.create(
            candidate=candidate_profile,
            created_by=user,
            category=serializer.validated_data['category'],
            subject=serializer.validated_data['subject'],
            description=serializer.validated_data['description'],
            status=TicketStatus.OPEN
        )

        # Automatically add first message from the creator
        SupportMessage.objects.create(
            ticket=ticket,
            sender=user,
            message=serializer.validated_data['description']
        )

        # If candidate has an active coach assigned, also notify them or link
        active_assignment = JobCoachAssignment.objects.filter(
            candidate=candidate_profile, is_active=True
        ).first()
        if active_assignment:
            ticket.assigned_coach = active_assignment.coach
            ticket.status = TicketStatus.ASSIGNED
            ticket.save(update_fields=['assigned_coach', 'status'])

            create_notification(
                user=active_assignment.coach,
                notification_type='system',
                title="New Support Ticket from Candidate",
                message=f"Ticket '{ticket.subject}' opened by {candidate_profile.user.full_name}",
                link=f"/support/tickets/{ticket.id}"
            )

        output_serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class SupportTicketDetailView(APIView):
    """View ticket details and full message history."""
    permission_classes = [IsAuthenticated]

    def _get_ticket_and_check_permission(self, ticket_id, user):
        ticket = get_object_or_404(
            SupportTicket.objects.select_related('candidate__user', 'created_by', 'assigned_coach'),
            id=ticket_id
        )

        if user.role == Role.ADMIN or user.is_staff or user.is_superuser:
            return ticket

        if user.role == Role.COACH:
            is_assigned_to_coach = (ticket.assigned_coach_id == user.id)
            is_assigned_candidate = JobCoachAssignment.objects.filter(
                coach=user, candidate=ticket.candidate, is_active=True
            ).exists()
            if not (is_assigned_to_coach or is_assigned_candidate):
                raise PermissionDenied("You do not have permission to view tickets for candidates not assigned to you.")
            return ticket

        if user.role == Role.GUARDIAN:
            if ticket.created_by_id == user.id:
                return ticket
            has_permission = GuardianAccess.objects.filter(
                guardian=user, candidate=ticket.candidate, allow_view_support_tickets=True
            ).exists()
            if not has_permission:
                raise PermissionDenied("The candidate has not authorized guardian access to support tickets.")
            return ticket

        # Candidate
        if hasattr(user, 'candidate_profile') and ticket.candidate_id == user.candidate_profile.id:
            return ticket

        raise PermissionDenied("You do not have access to this support ticket.")

    def get(self, request, pk):
        ticket = self._get_ticket_and_check_permission(pk, request.user)
        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        """Update ticket status (e.g. In Progress, Resolved, Closed) or assigned coach."""
        ticket = self._get_ticket_and_check_permission(pk, request.user)
        user = request.user

        # Only staff, assigned coach, or the ticket owner (to close) can update status
        new_status = request.data.get('status')
        if new_status:
            if new_status not in [choice[0] for choice in TicketStatus.choices]:
                return Response({"error": "Invalid ticket status."}, status=status.HTTP_400_BAD_REQUEST)

            # Candidate can only close or reopen their own ticket
            if user.role == Role.CANDIDATE and new_status not in [TicketStatus.CLOSED, TicketStatus.OPEN]:
                raise PermissionDenied("Candidates may only close or reopen a ticket.")

            ticket.status = new_status
            ticket.save(update_fields=['status', 'updated_at'])

        # Assign coach (Admin only or coach self-assigning)
        coach_id = request.data.get('assigned_coach')
        if coach_id is not None:
            if user.role in [Role.ADMIN, Role.COACH]:
                coach_user = get_object_or_404(User, id=coach_id, role=Role.COACH)
                ticket.assigned_coach = coach_user
                if ticket.status == TicketStatus.OPEN:
                    ticket.status = TicketStatus.ASSIGNED
                ticket.save(update_fields=['assigned_coach', 'status', 'updated_at'])
            else:
                raise PermissionDenied("Only coaches or admins can change assigned coach.")

        serializer = SupportTicketDetailSerializer(ticket, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SupportMessageCreateView(APIView):
    """Post a reply message in an active support ticket."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        detail_view = SupportTicketDetailView()
        ticket = detail_view._get_ticket_and_check_permission(pk, request.user)

        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({"error": "Message text cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        message = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=message_text
        )

        # If ticket was open and a coach/admin replied, move to in_progress
        if request.user.role in [Role.COACH, Role.ADMIN] and ticket.status in [TicketStatus.OPEN, TicketStatus.ASSIGNED]:
            ticket.status = TicketStatus.IN_PROGRESS
            ticket.save(update_fields=['status', 'updated_at'])

        # Notify the other party
        recipient = None
        if request.user.id == ticket.candidate.user.id:
            # Candidate replied -> notify assigned coach if any
            if ticket.assigned_coach:
                recipient = ticket.assigned_coach
        else:
            # Coach / Admin replied -> notify candidate
            recipient = ticket.candidate.user

        if recipient:
            create_notification(
                user=recipient,
                notification_type='system',
                title="New Support Reply",
                message=f"New response on ticket '{ticket.subject}' from {request.user.full_name}",
                link=f"/support/tickets/{ticket.id}"
            )

        serializer = SupportMessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ==============================================================================
# JOB COACH SPECIFIC VIEWS
# ==============================================================================

class CoachCandidatesListView(APIView):
    """
    List candidates assigned to the logged-in coach.
    Constraint: "A coach can only see candidates assigned to them."
    """
    permission_classes = [IsAuthenticated, IsJobCoach]

    def get(self, request):
        coach = request.user
        assigned_candidates = CandidateProfile.objects.filter(
            coach_assignments__coach=coach,
            coach_assignments__is_active=True
        ).select_related('user', 'accessibility_profile').prefetch_serializer_data() if hasattr(CandidateProfile.objects, 'prefetch_serializer_data') else CandidateProfile.objects.filter(
            coach_assignments__coach=coach,
            coach_assignments__is_active=True
        ).select_related('user', 'accessibility_profile').prefetch_related('educations', 'skills', 'applications')

        serializer = CoachCandidateSummarySerializer(assigned_candidates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CoachCandidateDetailView(APIView):
    """
    Retrieve single candidate's details for an assigned coach.
    Enforces strict access: Coach can only view candidates assigned to them.
    """
    permission_classes = [IsAuthenticated, IsJobCoach]

    def get(self, request, pk):
        coach = request.user
        is_assigned = JobCoachAssignment.objects.filter(
            coach=coach, candidate_id=pk, is_active=True
        ).exists()

        if not is_assigned:
            raise PermissionDenied("You can only access candidates assigned to you.")

        candidate = get_object_or_404(
            CandidateProfile.objects.select_related('user', 'accessibility_profile').prefetch_related(
                'educations', 'skills', 'trainings', 'experiences', 'applications__job'
            ),
            id=pk
        )

        serializer = CoachCandidateSummarySerializer(candidate)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CoachNotesView(APIView):
    """
    List or add private counselling notes for an assigned candidate.
    """
    permission_classes = [IsAuthenticated, IsJobCoach]

    def get(self, request, candidate_id):
        coach = request.user
        is_assigned = JobCoachAssignment.objects.filter(
            coach=coach, candidate_id=candidate_id, is_active=True
        ).exists()
        if not is_assigned:
            raise PermissionDenied("You can only view notes for candidates assigned to you.")

        notes = CoachNote.objects.filter(coach=coach, candidate_id=candidate_id)
        serializer = CoachNoteSerializer(notes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, candidate_id):
        coach = request.user
        is_assigned = JobCoachAssignment.objects.filter(
            coach=coach, candidate_id=candidate_id, is_active=True
        ).exists()
        if not is_assigned:
            raise PermissionDenied("You can only write notes for candidates assigned to you.")

        content = request.data.get('content', '').strip()
        title = request.data.get('title', 'Counseling Note').strip()
        if not content:
            return Response({"error": "Note content is required."}, status=status.HTTP_400_BAD_REQUEST)

        candidate = get_object_or_404(CandidateProfile, id=candidate_id)
        note = CoachNote.objects.create(
            coach=coach,
            candidate=candidate,
            title=title or 'Counseling Note',
            content=content
        )

        serializer = CoachNoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CoachRecommendJobView(APIView):
    """
    Coach recommends a job to an assigned candidate.
    Creates a recommendation record and sends in-app notification.
    """
    permission_classes = [IsAuthenticated, IsJobCoach]

    def post(self, request, candidate_id):
        coach = request.user
        is_assigned = JobCoachAssignment.objects.filter(
            coach=coach, candidate_id=candidate_id, is_active=True
        ).exists()
        if not is_assigned:
            raise PermissionDenied("You can only recommend jobs to candidates assigned to you.")

        job_id = request.data.get('job_id')
        note = request.data.get('recommendation_note', '').strip()

        if not job_id:
            return Response({"error": "job_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        candidate = get_object_or_404(CandidateProfile, id=candidate_id)
        job = get_object_or_404(Job, id=job_id)

        recommendation, created = CoachJobRecommendation.objects.update_or_create(
            coach=coach,
            candidate=candidate,
            job=job,
            defaults={'recommendation_note': note}
        )

        # Notify candidate
        create_notification(
            user=candidate.user,
            notification_type='job_recommendation',
            title=f"Job Recommended by Coach {coach.full_name}",
            message=f"Your coach recommended '{job.title}' at {job.organization.name}. {note}",
            link=f"/jobs/{job.id}"
        )

        serializer = CoachJobRecommendationSerializer(recommendation)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CandidateRecommendationsView(APIView):
    """List job recommendations received by the logged-in candidate."""
    permission_classes = [IsAuthenticated, IsCandidate]

    def get(self, request):
        if not hasattr(request.user, 'candidate_profile'):
            return Response([], status=status.HTTP_200_OK)

        recommendations = CoachJobRecommendation.objects.filter(
            candidate=request.user.candidate_profile
        ).select_related('coach', 'job', 'job__organization')

        serializer = CoachJobRecommendationSerializer(recommendations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==============================================================================
# GUARDIAN DELEGATION VIEWS
# ==============================================================================

class GuardianAccessManagementView(APIView):
    """
    Endpoint for candidates to manage guardian permissions,
    or for guardians to view the candidate profiles they are permitted to view.
    Requirement: "Guardians only see what the candidate has allowed."
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == Role.CANDIDATE:
            if not hasattr(user, 'candidate_profile'):
                return Response([], status=status.HTTP_200_OK)
            accesses = GuardianAccess.objects.filter(candidate=user.candidate_profile).select_related('guardian')
            serializer = GuardianAccessSerializer(accesses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif user.role == Role.GUARDIAN:
            # List all candidate delegations granted to this guardian
            accesses = GuardianAccess.objects.filter(guardian=user).select_related('candidate__user')
            serializer = GuardianAccessSerializer(accesses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response([], status=status.HTTP_200_OK)

    def post(self, request):
        """Candidate grants or updates access to a guardian."""
        user = request.user
        if user.role != Role.CANDIDATE or not hasattr(user, 'candidate_profile'):
            raise PermissionDenied("Only candidates can grant or modify guardian permissions.")

        guardian_email = request.data.get('guardian_email', '').strip().lower()
        if not guardian_email:
            return Response({"error": "guardian_email is required."}, status=status.HTTP_400_BAD_REQUEST)

        guardian_user = get_object_or_404(User, email__iexact=guardian_email, role=Role.GUARDIAN)

        relationship = request.data.get('relationship', 'Parent')
        allow_view_profile = request.data.get('allow_view_profile', True)
        allow_view_applications = request.data.get('allow_view_applications', True)
        allow_view_support_tickets = request.data.get('allow_view_support_tickets', True)
        allow_view_learning_progress = request.data.get('allow_view_learning_progress', True)

        access, created = GuardianAccess.objects.update_or_create(
            guardian=guardian_user,
            candidate=user.candidate_profile,
            defaults={
                'relationship': relationship,
                'allow_view_profile': allow_view_profile,
                'allow_view_applications': allow_view_applications,
                'allow_view_support_tickets': allow_view_support_tickets,
                'allow_view_learning_progress': allow_view_learning_progress,
            }
        )

        serializer = GuardianAccessSerializer(access)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class GuardianCandidateProfileView(APIView):
    """
    Guardian accesses a candidate's profile ONLY if candidate allowed:
    allow_view_profile == True.
    """
    permission_classes = [IsAuthenticated, IsGuardian]

    def get(self, request, candidate_id):
        guardian = request.user
        delegation = GuardianAccess.objects.filter(
            guardian=guardian, candidate_id=candidate_id
        ).first()

        if not delegation:
            raise PermissionDenied("You are not linked to this candidate.")

        if not delegation.allow_view_profile:
            raise PermissionDenied("The candidate has not permitted profile viewing.")

        candidate = get_object_or_404(CandidateProfile, id=candidate_id)

        # Return safe profile summary without sensitive UDID
        return Response({
            "id": str(candidate.id),
            "full_name": candidate.user.full_name,
            "email": candidate.user.email,
            "phone": candidate.user.phone,
            "city": candidate.city,
            "state": candidate.state,
            "preferred_sector": candidate.preferred_sector,
            "preferred_work_mode": candidate.preferred_work_mode,
            "completion_percentage": candidate.completion_percentage,
            "permissions": {
                "allow_view_profile": delegation.allow_view_profile,
                "allow_view_applications": delegation.allow_view_applications,
                "allow_view_support_tickets": delegation.allow_view_support_tickets,
                "allow_view_learning_progress": delegation.allow_view_learning_progress,
            }
        }, status=status.HTTP_200_OK)
