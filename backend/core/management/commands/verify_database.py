import sys
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.utils import timezone


class Command(BaseCommand):
    help = (
        "Safely verifies database connectivity, engine version, schema tables, "
        "migration status, and record counts without exposing credentials."
    )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=" * 65))
        self.stdout.write(self.style.NOTICE("CafeKhoj Production Database Verification"))
        self.stdout.write(self.style.NOTICE("=" * 65))

        # 1. Connection check
        try:
            connection.ensure_connection()
            is_usable = connection.is_usable()
            if not is_usable:
                self.stderr.write(self.style.ERROR("ERROR: Database connection is not usable."))
                sys.exit(1)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"ERROR: Failed to connect to database: {exc}"))
            sys.exit(1)

        # 2. Safe host & provider classification
        settings_dict = connection.settings_dict
        engine = settings_dict.get('ENGINE', '')
        host = settings_dict.get('HOST', '') or 'localhost'
        port = settings_dict.get('PORT', '')
        db_name = settings_dict.get('NAME', '')
        vendor = connection.vendor

        provider = "Self-hosted / Unknown"
        if "supabase.co" in host or "supabase.com" in host:
            if port == 6543 or str(port) == '6543':
                provider = "Supabase PostgreSQL (Transaction Pooler - PgBouncer)"
            elif port == 5432 or str(port) == '5432':
                provider = "Supabase PostgreSQL (Session Pooler / Direct)"
            else:
                provider = "Supabase PostgreSQL"
        elif "render.com" in host:
            provider = "Render Managed PostgreSQL"
        elif vendor == "sqlite":
            provider = "SQLite (Local/Testing)"

        self.stdout.write(f"Provider:        {provider}")
        self.stdout.write(f"Database Engine: {engine} ({vendor})")
        self.stdout.write(f"Database Name:   {db_name}")
        self.stdout.write(f"Host Endpoint:   {host}:{port or 'default'}")

        # 3. Server version
        try:
            with connection.cursor() as cursor:
                if vendor == 'postgresql':
                    cursor.execute("SELECT version();")
                    raw_version = cursor.fetchone()[0]
                    self.stdout.write(f"Server Version:  {raw_version.split(',')[0]}")
                elif vendor == 'sqlite':
                    cursor.execute("SELECT sqlite_version();")
                    self.stdout.write(f"Server Version:  SQLite {cursor.fetchone()[0]}")
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"Server Version:  Unable to query ({exc})"))

        # 4. Table existence audit
        required_tables = [
            'django_migrations',
            'core_user',
            'core_location',
            'cafes_cafe',
            'cafes_category',
            'cafes_facility',
            'reviews_review',
            'business_subscriptionplan',
        ]

        existing_tables = set(connection.introspection.table_names())
        missing_tables = [tbl for tbl in required_tables if tbl not in existing_tables]

        self.stdout.write("-" * 65)
        self.stdout.write("Table Audit:")
        for tbl in required_tables:
            if tbl in existing_tables:
                self.stdout.write(self.style.SUCCESS(f"  [OK] {tbl}"))
            else:
                self.stdout.write(self.style.ERROR(f"  [MISSING] {tbl}"))

        if missing_tables:
            self.stderr.write(self.style.ERROR(
                f"\nDATABASE VERIFICATION FAILED: {len(missing_tables)} required tables are missing. "
                "Migrations must be applied."
            ))
            sys.exit(1)

        # 5. Migration status audit
        executor = MigrationExecutor(connection)
        targets = executor.loader.graph.leaf_nodes()
        unapplied = executor.migration_plan(targets)
        applied_count = len(executor.loader.applied_migrations)

        self.stdout.write("-" * 65)
        self.stdout.write(f"Migrations Applied: {applied_count}")
        if unapplied:
            self.stdout.write(self.style.WARNING(f"Pending Migrations: {len(unapplied)} unapplied migrations found!"))
            for mig, _ in unapplied:
                self.stdout.write(self.style.WARNING(f"  - {mig.app}.{mig.name}"))
            sys.exit(1)
        else:
            self.stdout.write(self.style.SUCCESS("All migrations are up-to-date."))

        # 6. Record counts
        from core.models import User, Location
        from cafes.models import Cafe, Category, Facility
        from reviews.models import Review
        from business.models import SubscriptionPlan

        user_count = User.objects.count()
        location_count = Location.objects.count()
        cafe_count = Cafe.objects.count()
        category_count = Category.objects.count()
        facility_count = Facility.objects.count()
        review_count = Review.objects.count()
        plan_count = SubscriptionPlan.objects.count()

        self.stdout.write("-" * 65)
        self.stdout.write("Dataset Record Summary:")
        self.stdout.write(f"  Users:               {user_count}")
        self.stdout.write(f"  Locations:           {location_count}")
        self.stdout.write(f"  Cafes:               {cafe_count}")
        self.stdout.write(f"  Categories:          {category_count}")
        self.stdout.write(f"  Facilities:          {facility_count}")
        self.stdout.write(f"  Reviews:             {review_count}")
        self.stdout.write(f"  Subscription Plans:  {plan_count}")
        self.stdout.write("-" * 65)

        self.stdout.write(self.style.SUCCESS("VERIFIED: Active database is healthy, migrated, and operational."))

