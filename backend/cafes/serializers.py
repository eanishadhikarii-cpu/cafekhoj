from rest_framework import serializers
from .models import Category, Facility, Cafe, CafeFacility, CafePhoto, OpeningHour, MenuCategory, MenuItem
from core.serializers import LocationSerializer


class CategorySerializer(serializers.ModelSerializer):
    cafe_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon_name', 'image_url', 'cafe_count']


class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ['id', 'name', 'slug', 'icon_name']


class OpeningHourSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = OpeningHour
        fields = ['id', 'day_of_week', 'day_name', 'opens_at', 'closes_at', 'is_closed', 'special_note']


class CafePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CafePhoto
        fields = ['id', 'image_url', 'caption', 'alt_text', 'attribution', 'display_order', 'is_cover', 'created_at']


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        extra_kwargs = {'menu_category': {'required': False}}
        fields = [
            'id', 'cafe', 'menu_category', 'name', 'description', 'price',
            'currency', 'image_url', 'availability_status', 'dietary_labels', 'is_signature'
        ]


class MenuCategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = MenuCategory
        fields = ['id', 'cafe', 'name', 'display_order', 'items']


class CafeListSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    facilities = FacilitySerializer(many=True, read_only=True)
    is_favourited = serializers.BooleanField(read_only=True, default=False)
    distance_km = serializers.FloatField(read_only=True, required=False)

    class Meta:
        model = Cafe
        fields = [
            'id', 'name', 'slug', 'tagline', 'description', 'address', 'location',
            'latitude', 'longitude', 'phone', 'price_range', 'cover_image_url',
            'average_rating', 'review_count', 'verification_status', 'publication_status',
            'categories', 'facilities', 'is_sample_data', 'is_favourited', 'distance_km',
            'created_at'
        ]


class CafeDetailSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    facilities = FacilitySerializer(many=True, read_only=True)
    photos = CafePhotoSerializer(many=True, read_only=True)
    opening_hours = OpeningHourSerializer(many=True, read_only=True)
    menu_categories = MenuCategorySerializer(many=True, read_only=True)
    is_favourited = serializers.BooleanField(read_only=True, default=False)
    claimed_by_current_user = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Cafe
        fields = [
            'id', 'name', 'slug', 'tagline', 'description', 'address', 'location',
            'latitude', 'longitude', 'phone', 'email', 'website',
            'social_instagram', 'social_facebook', 'price_range',
            'verification_status', 'publication_status', 'cover_image_url',
            'average_rating', 'review_count', 'is_sample_data', 'source',
            'last_verified_at', 'categories', 'facilities', 'photos',
            'opening_hours', 'menu_categories', 'is_favourited', 'claimed_by_current_user',
            'created_at', 'updated_at'
        ]


class CafeWriteSerializer(serializers.ModelSerializer):
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, source='categories', required=False
    )
    facility_ids = serializers.PrimaryKeyRelatedField(
        queryset=Facility.objects.all(), many=True, source='facilities', required=False
    )

    class Meta:
        model = Cafe
        fields = [
            'id', 'name', 'tagline', 'description', 'address', 'location',
            'latitude', 'longitude', 'phone', 'email', 'website',
            'social_instagram', 'social_facebook', 'price_range',
            'cover_image_url', 'category_ids', 'facility_ids',
            'verification_status', 'publication_status', 'is_sample_data'
        ]

