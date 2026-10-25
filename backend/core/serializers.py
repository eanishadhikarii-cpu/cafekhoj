from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Location, AuditLog, AnalyticsEvent


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'avatar_url', 'bio', 'is_email_verified', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'is_email_verified', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='customer')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', 'customer')
        # Standard safety: admin role cannot be self-registered
        if role == 'admin':
            role = 'customer'
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=role,
            is_email_verified=True # auto-verified for demo convenience
        )
        user.set_password(password)
        user.save()
        return user


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

