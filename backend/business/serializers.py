from rest_framework import serializers
from .models import BusinessClaim, BusinessMembership, SubscriptionPlan, Subscription, Promotion
from cafes.serializers import CafeListSerializer


class BusinessClaimSerializer(serializers.ModelSerializer):
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)
    claimant_username = serializers.CharField(source='claimant.username', read_only=True)

    class Meta:
        model = BusinessClaim
        fields = [
            'id', 'cafe', 'cafe_name', 'claimant', 'claimant_username', 'business_role',
            'contact_phone', 'contact_email', 'evidence_reference', 'status',
            'reviewed_by', 'reviewed_at', 'admin_notes', 'rejection_reason', 'created_at'
        ]
        read_only_fields = ['id', 'claimant', 'status', 'reviewed_by', 'reviewed_at', 'admin_notes', 'rejection_reason', 'created_at']


class BusinessMembershipSerializer(serializers.ModelSerializer):
    cafe = CafeListSerializer(read_only=True)

    class Meta:
        model = BusinessMembership
        fields = ['id', 'cafe', 'role', 'created_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'code', 'price', 'currency', 'billing_period', 'features', 'is_active', 'display_order']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.all(), source='plan', write_only=True
    )
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'cafe', 'cafe_name', 'plan', 'plan_id', 'status',
            'started_at', 'ends_at', 'payment_reference', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'started_at', 'ends_at', 'is_active', 'created_at']


class PromotionSerializer(serializers.ModelSerializer):
    cafe_name = serializers.CharField(source='cafe.name', read_only=True)

    class Meta:
        model = Promotion
        fields = [
            'id', 'cafe', 'cafe_name', 'title', 'description', 'start_at', 'end_at',
            'status', 'is_sponsored', 'banner_url', 'discount_percentage', 'terms',
            'click_count', 'created_at'
        ]
        read_only_fields = ['id', 'click_count', 'created_at']

