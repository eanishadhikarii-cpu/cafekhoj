from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, VerifyOTPView, ResendOTPView, LoginView, MeView,
    LocationListView, AnalyticsTrackView, AuditLogListView, health_check,
    OperatorDeviceListView, OperatorDeauthorizeDeviceView,
    AdminDeviceRequestsListView, AdminDeviceRequestReviewView,
    AdminNotificationListView, AdminNotificationMarkReadView,
    AdminNotificationMarkAllReadView, AdminPlatformUsersListView,
    AdminPlatformDelegateView
)

urlpatterns = [
    # Health checks
    path('health/', health_check, name='api-health'),

    # Authentication & OTP Verification
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('auth/resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', MeView.as_view(), name='auth-me'),

    # Operator Device Management
    path('auth/devices/', OperatorDeviceListView.as_view(), name='operator-devices'),
    path('auth/devices/<int:pk>/deauthorize/', OperatorDeauthorizeDeviceView.as_view(), name='operator-device-deauthorize'),

    # Admin Device Authorization Management
    path('admin-api/devices/', AdminDeviceRequestsListView.as_view(), name='admin-device-requests'),
    path('admin-api/devices/<int:pk>/review/', AdminDeviceRequestReviewView.as_view(), name='admin-device-review'),

    # Admin Notifications Center
    path('admin-api/notifications/', AdminNotificationListView.as_view(), name='admin-notifications'),
    path('admin-api/notifications/<int:pk>/read/', AdminNotificationMarkReadView.as_view(), name='admin-notification-read'),
    path('admin-api/notifications/read-all/', AdminNotificationMarkAllReadView.as_view(), name='admin-notification-read-all'),

    # Admin Accounts & 2-Admin Limit
    path('admin-api/administrators/', AdminPlatformUsersListView.as_view(), name='admin-platform-users'),
    path('admin-api/administrators/delegate/', AdminPlatformDelegateView.as_view(), name='admin-platform-delegate'),

    # Discovery & Metadata
    path('locations/', LocationListView.as_view(), name='locations-list'),
    path('analytics/track/', AnalyticsTrackView.as_view(), name='analytics-track'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs-list'),
]
