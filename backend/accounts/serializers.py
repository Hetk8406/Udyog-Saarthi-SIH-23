from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Role


class UserSerializer(serializers.ModelSerializer):
    """Public serializer for user details."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'phone',
            'role',
            'role_display',
            'is_active',
            'terms_accepted_at',
            'date_joined',
        ]
        read_only_fields = ['id', 'role_display', 'is_active', 'terms_accepted_at', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for new user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    terms_accepted = serializers.BooleanField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'phone',
            'role',
            'password',
            'password_confirm',
            'terms_accepted',
        ]
        extra_kwargs = {
            'role': {'required': False, 'default': Role.CANDIDATE}
        }

    def validate_email(self, value):
        normalized = value.strip().lower()
        from core.demo_guard import is_demo_account
        if not getattr(settings, 'DEBUG', True) and is_demo_account(normalized):
            raise serializers.ValidationError(
                "Demo accounts (e.g. admin@demo.com) cannot be created when DEBUG is False."
            )
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate_role(self, value):
        # Public registration is only permitted for Candidate and Guardian roles
        allowed_public_roles = [Role.CANDIDATE, Role.GUARDIAN]
        if value not in allowed_public_roles:
            raise serializers.ValidationError(
                "Only Candidate and Parent/Guardian accounts can be registered publicly. "
                "Job Coaches and Administrators are provisioned by invitation."
            )
        return value

    def validate(self, attrs):
        if not attrs.get('terms_accepted'):
            raise serializers.ValidationError({"terms_accepted": "You must agree to the Terms and Privacy Policy to register."})
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data.pop('terms_accepted', None)
        password = validated_data.pop('password')
        # Create user via manager with terms consent timestamp
        user = User.objects.create_user(password=password, terms_accepted_at=timezone.now(), **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login returning JWT tokens."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        from core.demo_guard import is_demo_account
        if not getattr(settings, 'DEBUG', True) and is_demo_account(email):
            raise serializers.ValidationError(
                "Demo accounts cannot log in when DEBUG is False."
            )

        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        refresh = RefreshToken.for_user(user)

        return {
            'user': user,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request a password reset link sent to user email."""
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()

    def save(self):
        email = self.validated_data['email']
        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
            reset_url = f"{frontend_base}/reset-password?uid={uidb64}&token={token}"

            subject = "Udyog Saarthi - Password Reset Request"
            plain_message = (
                f"Hello {user.full_name},\n\n"
                f"We received a request to reset your password for your Udyog Saarthi account.\n\n"
                f"Please open the link below to choose a new password:\n"
                f"{reset_url}\n\n"
                f"This link will expire in 1 hour for your security.\n\n"
                f"If you did not request a password reset, you can safely ignore this email. Your account remains secure.\n\n"
                f"Warm regards,\n"
                f"The Udyog Saarthi Team\n"
                f"Need help? Contact support@udyogsaarthi.in"
            )
            html_message = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset Your Udyog Saarthi Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; width: 100%;">
    <tr>
      <td style="background-color: #1d4ed8; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Udyog Saarthi</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #dbeafe;">Accessible Career Portal for Persons with Disabilities</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <p style="font-size: 16px; margin: 0 0 16px;">Hello <strong>{user.full_name}</strong>,</p>
        <p style="font-size: 15px; margin: 0 0 20px;">We received a request to reset the password for your Udyog Saarthi account.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{reset_url}" style="display: inline-block; background-color: #1d4ed8; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Reset Your Password &rarr;
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 20px 0 8px;">Or copy and paste this link into your web browser:</p>
        <p style="font-size: 12px; word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 6px; margin: 0 0 24px; color: #334155;">
          <a href="{reset_url}" style="color: #1d4ed8;">{reset_url}</a>
        </p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">
          This link will expire in <strong>1 hour</strong> for your security. If you did not make this request, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 13px; color: #64748b; margin: 0;">Need assistance? Reply directly to this email or reach us at <a href="mailto:support@udyogsaarthi.in" style="color: #1d4ed8;">support@udyogsaarthi.in</a>.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        &copy; 2026 Udyog Saarthi &bull; Department of Empowerment of Persons with Disabilities &bull; Accessible & Secure
      </td>
    </tr>
  </table>
</body>
</html>"""
            from core.email import send_async_email
            send_async_email(
                subject=subject,
                plain_text=plain_message,
                html_content=html_message,
                recipients=[user.email],
            )


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm new password using reset token."""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField(min_length=8)

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('new_password_confirm'):
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})

        try:
            user_id = force_str(urlsafe_base64_decode(attrs.get('uid')))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"uid": "Invalid password reset link."})

        if not default_token_generator.check_token(user, attrs.get('token')):
            raise serializers.ValidationError({"token": "Password reset link is invalid or expired."})

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
