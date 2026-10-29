import hashlib
import secrets
import string
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('operator', 'Cafe Operator'),
        ('business', 'Cafe Operator'),  # Backward compatibility alias for operator
        ('admin', 'Platform Administrator'),
    )

    OPERATOR_RELATIONSHIP_CHOICES = (
        ('owner', 'Owner / Founder'),
        ('manager', 'General Manager'),
        ('staff', 'Staff Member'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    operator_relationship = models.CharField(
        max_length=20, choices=OPERATOR_RELATIONSHIP_CHOICES, blank=True, null=True
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    is_suspended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_business_owner(self):
        return self.role in ('business', 'operator') or self.is_staff or self.is_superuser

    def is_cafe_operator(self):
        return self.role in ('business', 'operator')

    def is_platform_admin(self):
        if self.is_superuser:
            return True
        if self.role == 'admin':
            # Check designated platform administrator registry
            return hasattr(self, 'platform_admin_profile') or self.is_staff
        return False

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class EmailOTP(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name='otp_challenges'
    )
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=128)
    salt = models.CharField(max_length=32)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_used', 'expires_at']),
        ]

    @classmethod
    def generate_otp(cls, email: str, user=None) -> str:
        """
        Invalidates active OTPs for the email, generates a cryptographically random 6-digit OTP,
        stores its salted SHA-256 hash with a 5-minute expiry, and returns the plaintext code.
        """
        now = timezone.now()
        # Invalidate existing unused active OTPs for this email
        cls.objects.filter(email__iexact=email, is_used=False).update(is_used=True)

        plain_code = ''.join(secrets.choice(string.digits) for _ in range(6))
        salt = secrets.token_hex(16)
        hasher = hashlib.sha256()
        hasher.update((salt + plain_code).encode('utf-8'))
        otp_hash = hasher.hexdigest()

        cls.objects.create(
            user=user,
            email=email.lower().strip(),
            otp_hash=otp_hash,
            salt=salt,
            expires_at=now + timedelta(minutes=5),
            is_used=False
        )

        return plain_code

    @classmethod
    def verify_otp(cls, email: str, plain_code: str) -> tuple[bool, str]:
        """
        Verifies the given plain OTP against the latest active challenge.
        Enforces 5-minute expiry and a maximum of 5 attempts.
        """
        now = timezone.now()
        challenge = cls.objects.filter(
            email__iexact=email.lower().strip(),
            is_used=False
        ).order_by('-created_at').first()

        if not challenge:
            return False, "No active verification challenge found. Please request a new code."

        if challenge.expires_at < now:
            challenge.is_used = True
            challenge.save(update_fields=['is_used'])
            return False, "The verification code has expired. Please request a new code."

        if challenge.attempts >= challenge.max_attempts:
            challenge.is_used = True
            challenge.save(update_fields=['is_used'])
            return False, "Maximum verification attempts exceeded. Please request a new code."

        challenge.attempts += 1

        hasher = hashlib.sha256()
        hasher.update((challenge.salt + plain_code.strip()).encode('utf-8'))
        computed_hash = hasher.hexdigest()

        if secrets.compare_digest(computed_hash, challenge.otp_hash):
            challenge.is_used = True
            challenge.save(update_fields=['is_used', 'attempts'])
            return True, "Email successfully verified."
        else:
            challenge.save(update_fields=['attempts'])
            remaining = challenge.max_attempts - challenge.attempts
            return False, f"Incorrect verification code. {remaining} attempt(s) remaining."


class DeviceSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_sessions')
    device_id = models.CharField(max_length=128, db_index=True)
    device_name = models.CharField(max_length=200, default='Web Browser')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    authorized_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_active_at']
        indexes = [
            models.Index(fields=['user', 'device_id', 'is_active']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.device_name} ({'Active' if self.is_active else 'Revoked'})"


class DeviceAuthorizationRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_requests')
    device_id = models.CharField(max_length=128, db_index=True)
    device_name = models.CharField(max_length=200, default='Web Browser')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_device_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Device Request for {self.user.username} ({self.get_status_display()})"


class PlatformAdministrator(models.Model):
    """
    Enforces the platform rule: Exactly 1 primary administrator initially,
    with a hard limit of a maximum of 2 designated platform administrator accounts.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='platform_admin_profile')
    is_primary = models.BooleanField(default=False)
    designated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='delegated_admins'
    )
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not self.pk:
            count = PlatformAdministrator.objects.count()
            if count >= 2:
                raise ValidationError("CafeKhoj policy strictly limits platform administrators to a maximum of 2 accounts.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Admin: {self.user.username} ({'Primary' if self.is_primary else 'Secondary'})"


class AdminNotification(models.Model):
    SEVERITY_CHOICES = (
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('high_priority', 'High Priority'),
        ('critical', 'Critical'),
    )

    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    notification_type = models.CharField(max_length=50)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_read', 'severity', 'created_at']),
        ]

    @classmethod
    def notify(cls, title: str, message: str, severity: str = 'info', notification_type: str = 'system', link: str = '') -> 'AdminNotification':
        return cls.objects.create(
            title=title,
            message=message,
            severity=severity,
            notification_type=notification_type,
            link=link
        )

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title}"


class Location(models.Model):
    country = models.CharField(max_length=100, default='Nepal')
    province = models.CharField(max_length=100, default='Koshi Province')
    district = models.CharField(max_length=100, default='Jhapa')
    city = models.CharField(max_length=100)
    neighbourhood = models.CharField(max_length=150, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['city', 'neighbourhood']
        unique_together = ('city', 'neighbourhood')

    def __str__(self):
        if self.neighbourhood:
            return f"{self.neighbourhood}, {self.city}, {self.district}"
        return f"{self.city}, {self.district}"


class AuditLog(models.Model):
    actor_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions'
    )
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        actor = self.actor_user.username if self.actor_user else 'System'
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {actor} - {self.action} on {self.entity_type}:{self.entity_id}"


class AnalyticsEvent(models.Model):
    EVENT_TYPES = (
        ('listing_view', 'Listing View'),
        ('search_appearance', 'Search Appearance'),
        ('direction_click', 'Direction Click'),
        ('website_click', 'Website Click'),
        ('contact_click', 'Contact Click'),
        ('favourite_add', 'Favourite Add'),
    )

    cafe = models.ForeignKey(
        'cafes.Cafe', on_delete=models.CASCADE, null=True, blank=True, related_name='analytics_events'
    )
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    anonymous_session_id = models.CharField(max_length=120, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cafe', 'event_type', 'created_at']),
        ]

    def __str__(self):
        cafe_str = self.cafe.name if self.cafe else 'General'
        return f"{self.event_type} - {cafe_str} ({self.created_at.strftime('%Y-%m-%d')})"
