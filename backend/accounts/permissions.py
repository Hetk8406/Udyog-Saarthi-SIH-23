from rest_framework.permissions import BasePermission
from .models import Role


class IsCandidate(BasePermission):
    """Allows access only to authenticated candidate users."""
    message = "Access restricted to Candidates only."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == Role.CANDIDATE
        )


class IsGuardian(BasePermission):
    """Allows access only to authenticated parent/guardian users."""
    message = "Access restricted to Parents/Guardians only."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == Role.GUARDIAN
        )


class IsJobCoach(BasePermission):
    """Allows access only to authenticated job coaches."""
    message = "Access restricted to Job Coaches only."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == Role.COACH
        )


class IsAdminRole(BasePermission):
    """Allows access only to platform administrators."""
    message = "Access restricted to Administrators only."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == Role.ADMIN or request.user.is_staff or request.user.is_superuser)
        )
