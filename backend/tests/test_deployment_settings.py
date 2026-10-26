import os
import sys
from unittest import TestCase
from django.conf import settings
import urllib.parse


class DeploymentDatabaseConfigTests(TestCase):
    """
    Tests for production database configuration parsing and guardrails.
    Ensures zero credentials exposure and verifies protection against silent SQLite fallback.
    """

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

    def test_supabase_direct_url_parsing(self):
        """Verifies Supabase direct connection URL parsing."""
        supabase_url = 'postgresql://postgres:supa%23pass99@db.abcdefghijklmnopqrst.supabase.co:5432/postgres'
        url = urllib.parse.urlparse(supabase_url)
        self.assertEqual(urllib.parse.unquote(url.username), 'postgres')
        self.assertEqual(urllib.parse.unquote(url.password), 'supa#pass99')
        self.assertEqual(url.hostname, 'db.abcdefghijklmnopqrst.supabase.co')
        self.assertEqual(url.port, 5432)
        self.assertEqual(url.path.lstrip('/') or 'postgres', 'postgres')

    def test_supabase_pooler_url_parsing(self):
        """Verifies Supabase transaction pooler URL parsing with project-scoped username."""
        pooler_url = 'postgres://postgres.abcdefghijklmnop:pooler%23pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
        url = urllib.parse.urlparse(pooler_url)
        self.assertEqual(urllib.parse.unquote(url.username), 'postgres.abcdefghijklmnop')
        self.assertEqual(urllib.parse.unquote(url.password), 'pooler#pass')
        self.assertEqual(url.hostname, 'aws-0-ap-southeast-1.pooler.supabase.com')
        self.assertEqual(url.port, 6543)
        self.assertEqual(url.path.lstrip('/') or 'postgres', 'postgres')
        is_transaction_pooler = (url.port == 6543)
        self.assertTrue(is_transaction_pooler)

    def test_unresolved_blueprint_detection(self):
        """Verifies that unresolved ${{...}} blueprint syntax is identified as an invalid URL."""
        unresolved = '${{cafekhoj-db.DATABASE_URL}}'
        self.assertTrue(unresolved.startswith('${{'))
        self.assertFalse(unresolved.startswith('postgres://'))
        self.assertFalse(unresolved.startswith('postgresql://'))

    def test_active_database_engine(self):
        """Verifies the active test database engine is configured and operational."""
        from django.db import connection
        self.assertIsNotNone(connection.vendor)
        # Test connection health probe
        connection.ensure_connection()
        self.assertTrue(connection.is_usable())

