from django.contrib import admin
from django.urls import path, include
from core.views import health_check

urlpatterns = [
    path('api/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/profiles/', include('profiles.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/applications/', include('applications.urls')),
    path('api/learning/', include('learning.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/support/', include('support.urls')),
    path('api/admin-panel/', include('admin_panel.urls')),
    path('api/ai-assistant/', include('ai_assistant.urls')),
]
