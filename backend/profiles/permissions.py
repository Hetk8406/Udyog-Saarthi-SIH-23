from rest_framework.permissions import BasePermission


class IsProfileOwner(BasePermission):
    """Allows access only to the candidate who owns this profile."""
    message = "You do not have permission to view or modify another user's profile."

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'candidate'):
            return obj.candidate.user == request.user
        return False
