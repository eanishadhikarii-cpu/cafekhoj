import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from core.models import User, PlatformAdministrator, AdminNotification, AuditLog


class Command(BaseCommand):
    help = (
        "Securely establishes the single initial primary platform administrator for CafeKhoj "
        "using environment variables or command-line parameters. "
        "Enforces the maximum 2-administrator platform policy."
    )

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Administrator username')
        parser.add_argument('--email', type=str, help='Administrator email address')
        parser.add_argument('--password', type=str, help='Administrator password')

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("CafeKhoj Platform Administrator Bootstrap Procedure"))

        username = (options.get('username') or os.getenv('ADMIN_BOOTSTRAP_USERNAME', '')).strip()
        email = (options.get('email') or os.getenv('ADMIN_BOOTSTRAP_EMAIL', '')).strip()
        password = (options.get('password') or os.getenv('ADMIN_BOOTSTRAP_PASSWORD', '')).strip()

        if not username or not email or not password:
            raise CommandError(
                "Missing administrator bootstrap credentials. "
                "Please configure ADMIN_BOOTSTRAP_USERNAME, ADMIN_BOOTSTRAP_EMAIL, and ADMIN_BOOTSTRAP_PASSWORD "
                "in your deployment environment or pass them via --username, --email, and --password."
            )

        # Enforce hard limit of 2 platform administrators
        existing_admins = PlatformAdministrator.objects.count()
        if existing_admins >= 2:
            raise CommandError(
                f"Platform administrator policy limit reached ({existing_admins}/2). "
                "Cannot provision additional platform administrator accounts."
            )

        # Check if primary admin already exists
        primary_admin = PlatformAdministrator.objects.filter(is_primary=True).first()
        if primary_admin:
            self.stdout.write(self.style.WARNING(
                f"Primary platform administrator '{primary_admin.user.username}' is already established. "
                "Secondary administrators must be provisioned via the secure administrative portal."
            ))
            return

        # Validate password strength
        try:
            validate_password(password)
        except ValidationError as e:
            raise CommandError(f"Password validation failed: {'; '.join(e.messages)}")

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': 'admin',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_email_verified': True,
                }
            )

            user.email = email
            user.role = 'admin'
            user.is_staff = True
            user.is_superuser = True
            user.is_email_verified = True
            user.set_password(password)
            user.save()

            admin_profile, prof_created = PlatformAdministrator.objects.get_or_create(
                user=user,
                defaults={
                    'is_primary': True,
                    'notes': 'Initial project owner platform administrator'
                }
            )

            AuditLog.objects.create(
                actor_user=user,
                action='platform_admin_bootstrap',
                entity_type='PlatformAdministrator',
                entity_id=str(admin_profile.id),
                details={'username': username, 'is_primary': True}
            )

            AdminNotification.objects.create(
                title="Primary Administrator Initialized",
                message=f"Primary platform administrator '{username}' ({email}) has been established.",
                severity="info",
                notification_type="admin_provisioned",
                link="/admin"
            )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully provisioned primary platform administrator '{username}' ({email})! "
            "Total platform administrators: 1/2."
        ))

