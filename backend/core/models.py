from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('business', 'Business Owner'),
        ('admin', 'Platform Administrator'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_business_owner(self):
        return self.role == 'business' or self.is_staff or self.is_superuser

    def is_platform_admin(self):
        return self.role == 'admin' or self.is_superuser or self.is_staff

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


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
