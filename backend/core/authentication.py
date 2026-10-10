from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication


class CSRFCheck(CsrfViewMiddleware):
    def _reject(self, request, reason):
        return reason


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that extracts the access token from
    an HttpOnly cookie named in settings.AUTH_COOKIE_ACCESS_NAME (default 'access_token').
    Falls back to the Authorization header if no cookie is present.
    Enforces strict CSRF validation for all state-changing methods (POST, PUT, PATCH, DELETE)
    whenever cookie authentication is used.
    """

    def authenticate(self, request):
        cookie_name = getattr(settings, 'AUTH_COOKIE_ACCESS_NAME', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)
        using_cookie = False

        if raw_token:
            using_cookie = True
        else:
            header = self.get_header(request)
            if header is not None:
                raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        # Enforce CSRF protection for state-changing requests when authenticating via cookies
        if using_cookie:
            self.enforce_csrf(request)

        return (user, validated_token)

    def enforce_csrf(self, request):
        """
        Enforces CSRF validation for cookie-based authentication on state-changing methods.
        """
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            return

        def dummy_get_response(request):
            return None

        check = CSRFCheck(dummy_get_response)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f'CSRF Failed: {reason}')
