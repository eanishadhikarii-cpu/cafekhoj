from rest_framework import serializers
from .models import Review, ReviewPhoto, ReviewResponse, ReviewReport, Favourite
from core.serializers import UserSerializer


class ReviewResponseSerializer(serializers.ModelSerializer):
    business_username = serializers.CharField(source='business_user.username', read_only=True)

    class Meta:
        model = ReviewResponse
        fields = ['id', 'business_user', 'business_username', 'response_text', 'created_at']
        read_only_fields = ['id', 'business_user', 'created_at']


class ReviewPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewPhoto
        fields = ['id', 'image_url', 'moderation_status', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    business_response = ReviewResponseSerializer(read_only=True)
    photos = ReviewPhotoSerializer(many=True, read_only=True)
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)
    cafe_slug = serializers.CharField(source='cafe.slug', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'cafe', 'cafe_name', 'cafe_slug', 'user', 'rating', 'review_text',
            'visit_date', 'moderation_status', 'helpful_count',
            'business_response', 'photos', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'cafe', 'user', 'moderation_status', 'helpful_count', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be an integer between 1 and 5.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        view = self.context.get('view')
        cafe_id = view.kwargs.get('cafe_id') if view else None
        if request and request.method == 'POST' and cafe_id and request.user.is_authenticated:
            if Review.objects.filter(cafe_id=cafe_id, user=request.user).exists():
                raise serializers.ValidationError("You have already reviewed this cafe. You can edit your existing review.")
        return attrs


class ReviewReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewReport
        fields = ['id', 'review', 'reason', 'details', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


class FavouriteSerializer(serializers.ModelSerializer):
    cafe = serializers.SerializerMethodField()

    class Meta:
        model = Favourite
        fields = ['id', 'cafe', 'created_at']

    def get_cafe(self, obj):
        from cafes.serializers import CafeListSerializer
        return CafeListSerializer(obj.cafe).data
