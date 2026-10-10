import uuid
from django.db import models
from django.conf import settings


class AdminAuditLog(models.Model):
    """
    Audit log recording sensitive administrator operations.
    e.g. User role updates, job publication, assignment changes, ticket deletion, etc.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action_type = models.CharField(
        max_length=50,
        help_text='e.g. CREATE, UPDATE, DELETE, ROLE_CHANGE, STATUS_CHANGE'
    )
    target_entity = models.CharField(
        max_length=50,
        help_text='e.g. User, Job, CandidateProfile, Course, MockTest, SupportTicket'
    )
    target_id = models.CharField(max_length=100, blank=True, default='')
    details = models.TextField(help_text='Human readable summary of changes or payload')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        admin_name = self.admin_user.full_name if self.admin_user else "System"
        return f"[{self.action_type}] {self.target_entity} by {admin_name} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
