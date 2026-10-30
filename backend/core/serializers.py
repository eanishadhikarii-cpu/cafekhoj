from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from .models import (
    User, Location, AuditLog, AnalyticsEvent, EmailOTP, PasswordResetChallenge,
    DeviceSession, DeviceAuthorizationRequest, PlatformAdministrator, AdminNotification
)
from .email import send_otp_verification_email


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'operator_relationship', 'phone', 'avatar_url',
            'bio', 'is_email_verified', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'is_email_verified', 'created_at']


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6, trim_whitespace=True)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        user = User.objects.filter(email__iexact=attrs['email']).first()
        if not user:
            raise serializers.ValidationError({'code': 'Invalid or expired reset code.'})
        try:
            validate_password(attrs['password'], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8, required=False)
    terms_accepted = serializers.BooleanField(write_only=True, default=True)
    operator_relationship = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'phone', 'role',
            'operator_relationship', 'terms_accepted'
        ]

    def validate(self, attrs):
        password = attrs.get('password')
        confirm = attrs.get('confirm_password')
        if confirm and password != confirm:
            raise serializers.ValidationError({'confirm_password': "Passwords do not match."})

        # Validate password using Django's configured password validators
        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})

        # Require terms acceptance
        if not attrs.get('terms_accepted'):
            raise serializers.ValidationError({'terms_accepted': "You must accept the Terms of Service and Privacy Notice."})

        role = attrs.get('role', 'customer')
        if role == 'admin':
            raise serializers.ValidationError({'role': "Administrator accounts cannot be self-registered."})

        if role in ('operator', 'business'):
            attrs['role'] = 'operator'
            op_rel = str(attrs.get('operator_relationship') or '').strip().lower()
            if op_rel in ('owner', 'manager', 'staff'):
                attrs['operator_relationship'] = op_rel
            else:
                attrs['operator_relationship'] = 'owner'
        else:
            attrs['operator_relationship'] = None

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        validated_data.pop('terms_accepted', None)
        password = validated_data.pop('password')

        user = User.objects.create(
            username=validated_data['username'].strip(),
            email=validated_data.get('email', '').lower().strip(),
            first_name=validated_data.get('first_name', '').strip(),
            last_name=validated_data.get('last_name', '').strip(),
            phone=validated_data.get('phone', '').strip(),
            role=validated_data.get('role', 'customer'),
            operator_relationship=validated_data.get('operator_relationship'),
            terms_accepted_at=timezone.now(),
            is_email_verified=False  # Requires OTP verification
        )
        user.set_password(password)
        user.save()

        # Generate 6-digit OTP challenge and dispatch branded verification email
        otp_code = EmailOTP.generate_otp(email=user.email, user=user)
        send_otp_verification_email(
            recipient_email=user.email,
            otp_code=otp_code,
            recipient_name=user.first_name or user.username
        )

        AuditLog.objects.create(
            actor_user=user,
            action='account_registered',
            entity_type='User',
            entity_id=str(user.id),
            details={'role': user.role, 'email': user.email}
        )

        AdminNotification.objects.create(
            title=f"New {user.get_role_display()} Registration",
            message=f"Account '{user.username}' ({user.email}) has registered. Awaiting OTP email verification.",
            severity="info",
            notification_type="operator_registered",
            link="/admin/users"
        )

        return user


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6, required=False)
    otp_code = serializers.CharField(max_length=6, min_length=6, required=False)

    def validate(self, attrs):
        code = attrs.get('code') or attrs.get('otp_code')
        if not code:
            raise serializers.ValidationError({'code': 'Verification code is required.'})
        attrs['code'] = code
        return attrs


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class DeviceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceSession
        fields = ['id', 'device_id', 'device_name', 'ip_address', 'is_active', 'authorized_at', 'last_active_at']


class DeviceAuthorizationRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)

    class Meta:
        model = DeviceAuthorizationRequest
        fields = [
            'id', 'username', 'user_email', 'device_id', 'device_name',
            'ip_address', 'user_agent', 'status', 'reviewed_by_username',
            'reviewed_at', 'admin_notes', 'created_at'
        ]


class PlatformAdministratorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = PlatformAdministrator
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_primary', 'notes', 'created_at']


class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = ['id', 'title', 'message', 'severity', 'notification_type', 'link', 'is_read', 'created_at']


class LocationSerializer(serializers.ModelSerializer):
    cafe_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Location
        fields = ['id', 'country', 'province', 'district', 'city', 'neighbourhood', 'latitude', 'longitude', 'is_active', 'cafe_count']


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor_user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'actor_username', 'action', 'entity_type', 'entity_id', 'details', 'created_at']


class AnalyticsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsEvent
        fields = ['id', 'cafe', 'event_type', 'anonymous_session_id', 'metadata', 'created_at']
