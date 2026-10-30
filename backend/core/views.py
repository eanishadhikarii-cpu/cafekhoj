import hashlib
import logging
from datetime import timedelta
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import views, generics, status, permissions
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, Location, AuditLog, AnalyticsEvent, EmailOTP, PasswordResetChallenge,
    DeviceSession, DeviceAuthorizationRequest, PlatformAdministrator, AdminNotification
)
from .serializers import (
    UserSerializer, RegisterSerializer, LocationSerializer,
    AuditLogSerializer, AnalyticsEventSerializer, VerifyOTPSerializer,
    ResendOTPSerializer, DeviceSessionSerializer,
    DeviceAuthorizationRequestSerializer, PlatformAdministratorSerializer,
    AdminNotificationSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .email import send_otp_verification_email, send_password_reset_email

logger = logging.getLogger(__name__)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def get_device_identifier(request):
    """
    Extracts a stable client-provided or fingerprint-derived device identifier.
    """
    device_id = request.headers.get('X-Device-Id') or request.META.get('HTTP_X_DEVICE_ID')
    if not device_id:
        # Construct fallback fingerprint from IP + User Agent
        raw = f"{get_client_ip(request)}-{request.META.get('HTTP_USER_AGENT', 'unknown')}"
        device_id = hashlib.sha256(raw.encode('utf-8')).hexdigest()[:32]
    return device_id.strip()


def get_device_name(request):
    name = request.headers.get('X-Device-Name') or request.META.get('HTTP_X_DEVICE_NAME')
    if not name:
        ua = request.META.get('HTTP_USER_AGENT', 'Browser / Mobile Client')
        name = ua[:80]
    return name.strip()


# -------------------------------------------------------------
# Service Root and Health Handlers (resolves 404 on / and /api/v1)
# -------------------------------------------------------------

def root_view(request):
    """
    Root endpoint for https://cafekhoj-api.onrender.com/
    Provides service discovery and operational status (eliminates GET / 404).
    """
    from django.http import JsonResponse
    return JsonResponse({
        'service': 'cafekhoj-api',
        'status': 'healthy',
        'version': '1.0.0',
        'project': 'CafeKhoj (Jhapa, Nepal)',
        'api_root': '/api/v1/',
        'documentation': '/api/v1/health/'
    }, status=200)


def api_v1_root_view(request):
    """
    API v1 index endpoint for https://cafekhoj-api.onrender.com/api/v1/
    (eliminates GET /api/v1 404).
    """
    from django.http import JsonResponse
    return JsonResponse({
        'service': 'cafekhoj-api',
        'version': 'v1',
        'status': 'active',
        'endpoints': {
            'health': '/healthz/',
            'auth_register': '/api/v1/auth/register/',
            'auth_verify_otp': '/api/v1/auth/verify-otp/',
            'auth_resend_otp': '/api/v1/auth/resend-otp/',
            'auth_login': '/api/v1/auth/login/',
            'auth_me': '/api/v1/auth/me/',
            'cafes': '/api/v1/cafes/',
            'locations': '/api/v1/locations/',
            'categories': '/api/v1/categories/',
            'facilities': '/api/v1/facilities/',
            'search': '/api/v1/search/',
            'business_dashboard': '/api/v1/business/dashboard/',
            'admin_dashboard': '/api/v1/admin-api/dashboard/'
        }
    }, status=200)


def health_check(request):
    """
    Lightweight health-check endpoint for Render / load balancers.
    Requires no authentication and actively verifies database connectivity.
    """
    from django.http import JsonResponse
    from django.db import connection

    try:
        connection.ensure_connection()
        db_status = 'connected'
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'database': f'error: {str(e)}',
            'service': 'cafekhoj-api'
        }, status=503)

    return JsonResponse({
        'status': 'healthy',
        'database': db_status,
        'service': 'cafekhoj-api'
    }, status=200)


# -------------------------------------------------------------
# Authentication & Verification Views
# -------------------------------------------------------------

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'user': UserSerializer(user).data,
            'requires_verification': True,
            'email': user.email,
            'message': 'Account registered successfully. A 6-digit verification code has been sent to your email.'
        }, status=status.HTTP_201_CREATED)


class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        code = serializer.validated_data['code'].strip()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({'message': 'Email is already verified. You may proceed to login.', 'verified': True})

        is_valid, msg = EmailOTP.verify_otp(email, code)
        if not is_valid:
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=['is_email_verified', 'is_active'])

        AuditLog.objects.create(
            actor_user=user,
            action='email_verified',
            entity_type='User',
            entity_id=str(user.id),
            details={'email': user.email, 'method': 'otp'}
        )

        return Response({
            'message': 'Email verified successfully. You may now log in to CafeKhoj.',
            'verified': True
        }, status=status.HTTP_200_OK)


class ResendOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({'message': 'Email is already verified. You may log in.', 'verified': True})

        # Cooldown check: 60 seconds
        recent_otp = EmailOTP.objects.filter(
            email__iexact=email,
            created_at__gte=timezone.now() - timedelta(seconds=60)
        ).first()

        if recent_otp:
            return Response({
                'error': 'Please wait 60 seconds between verification code requests.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate new OTP & dispatch email
        plain_code = EmailOTP.generate_otp(email=user.email, user=user)
        send_otp_verification_email(
            recipient_email=user.email,
            otp_code=plain_code,
            recipient_name=user.first_name or user.username
        )

        return Response({
            'message': 'A new 6-digit verification code has been sent to your email.'
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_request'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        # Same response for unknown addresses and cooldowns prevents account enumeration.
        if user:
            recent = PasswordResetChallenge.objects.filter(
                user=user, created_at__gte=timezone.now() - timedelta(seconds=60)
            ).exists()
            if not recent:
                challenge, code = PasswordResetChallenge.issue(user)
                sent = send_password_reset_email(user.email, code, user.first_name or user.username)
                if not sent:
                    challenge.is_used = True
                    challenge.save(update_fields=['is_used'])
                    # Do not reveal whether the address belongs to an account.
                    logger.error('Password reset email delivery failed.')

        return Response({
            'message': 'If an active account uses that address, reset instructions will be sent. If no email arrives, contact support.'
        }, status=status.HTTP_202_ACCEPTED)


class PasswordResetConfirmView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_confirm'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        with transaction.atomic():
            challenge = PasswordResetChallenge.objects.select_for_update().filter(
                user=user, is_used=False
            ).order_by('-created_at').first()
            if not challenge or not challenge.check_code(serializer.validated_data['code']):
                return Response({'error': 'Invalid or expired reset code.'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['password'])
            user.password_changed_at = timezone.now()
            user.save(update_fields=['password', 'password_changed_at'])
            PasswordResetChallenge.objects.filter(user=user, is_used=False).update(is_used=True)
            DeviceSession.objects.filter(user=user, is_active=True).update(is_active=False)
            AuditLog.objects.create(
                actor_user=user,
                action='password_reset',
                entity_type='User',
                entity_id=str(user.id),
                details={'method': 'email_otp'},
            )

        return Response({'message': 'Password reset successfully. Please sign in with your new password.'})


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'error': 'Username/email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try authenticating with username or email
        user = authenticate(username=username, password=password)
        if not user:
            user_obj = User.objects.filter(email__iexact=username).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)

        if not user:
            return Response(
                {'error': 'Invalid credentials. Please check your username/email and password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if user.is_suspended:
            return Response(
                {'error': 'This account has been suspended by a platform administrator. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {'error': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Enforce email verification for non-platform admins
        if not user.is_email_verified and not user.is_platform_admin():
            return Response({
                'error': 'Your email address is not yet verified. Please verify your email with the 6-digit code sent upon registration.',
                'requires_verification': True,
                'email': user.email
            }, status=status.HTTP_403_FORBIDDEN)

        # -------------------------------------------------------------
        # Operator Device Authorization Policy (1 active authorized device)
        # -------------------------------------------------------------
        device_id = get_device_identifier(request)
        device_name = get_device_name(request)
        ip_addr = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        if user.is_business_owner():
            active_sessions = DeviceSession.objects.filter(user=user, is_active=True)
            has_matching_session = active_sessions.filter(device_id=device_id).exists()

            if active_sessions.exists() and not has_matching_session:
                # Operator has an active device elsewhere: block login and submit request for platform admin review
                auth_req, _ = DeviceAuthorizationRequest.objects.get_or_create(
                    user=user,
                    device_id=device_id,
                    status='pending',
                    defaults={
                        'device_name': device_name,
                        'ip_address': ip_addr,
                        'user_agent': user_agent
                    }
                )

                AdminNotification.objects.get_or_create(
                    notification_type='device_auth_pending',
                    link='/admin/devices',
                    defaults={
                        'title': f"Device Authorization Required: {user.email}",
                        'message': f"Operator {user.email} attempted login from unauthorized device '{device_name}' (IP: {ip_addr}). Maximum 1 device permitted.",
                        'severity': 'warning'
                    }
                )

                return Response({
                    'status': 'device_authorization_required',
                    'error': 'New device detected. Operator accounts are restricted to 1 active authorized device. An authorization request has been submitted to platform administrators for review.',
                    'device_id': device_id,
                    'device_name': device_name,
                    'request_id': auth_req.id
                }, status=status.HTTP_403_FORBIDDEN)

            # Register or update active device session
            DeviceSession.objects.update_or_create(
                user=user,
                device_id=device_id,
                defaults={
                    'device_name': device_name,
                    'ip_address': ip_addr,
                    'user_agent': user_agent,
                    'is_active': True,
                    'last_active_at': timezone.now()
                }
            )

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        if user.password_changed_at:
            refresh['password_version'] = int(user.password_changed_at.timestamp())
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Login successful.'
        })


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# -------------------------------------------------------------
# Operator Device Management
# -------------------------------------------------------------

class OperatorDeviceListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        devices = DeviceSession.objects.filter(user=request.user).order_by('-last_active_at')
        current_device_id = get_device_identifier(request)
        data = DeviceSessionSerializer(devices, many=True).data
        for d in data:
            d['is_current_device'] = (d['device_id'] == current_device_id)
        return Response(data)


class OperatorDeauthorizeDeviceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        device = get_object_or_404(DeviceSession, pk=pk, user=request.user)
        device.is_active = False
        device.save(update_fields=['is_active'])
        return Response({'message': f"Device '{device.device_name}' deauthorized successfully."})


# -------------------------------------------------------------
# Platform Admin Device Authorization & Notifications
# -------------------------------------------------------------

class AdminDeviceRequestsListView(generics.ListAPIView):
    serializer_class = DeviceAuthorizationRequestSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = DeviceAuthorizationRequest.objects.all().select_related('user', 'reviewed_by')
        req_status = self.request.query_params.get('status')
        if req_status:
            qs = qs.filter(status=req_status)
        return qs.order_by('-created_at')


class AdminDeviceRequestReviewView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        auth_req = get_object_or_404(DeviceAuthorizationRequest, pk=pk)
        decision = request.data.get('decision') # 'approve' or 'reject'
        admin_notes = request.data.get('admin_notes', '')

        if decision not in ('approve', 'reject'):
            return Response({'error': 'Decision must be approve or reject.'}, status=status.HTTP_400_BAD_REQUEST)

        auth_req.status = 'approved' if decision == 'approve' else 'rejected'
        auth_req.reviewed_by = request.user
        auth_req.reviewed_at = timezone.now()
        auth_req.admin_notes = admin_notes
        auth_req.save()

        if decision == 'approve':
            # Deactivate prior sessions for this operator (strictly enforcing 1 active device)
            DeviceSession.objects.filter(user=auth_req.user).update(is_active=False)

            # Activate the new device session
            DeviceSession.objects.update_or_create(
                user=auth_req.user,
                device_id=auth_req.device_id,
                defaults={
                    'device_name': auth_req.device_name,
                    'ip_address': auth_req.ip_address,
                    'user_agent': auth_req.user_agent,
                    'is_active': True,
                    'last_active_at': timezone.now()
                }
            )

        return Response({
            'message': f"Device authorization request {decision}d successfully.",
            'request': DeviceAuthorizationRequestSerializer(auth_req).data
        })


class AdminNotificationListView(generics.ListAPIView):
    serializer_class = AdminNotificationSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = AdminNotification.objects.all()
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in ('true', '1'))
        return qs.order_by('-created_at')


class AdminNotificationMarkReadView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        notif = get_object_or_404(AdminNotification, pk=pk)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'message': 'Notification marked as read.'})


class AdminNotificationMarkAllReadView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        AdminNotification.objects.filter(is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'})


# -------------------------------------------------------------
# Platform Administrator Accounts & 2-Admin Limit
# -------------------------------------------------------------

class AdminPlatformUsersListView(generics.ListAPIView):
    serializer_class = PlatformAdministratorSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return PlatformAdministrator.objects.all().select_related('user', 'designated_by').order_by('created_at')


class AdminPlatformDelegateView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        # Only primary platform admin can designate a second administrator
        is_primary = PlatformAdministrator.objects.filter(user=request.user, is_primary=True).exists()
        if not is_primary and not request.user.is_superuser:
            return Response({
                'error': 'Only the primary project owner platform administrator can designate additional administrators.'
            }, status=status.HTTP_403_FORBIDDEN)

        current_count = PlatformAdministrator.objects.count()
        if current_count >= 2:
            return Response({
                'error': 'Maximum limit of 2 platform administrators has already been reached. Revoke an existing administrator before adding another.'
            }, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email', '').strip().lower()
        full_name = request.data.get('full_name', '').strip()
        notes = request.data.get('notes', '')

        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check or create user
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.create_user(
                username=email.split('@')[0],
                email=email,
                first_name=full_name.split(' ')[0] if full_name else 'Platform',
                last_name=' '.join(full_name.split(' ')[1:]) if len(full_name.split(' ')) > 1 else 'Admin',
                role='admin',
                is_staff=True,
                is_superuser=True,
                is_email_verified=True
            )
        else:
            user.role = 'admin'
            user.is_staff = True
            user.is_superuser = True
            user.is_email_verified = True
            user.save()

        # Create PlatformAdministrator record
        admin_rec = PlatformAdministrator.objects.create(
            user=user,
            is_primary=False,
            designated_by=request.user,
            notes=notes
        )

        AuditLog.objects.create(
            actor_user=request.user,
            action='administrator_delegated',
            entity_type='PlatformAdministrator',
            entity_id=str(admin_rec.id),
            details={'delegated_user': user.email, 'assigned_by': request.user.email}
        )

        return Response({
            'message': f"User {user.email} successfully designated as the 2nd platform administrator.",
            'administrator': PlatformAdministratorSerializer(admin_rec).data
        }, status=status.HTTP_201_CREATED)


# -------------------------------------------------------------
# Locations, Analytics, and Audit Logs
# -------------------------------------------------------------

class LocationListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LocationSerializer
    pagination_class = None

    def get_queryset(self):
        return Location.objects.filter(is_active=True).annotate(
            cafe_count=Count('cafes', filter=Q(cafes__publication_status='published'))
        ).order_by('city', 'neighbourhood')


class AnalyticsTrackView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AnalyticsEventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'tracked'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuditLogListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.all().order_by('-created_at')
