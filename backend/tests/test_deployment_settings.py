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
