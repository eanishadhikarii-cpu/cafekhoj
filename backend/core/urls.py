from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, MeView, LocationListView, AnalyticsTrackView, AuditLogListView, health_check

urlpatterns = [
    path('health/', health_check, name='api-health'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('locations/', LocationListView.as_view(), name='locations-list'),
    path('analytics/track/', AnalyticsTrackView.as_view(), name='analytics-track'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs-list'),
]

