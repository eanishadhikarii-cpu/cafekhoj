from pathlib import Path
from unittest import TestCase
import urllib.parse
from cafekhoj.settings import configure_database


class DeploymentDatabaseConfigTests(TestCase):
    """
    Tests for production database configuration parsing and guardrails.
    Ensures zero credentials exposure and verifies protection against silent SQLite fallback.
    """

    def setUp(self):
        self.dummy_base_dir = Path(__file__).resolve().parent.parent

    def test_postgres_url_parsing(self):
        """Verifies postgres URL parsing with percent-encoded credentials."""
        test_url = 'postgres://test_user:p%40ssword123@dpg-dbf2esgae00c73ehsrj0-a.render.com:5432/cafekhoj_db?sslmode=require'
        url = urllib.parse.urlparse(test_url)
        self.assertEqual(url.scheme, 'postgres')
        self.assertEqual(urllib.parse.unquote(url.username), 'test_user')
        self.assertEqual(urllib.parse.unquote(url.password), 'p@ssword123')
        self.assertEqual(url.hostname, 'dpg-dbf2esgae00c73ehsrj0-a.render.com')
        self.assertEqual(url.port, 5432)
        self.assertEqual(url.path.lstrip('/'), 'cafekhoj_db')
        qs = urllib.parse.parse_qs(url.query)
        self.assertEqual(qs.get('sslmode', [None])[0], 'require')

    def test_supabase_direct_config(self):
        """Verifies Supabase direct connection (port 5432) configuration."""
        supabase_url = 'postgresql://postgres:supa%23pass99@db.tdjgckzsgkzeieklhwod.supabase.co:5432/postgres'
        cfg = configure_database(supabase_url, debug=False, base_dir=self.dummy_base_dir)
        db = cfg['default']
        self.assertEqual(db['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(db['NAME'], 'postgres')
        self.assertEqual(db['USER'], 'postgres')
        self.assertEqual(db['PASSWORD'], 'supa#pass99')
        self.assertEqual(db['HOST'], 'db.tdjgckzsgkzeieklhwod.supabase.co')
        self.assertEqual(db['PORT'], 5432)
        self.assertEqual(db['CONN_MAX_AGE'], 60)
        self.assertFalse(db['DISABLE_SERVER_SIDE_CURSORS'])
        self.assertEqual(db['OPTIONS']['sslmode'], 'require')

    def test_supabase_session_pooler_config(self):
        """Verifies Supabase session pooler (port 5432) with project-scoped username."""
        pooler_url = 'postgresql://postgres.tdjgckzsgkzeieklhwod:pooler%23pass@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
        cfg = configure_database(pooler_url, debug=False, base_dir=self.dummy_base_dir)
        db = cfg['default']
        self.assertEqual(db['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(db['NAME'], 'postgres')
        self.assertEqual(db['USER'], 'postgres.tdjgckzsgkzeieklhwod')
        self.assertEqual(db['PASSWORD'], 'pooler#pass')
        self.assertEqual(db['HOST'], 'aws-0-ap-south-1.pooler.supabase.com')
        self.assertEqual(db['PORT'], 5432)
        self.assertEqual(db['CONN_MAX_AGE'], 60)
        self.assertFalse(db['DISABLE_SERVER_SIDE_CURSORS'])
        self.assertEqual(db['OPTIONS']['sslmode'], 'require')

    def test_supabase_transaction_pooler_config(self):
        """Verifies Supabase transaction pooler (port 6543) disables cursors and sets CONN_MAX_AGE to 0."""
        pooler_url = 'postgresql://postgres.tdjgckzsgkzeieklhwod:pooler%23pass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
        cfg = configure_database(pooler_url, debug=False, base_dir=self.dummy_base_dir)
        db = cfg['default']
        self.assertEqual(db['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(db['PORT'], 6543)
        self.assertEqual(db['CONN_MAX_AGE'], 0)
        self.assertTrue(db['DISABLE_SERVER_SIDE_CURSORS'])
        self.assertEqual(db['OPTIONS']['sslmode'], 'require')

    def test_ssl_enforcement_for_cloud_databases(self):
        """Verifies SSL is automatically enforced for Supabase and Render hosts even without query param."""
        cloud_url = 'postgres://user:pass@db.tdjgckzsgkzeieklhwod.supabase.co:5432/postgres'
        cfg = configure_database(cloud_url, debug=False, base_dir=self.dummy_base_dir)
        self.assertEqual(cfg['default']['OPTIONS'].get('sslmode'), 'require')

    def test_missing_database_url_in_production_raises_error(self):
        """Verifies that missing DATABASE_URL in production raises a strict RuntimeError."""
        with self.assertRaises(RuntimeError) as ctx:
            configure_database('', debug=False, base_dir=self.dummy_base_dir, is_testing=False)
        self.assertIn("SQLite is prohibited in production", str(ctx.exception))

    def test_unresolved_blueprint_syntax_raises_error(self):
        """Verifies that unresolved ${{...}} blueprint syntax raises an informative RuntimeError."""
        unresolved = '${{cafekhoj-db.DATABASE_URL}}'
        with self.assertRaises(RuntimeError) as ctx:
            configure_database(unresolved, debug=False, base_dir=self.dummy_base_dir, is_testing=False)
        self.assertIn("unresolved syntax", str(ctx.exception))

    def test_collectstatic_mode_uses_memory_sqlite(self):
        """Verifies that collectstatic mode uses an in-memory SQLite database."""
        cfg = configure_database('', debug=False, base_dir=self.dummy_base_dir, is_collectstatic=True)
        self.assertEqual(cfg['default']['ENGINE'], 'django.db.backends.sqlite3')
        self.assertEqual(cfg['default']['NAME'], ':memory:')

    def test_local_dev_mode_uses_sqlite(self):
        """Verifies that local development mode (DEBUG=True) without DATABASE_URL falls back to db.sqlite3."""
        cfg = configure_database('', debug=True, base_dir=self.dummy_base_dir)
        self.assertEqual(cfg['default']['ENGINE'], 'django.db.backends.sqlite3')
        self.assertEqual(cfg['default']['NAME'], self.dummy_base_dir / 'db.sqlite3')

    def test_active_database_engine(self):
        """Verifies the active test database engine is configured and operational."""
        from django.db import connection
        self.assertIsNotNone(connection.vendor)
        # Test connection health probe
        connection.ensure_connection()
        self.assertTrue(connection.is_usable())
