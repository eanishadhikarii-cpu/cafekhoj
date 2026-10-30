from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class PasswordAwareTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        try:
            token = RefreshToken(attrs['refresh'])
            user_id = token.get(api_settings.USER_ID_CLAIM)
            user = User.objects.filter(**{api_settings.USER_ID_FIELD: user_id}).first()
            changed_at = user.password_changed_at if user else None
            token_password_version = token.get('password_version')
            if changed_at and token_password_version != int(changed_at.timestamp()):
                raise serializers.ValidationError('This refresh token expired after a password reset.')
        except serializers.ValidationError:
            raise
        except Exception:
            # Keep SimpleJWT's standard validation response for malformed tokens.
            pass
        return super().validate(attrs)
