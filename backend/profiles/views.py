from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, NotFound
from django.core.exceptions import ValidationError
from django.http import FileResponse, Http404

from admin_panel.models import AdminAuditLog
from support.models import JobCoachAssignment, GuardianAccess
from .models import (
    CandidateProfile,
    AccessibilityProfile,
    Education,
    Skill,
    Training,
    Experience,
    CandidateDocument,
    DocumentType,
)
from .serializers import (
    CandidateProfileSerializer,
    CandidatePersonalInfoUpdateSerializer,
    AccessibilityProfileSerializer,
    EducationSerializer,
    SkillSerializer,
    TrainingSerializer,
    ExperienceSerializer,
    CandidateDocumentSerializer,
)
from .services import get_or_create_candidate_profile, calculate_completion_percentage
from .permissions import IsProfileOwner
from .storage import (
    document_storage,
    validate_document_file,
    MAX_DOCUMENTS_PER_CANDIDATE,
    sanitize_filename,
)
from accounts.models import Role


class CandidateProfileMeView(APIView):
    """View and update the authenticated user's own candidate profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_or_create_candidate_profile(request.user)
        calculate_completion_percentage(profile)
        serializer = CandidateProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = get_or_create_candidate_profile(request.user)
        serializer = CandidatePersonalInfoUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            calculate_completion_percentage(profile)
            full_serializer = CandidateProfileSerializer(profile, context={'request': request})
            return Response(full_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CandidateAccessibilityUpdateView(APIView):
    """Update disability details, Washington Group questions, and accommodations."""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        profile = get_or_create_candidate_profile(request.user)
        accessibility_obj, _ = AccessibilityProfile.objects.get_or_create(candidate=profile)

        serializer = AccessibilityProfileSerializer(
            accessibility_obj,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            calculate_completion_percentage(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CandidateProfileDetailView(APIView):
    """Access a profile by ID with strict role & ownership enforcement."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            profile = CandidateProfile.objects.get(pk=pk)
        except CandidateProfile.DoesNotExist:
            raise NotFound("Candidate profile not found.")

        user = request.user
        if user.role == Role.ADMIN or user.is_staff or user.is_superuser:
            pass  # Admins have access for administrative support
        elif user.role == Role.CANDIDATE:
            if user != profile.user:
                raise PermissionDenied("Candidates cannot view another candidate's private profile.")
        elif user.role == Role.COACH:
            pass  # Authorized job coaches may view profiles to provide mentorship; UDID is masked in serializer
        elif user.role == Role.GUARDIAN:
            from support.models import GuardianAccess
            has_access = GuardianAccess.objects.filter(
                guardian=user, candidate=profile
            ).exists()
            if not has_access:
                raise PermissionDenied("You do not have guardian delegation access for this candidate profile.")
        else:
            raise PermissionDenied("You do not have permission to view this candidate profile.")

        serializer = CandidateProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# Sub-entities views (Education, Skills, Training, Experience)

class EducationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_or_create_candidate_profile(request.user)
        educations = profile.educations.all()
        serializer = EducationSerializer(educations, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = get_or_create_candidate_profile(request.user)
        serializer = EducationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(candidate=profile)
            calculate_completion_percentage(profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EducationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        profile = get_or_create_candidate_profile(request.user)
        try:
            item = profile.educations.get(pk=pk)
            item.delete()
            calculate_completion_percentage(profile)
            return Response({"message": "Education entry removed."}, status=status.HTTP_204_NO_CONTENT)
        except Education.DoesNotExist:
            return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)


class SkillListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_or_create_candidate_profile(request.user)
        skills = profile.skills.all()
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = get_or_create_candidate_profile(request.user)
        serializer = SkillSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(candidate=profile)
            calculate_completion_percentage(profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SkillDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        profile = get_or_create_candidate_profile(request.user)
        try:
            item = profile.skills.get(pk=pk)
            item.delete()
            calculate_completion_percentage(profile)
            return Response({"message": "Skill removed."}, status=status.HTTP_204_NO_CONTENT)
        except Skill.DoesNotExist:
            return Response({"error": "Skill not found."}, status=status.HTTP_404_NOT_FOUND)


class ExperienceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_or_create_candidate_profile(request.user)
        experiences = profile.experiences.all()
        serializer = ExperienceSerializer(experiences, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = get_or_create_candidate_profile(request.user)
        serializer = ExperienceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(candidate=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExperienceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        profile = get_or_create_candidate_profile(request.user)
        try:
            item = profile.experiences.get(pk=pk)
            item.delete()
            return Response({"message": "Experience entry removed."}, status=status.HTTP_204_NO_CONTENT)
        except Experience.DoesNotExist:
            return Response({"error": "Entry not found."}, status=status.HTTP_404_NOT_FOUND)


class CandidateDocumentListCreateView(APIView):
    """
    List uploaded candidate documents or upload a new verified document.
    Enforces file size <= 5 MB, extensions (.pdf, .docx, .jpg, .png),
    deep magic byte validation, and a maximum quota of 10 documents per candidate.
    """
    permission_classes = [IsAuthenticated]
    throttle_scope = 'uploads'

    def get(self, request):
        candidate_id = request.query_params.get('candidate_id')
        user = request.user

        if candidate_id:
            # Viewing another candidate's documents: strictly verify permissions
            try:
                candidate_profile = CandidateProfile.objects.get(id=candidate_id)
            except CandidateProfile.DoesNotExist:
                return Response({"error": "Candidate profile not found."}, status=status.HTTP_404_NOT_FOUND)

            is_owner = hasattr(user, 'candidate_profile') and user.candidate_profile.id == candidate_profile.id
            is_coach = JobCoachAssignment.objects.filter(candidate=candidate_profile, coach=user, is_active=True).exists()
            is_guardian = GuardianAccess.objects.filter(candidate=candidate_profile, guardian=user, allow_view_documents=True).exists()
            is_admin = user.role == Role.ADMIN or user.is_staff or user.is_superuser

            if not (is_owner or is_coach or is_guardian or is_admin):
                raise PermissionDenied("You do not have permission to view documents for this candidate.")

            docs = candidate_profile.documents.all()
        else:
            profile = get_or_create_candidate_profile(user)
            docs = profile.documents.all()

        serializer = CandidateDocumentSerializer(docs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        profile = get_or_create_candidate_profile(request.user)

        # 1. Enforce quota: maximum 10 documents per candidate
        if profile.documents.count() >= MAX_DOCUMENTS_PER_CANDIDATE:
            return Response(
                {
                    "error": (
                        f"You have reached the maximum quota of {MAX_DOCUMENTS_PER_CANDIDATE} documents. "
                        f"Please delete an older document before uploading a new one."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. File presence
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {"file": ["Please select a document file to upload."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Document type check (resume, certificate, other - strictly no UDID)
        raw_type = request.data.get('document_type', DocumentType.RESUME)
        valid_types = [DocumentType.RESUME, DocumentType.CERTIFICATE, DocumentType.OTHER]
        if raw_type not in valid_types:
            return Response(
                {
                    "document_type": [
                        f"Invalid document type '{raw_type}'. Allowed categories: 'resume', 'certificate', 'other'."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Strict extension, size, and magic byte validation
        try:
            detected_content_type = validate_document_file(file_obj)
        except ValidationError as e:
            return Response({"file": [e.message]}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Persist file in private storage
        stored_key, size = document_storage.save_file(file_obj, str(profile.id), file_obj.name)

        # 6. Optional JobApplication association
        app_id = request.data.get('application_id')
        application = None
        if app_id:
            application = profile.applications.filter(id=app_id).first()

        doc = CandidateDocument.objects.create(
            owner=profile,
            document_type=raw_type,
            original_filename=file_obj.name,
            stored_key=stored_key,
            content_type=detected_content_type,
            size=size,
            application=application,
        )

        serializer = CandidateDocumentSerializer(doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CandidateDocumentDetailView(APIView):
    """Delete an uploaded candidate document."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            doc = CandidateDocument.objects.select_related('owner__user').get(pk=pk)
        except CandidateDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        is_owner = doc.owner.user == request.user
        is_admin = request.user.role == Role.ADMIN or request.user.is_staff or request.user.is_superuser

        if not (is_owner or is_admin):
            raise PermissionDenied("You do not have permission to delete this document.")

        doc.delete()  # Triggers post_delete signal to remove physical file
        return Response({"message": "Document successfully deleted."}, status=status.HTTP_200_OK)


class CandidateDocumentDownloadView(APIView):
    """
    Authorizes document download and generates a short-lived (5 min) signed URL.
    Authorized viewers:
    - Candidate owner
    - Assigned Job Coach
    - Parent/Guardian if allow_view_documents is enabled
    - Administrator
    All non-owner downloads and admin access are logged to the audit log.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = CandidateDocument.objects.select_related('owner__user').get(pk=pk)
        except CandidateDocument.DoesNotExist:
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_owner = doc.owner.user == user
        is_coach = JobCoachAssignment.objects.filter(candidate=doc.owner, coach=user, is_active=True).exists()
        is_guardian = GuardianAccess.objects.filter(candidate=doc.owner, guardian=user, allow_view_documents=True).exists()
        is_admin = user.role == Role.ADMIN or user.is_staff or user.is_superuser

        if not (is_owner or is_coach or is_guardian or is_admin):
            raise PermissionDenied("You do not have authorization to view or download this document.")

        # Audit log non-owner access and administrator access
        if not is_owner or is_admin:
            AdminAuditLog.objects.create(
                action_type='DOCUMENT_DOWNLOAD',
                target_entity='CandidateDocument',
                target_id=str(doc.id),
                admin_user=user if is_admin else None,
                details=(
                    f"Document '{doc.original_filename}' ({doc.get_document_type_display()}) "
                    f"of candidate {doc.owner.user.full_name} downloaded by {user.full_name} ({user.role})"
                ),
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        download_url = document_storage.generate_signed_download_url(doc, request=request, expires_in=300)
        return Response(
            {
                "download_url": download_url,
                "expires_in": 300,
                "filename": doc.original_filename,
            },
            status=status.HTTP_200_OK,
        )


class LocalDocumentDownloadStreamView(APIView):
    """
    Streams file bytes for local storage when valid short-lived cryptographic token is supplied.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk):
        token = request.query_params.get('token')
        if not token:
            return Response({"error": "Missing download verification token."}, status=status.HTTP_400_BAD_REQUEST)

        if not document_storage.verify_token(str(pk), token, max_age=300):
            return Response(
                {"error": "This download link is invalid or has expired. Please request a new link from your dashboard."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            doc = CandidateDocument.objects.get(pk=pk)
        except CandidateDocument.DoesNotExist:
            raise Http404("Document does not exist.")

        local_path = document_storage.get_local_file_path(doc.stored_key)
        if not local_path or not local_path.exists():
            raise Http404("File not found on storage server.")

        response = FileResponse(
            open(local_path, 'rb'),
            content_type=doc.content_type,
            as_attachment=True,
            filename=sanitize_filename(doc.original_filename),
        )
        response['X-Content-Type-Options'] = 'nosniff'
        return response

