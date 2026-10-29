from django.db import models
from django.utils.text import slugify
from core.models import Location, User


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon_name = models.CharField(max_length=50, default='Coffee')
    image_url = models.URLField(max_length=500, blank=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Facility(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon_name = models.CharField(max_length=50, default='CheckCircle2')

    class Meta:
        verbose_name_plural = 'Facilities'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Cafe(models.Model):
    PRICE_CHOICES = (
        ('budget', 'Budget (Under NPR 250)'),
        ('moderate', 'Moderate (NPR 250 - 600)'),
        ('premium', 'Premium (NPR 600+)'),
    )

    VERIFICATION_STATUS_CHOICES = (
        ('unverified', 'Unverified'),
        ('pending_verification', 'Pending Verification'),
        ('verified', 'Verified'),
        ('verification_rejected', 'Verification Rejected'),
        ('temp_closed', 'Temporarily Closed'),
        ('permanently_closed', 'Permanently Closed'),
        ('archived', 'Archived'),
    )

    PUBLICATION_STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
        ('archived', 'Archived'),
    )

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    address = models.CharField(max_length=255)
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name='cafes')
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(max_length=300, blank=True)
    social_instagram = models.CharField(max_length=100, blank=True)
    social_facebook = models.CharField(max_length=100, blank=True)
    
    price_range = models.CharField(max_length=20, choices=PRICE_CHOICES, default='moderate')
    verification_status = models.CharField(
        max_length=30, choices=VERIFICATION_STATUS_CHOICES, default='unverified'
    )
    publication_status = models.CharField(
        max_length=20, choices=PUBLICATION_STATUS_CHOICES, default='published'
    )
    
    categories = models.ManyToManyField(Category, blank=True, related_name='cafes')
    facilities = models.ManyToManyField(Facility, through='CafeFacility', blank=True, related_name='cafes')
    
    cover_image_url = models.URLField(max_length=500, blank=True)
    
    # Official Google Places & Maps integration (Operators/Admins cannot forge official Google data)
    google_place_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    google_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    google_user_ratings_total = models.PositiveIntegerField(null=True, blank=True)
    google_maps_url = models.URLField(max_length=500, blank=True)
    google_sync_status = models.CharField(max_length=30, default='not_synced')
    google_last_synced_at = models.DateTimeField(null=True, blank=True)

    # Moderation & Onboarding
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    submitted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_cafes'
    )

    # Cached aggregates (recalculated securely from published reviews)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.PositiveIntegerField(default=0)
    
    # Sample data flag to transparently label demo vs live entries
    is_sample_data = models.BooleanField(
        default=False,
        help_text="Designates this cafe as demo sample data rather than live merchant data."
    )
    
    # Import tracking & attribution
    source = models.CharField(max_length=100, default='CafeKhoj Curated Directory', blank=True)
    source_record_id = models.CharField(max_length=100, blank=True)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-average_rating', '-review_count', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['publication_status', 'verification_status']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Cafe.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.location.city})"


class CafeFacility(models.Model):
    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE)
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE)
    verification_status = models.CharField(
        max_length=20,
        choices=(('unverified', 'Unverified'), ('verified', 'Verified')),
        default='verified'
    )

    class Meta:
        unique_together = ('cafe', 'facility')

    def __str__(self):
        return f"{self.cafe.name} - {self.facility.name}"


class CafePhoto(models.Model):
    MODERATION_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='photos')
    image_url = models.URLField(max_length=500)
    caption = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_cafe_photos'
    )
    attribution = models.CharField(max_length=150, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    moderation_status = models.CharField(max_length=20, choices=MODERATION_CHOICES, default='approved')
    is_cover = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return f"Photo for {self.cafe.name} ({self.caption or 'Untitled'})"


class CafeChangeRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='change_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cafe_change_requests')
    proposed_changes = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_cafe_changes'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Change Request for {self.cafe.name} ({self.get_status_display()})"


class OpeningHour(models.Model):
    DAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='opening_hours')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    opens_at = models.TimeField(null=True, blank=True)
    closes_at = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)
    special_note = models.CharField(max_length=100, blank=True)

    class Meta:
        unique_together = ('cafe', 'day_of_week')
        ordering = ['day_of_week']

    def __str__(self):
        day_name = dict(self.DAY_CHOICES).get(self.day_of_week)
        if self.is_closed:
            return f"{self.cafe.name} - {day_name}: Closed"
        return f"{self.cafe.name} - {day_name}: {self.opens_at} - {self.closes_at}"


class MenuCategory(models.Model):
    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='menu_categories')
    name = models.CharField(max_length=100)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Menu Categories'
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.cafe.name} - {self.name}"


class MenuItem(models.Model):
    AVAILABILITY_CHOICES = (
        ('available', 'Available'),
        ('out_of_stock', 'Out of Stock'),
        ('seasonal', 'Seasonal'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='menu_items')
    menu_category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=10, default='NPR')
    image_url = models.URLField(max_length=500, blank=True)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='available')
    dietary_labels = models.CharField(
        max_length=150, blank=True, help_text="e.g. Vegetarian, Vegan, Gluten-Free"
    )
    is_signature = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_signature', 'name']

    def __str__(self):
        return f"{self.name} (NPR {self.price}) - {self.cafe.name}"
