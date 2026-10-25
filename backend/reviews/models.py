from django.db import models, transaction
from django.db.models import Avg, Count
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import User
from cafes.models import Cafe


class Review(models.Model):
    MODERATION_CHOICES = (
        ('pending', 'Pending'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
        ('flagged', 'Flagged for Review'),
    )

    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    review_text = models.TextField()
    visit_date = models.DateField(null=True, blank=True)
    moderation_status = models.CharField(max_length=20, choices=MODERATION_CHOICES, default='published')
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('cafe', 'user')
        indexes = [
            models.Index(fields=['cafe', 'moderation_status']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} ({self.rating}★) on {self.cafe.name}"

    @classmethod
    def recalculate_cafe_stats(cls, cafe_id):
        """Safely recalculates average rating and review count using only published reviews."""
        with transaction.atomic():
            stats = cls.objects.filter(
                cafe_id=cafe_id,
                moderation_status='published'
            ).aggregate(
                avg_rating=Avg('rating'),
                count=Count('id')
            )
            
            avg = stats['avg_rating'] or 0.00
            count = stats['count'] or 0
            
            Cafe.objects.filter(id=cafe_id).update(
                average_rating=round(avg, 2),
                review_count=count
            )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.recalculate_cafe_stats(self.cafe_id)

    def delete(self, *args, **kwargs):
        cafe_id = self.cafe_id
        super().delete(*args, **kwargs)
        self.recalculate_cafe_stats(cafe_id)


class ReviewPhoto(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='photos')
    image_url = models.URLField(max_length=500)
    moderation_status = models.CharField(
        max_length=20,
        choices=(('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')),
        default='approved'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for review #{self.review_id}"


class ReviewResponse(models.Model):
    review = models.OneToOneField(Review, on_delete=models.CASCADE, related_name='business_response')
    business_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cafe_review_responses')
    response_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Response to review #{self.review_id} by {self.business_user.username}"


class ReviewReport(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('action_taken', 'Action Taken'),
    )

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_review_reports')
    reason = models.CharField(max_length=100)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report on review #{self.review_id} for '{self.reason}'"


class Favourite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favourites')
    cafe = models.ForeignKey(Cafe, on_delete=models.CASCADE, related_name='favourited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'cafe')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} saved {self.cafe.name}"
