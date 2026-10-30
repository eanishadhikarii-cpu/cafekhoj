from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class PasswordVersionJWTAuthentication(JWTAuthentication):
    """Reject access tokens issued before the account's latest password reset."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        changed_at = user.password_changed_at
        token_password_version = validated_token.get('password_version')
        if changed_at and token_password_version != int(changed_at.timestamp()):
            raise AuthenticationFailed('This session ended after a password reset. Please sign in again.')
        return user
