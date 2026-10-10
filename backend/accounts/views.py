from datetime import timedelta
from django.conf import settings
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from core.turnstile import verify_turnstile


def set_auth_cookies(response, access_token, refresh_token=None):
    """
    Sets access and refresh tokens as HttpOnly, SameSite cookies on the response.
    Tokens are not exposed to JavaScript in the browser.
    """
    cookie_domain = getattr(settings, 'AUTH_COOKIE_DOMAIN', None)
    cookie_secure = getattr(settings, 'AUTH_COOKIE_SECURE', not settings.DEBUG)
    cookie_samesite = getattr(settings, 'AUTH_COOKIE_SAMESITE', 'Lax')
    access_name = getattr(settings, 'AUTH_COOKIE_ACCESS_NAME', 'access_token')
    refresh_name = getattr(settings, 'AUTH_COOKIE_REFRESH_NAME', 'refresh_token')
    access_path = getattr(settings, 'AUTH_COOKIE_PATH', '/')
    refresh_path = getattr(settings, 'AUTH_COOKIE_REFRESH_PATH', '/api/auth/')

    access_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(days=1))
    refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=7))

    response.set_cookie(
        key=access_name,
        value=str(access_token),
        max_age=int(access_lifetime.total_seconds()),
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path=access_path,
        domain=cookie_domain,
    )
    if refresh_token is not None:
        response.set_cookie(
            key=refresh_name,
            value=str(refresh_token),
            max_age=int(refresh_lifetime.total_seconds()),
            httponly=True,
            secure=cookie_secure,
            samesite=cookie_samesite,
            path=refresh_path,
            domain=cookie_domain,
        )


def clear_auth_cookies(response):
    """
    Deletes the authentication cookies by setting expired dates matching paths and domains.
    """
    cookie_domain = getattr(settings, 'AUTH_COOKIE_DOMAIN', None)
    access_name = getattr(settings, 'AUTH_COOKIE_ACCESS_NAME', 'access_token')
    refresh_name = getattr(settings, 'AUTH_COOKIE_REFRESH_NAME', 'refresh_token')
    access_path = getattr(settings, 'AUTH_COOKIE_PATH', '/')
    refresh_path = getattr(settings, 'AUTH_COOKIE_REFRESH_PATH', '/api/auth/')

    response.delete_cookie(access_name, path=access_path, domain=cookie_domain)
    response.delete_cookie(refresh_name, path=refresh_path, domain=cookie_domain)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """
    Provides a readable CSRF token and sets the csrftoken cookie.
    Frontend SPAs call this endpoint to initialize or refresh CSRF tokens.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        csrf_token = get_token(request)
        return Response({"csrfToken": csrf_token}, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """Register a new candidate or parent/guardian user."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        turnstile_token = request.data.get('turnstile_token')
        client_ip = request.META.get('REMOTE_ADDR')
        if not verify_turnstile(turnstile_token, remote_ip=client_ip):
            return Response(
                {"turnstile_token": ["Security verification challenge failed. Please refresh and try again."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            response = Response(
                {
                    "message": "Registration successful.",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )
            set_auth_cookies(response, refresh.access_token, refresh)
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Authenticate with email and password and set HttpOnly JWT cookies."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        turnstile_token = request.data.get('turnstile_token')
        client_ip = request.META.get('REMOTE_ADDR')
        if not verify_turnstile(turnstile_token, remote_ip=client_ip):
            return Response(
                {"turnstile_token": ["Security verification challenge failed. Please refresh and try again."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            response = Response(
                {
                    "message": "Login successful.",
                    "user": UserSerializer(data['user']).data,
                },
                status=status.HTTP_200_OK,
            )
            set_auth_cookies(response, data['access'], data['refresh'])
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CookieTokenRefreshView(APIView):
    """
    Rotates refresh token and issues new access token via HttpOnly cookies.
    Blacklists the previous refresh token.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        refresh_name = getattr(settings, 'AUTH_COOKIE_REFRESH_NAME', 'refresh_token')
        raw_refresh = request.COOKIES.get(refresh_name) or request.data.get('refresh')
        if not raw_refresh:
            return Response(
                {"detail": "Refresh token is missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={'refresh': raw_refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            return Response(
                {"detail": "Token is invalid or expired", "code": "token_not_valid"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        new_access = serializer.validated_data['access']
        new_refresh = serializer.validated_data.get('refresh')

        response = Response(
            {"message": "Token refreshed successfully."},
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(response, new_access, new_refresh)
        return response


class LogoutView(APIView):
    """Logout by clearing auth cookies and blacklisting the refresh token."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_name = getattr(settings, 'AUTH_COOKIE_REFRESH_NAME', 'refresh_token')
        raw_refresh = request.COOKIES.get(refresh_name) or request.data.get('refresh')
        if raw_refresh:
            try:
                token = RefreshToken(raw_refresh)
                token.blacklist()
            except (TokenError, AttributeError):
                pass

        response = Response(
            {"message": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    """Return identity and role profile of currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """Request a password reset email."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        turnstile_token = request.data.get('turnstile_token')
        client_ip = request.META.get('REMOTE_ADDR')
        if not verify_turnstile(turnstile_token, remote_ip=client_ip):
            return Response(
                {"turnstile_token": ["Security verification challenge failed. Please refresh and try again."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "If an active account exists with that email, a password reset link has been dispatched."
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Confirm new password with reset token."""
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password has been successfully reset. You may now log in with your new password."},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
