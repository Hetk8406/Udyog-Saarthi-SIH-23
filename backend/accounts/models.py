import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Role(models.TextChoices):
    CANDIDATE = 'candidate', 'Candidate'
    GUARDIAN = 'guardian', 'Parent / Guardian'
    COACH = 'coach', 'Job Coach'
    ADMIN = 'admin', 'Administrator'


class CustomUserManager(BaseUserManager):
    """Manager for custom user model where email is the unique identifier."""

    def create_user(self, email, full_name, password=None, role=Role.CANDIDATE, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        if not full_name:
            raise ValueError('Full name is required')

        email = self.normalize_email(email)
        from django.conf import settings
        from core.demo_guard import is_demo_account
        if not getattr(settings, 'DEBUG', True) and is_demo_account(email):
            raise ValueError(f"Demo accounts (e.g. {email}) cannot be created when DEBUG is False.")

        user = self.model(email=email, full_name=full_name, role=role, **extra_fields)
        # Hash the password properly
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model representing all platform users with roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default='')
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CANDIDATE,
        help_text='User role on the platform'
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when user agreed to Terms & Privacy Policy'
    )
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.full_name} ({self.email}) - {self.get_role_display()}"
