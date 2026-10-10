"""
Custom security headers middleware for Udyog Saarthi API.
Enforces Content-Security-Policy, Permissions-Policy, and Referrer-Policy on all API responses.
"""

class SecurityHeadersMiddleware:
    """Appends security headers to all incoming HTTP responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content-Security-Policy (Restricts embedded scripts, frames, and resource loading)
        if 'Content-Security-Policy' not in response.headers:
            response.headers['Content-Security-Policy'] = "default-src 'self'; frame-ancestors 'none';"

        # Permissions-Policy (Disables unnecessary device sensor capabilities)
        if 'Permissions-Policy' not in response.headers:
            response.headers['Permissions-Policy'] = "camera=(), microphone=(), geolocation=()"

        # Referrer-Policy (Protects privacy by stripping path query parameters on cross-origin requests)
        if 'Referrer-Policy' not in response.headers:
            response.headers['Referrer-Policy'] = "strict-origin-when-cross-origin"

        # Anti-sniffing and frame protection reinforcement
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'

        return response
