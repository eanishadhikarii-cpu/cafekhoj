from django.db import models
from core.models import User
from cafes.models import Cafe


class BusinessClaim(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Administrator Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='claims')
    claimant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='business_claims')
    business_role = models.CharField(max_length=50, default='Owner / Founder')
    contact_phone = models.CharField(max_length=30)
    contact_email = models.EmailField()
    evidence_reference = models.TextField(
        help_text="PAN/VAT registration number, municipality permit reference, or authorization details."
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_claims'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Claim for {self.cafe.name} by {self.claimant.username} ({self.get_status_display()})"


class BusinessMembership(models.Model):
    ROLE_CHOICES = (
        ('owner', 'Owner / Founder'),
        ('manager', 'Cafe Manager'),
        ('staff', 'Staff Member'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='business_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cafe', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()} at {self.cafe.name}"


class SubscriptionPlan(models.Model):
    PERIOD_CHOICES = (
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default='NPR')
    billing_period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='monthly')
    features = models.JSONField(default=list, help_text="List of feature bullet points")
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'price']

    def __str__(self):
        return f"{self.name} - NPR {self.price}/{self.billing_period}"


class Subscription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('pending_payment', 'Payment Inquiry Pending'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    started_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    payment_reference = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.cafe.name} - {self.plan.name} ({self.get_status_display()})"


class Promotion(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('active', 'Active Campaign'),
        ('expired', 'Expired'),
        ('rejected', 'Rejected'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='promotions')
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_sponsored = models.BooleanField(
        default=False,
        help_text="If true, displays with explicit 'Sponsored Placement' badge per advertising standards."
    )
    banner_url = models.URLField(max_length=500, blank=True)
    discount_percentage = models.PositiveIntegerField(null=True, blank=True)
    terms = models.TextField(blank=True)
    click_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        sponsor_badge = " [SPONSORED]" if self.is_sponsored else ""
        return f"{self.title} - {self.cafe.name}{sponsor_badge} ({self.get_status_display()})"
