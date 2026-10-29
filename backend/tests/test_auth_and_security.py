import re
from datetime import timedelta
from django.core import mail
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    User, EmailOTP, DeviceSession, DeviceAuthorizationRequest,
    PlatformAdministrator, AdminNotification, Location
)
from cafes.models import Cafe, Category


class CafeKhojAuthAndSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create primary platform admin
        self.primary_admin_user = User.objects.create_superuser(
            username='primary_admin',
            email='primary@cafekhoj.np',
            password='AdminPassword123!',
            role='admin',
            is_email_verified=True
        )
        self.primary_admin = PlatformAdministrator.objects.create(
            user=self.primary_admin_user,
            is_primary=True,
            notes='Initial project bootstrap'
        )

        # Location
        self.location = Location.objects.create(
            country='Nepal',
            province='Koshi Province',
            district='Jhapa',
            city='Birtamode',
            neighbourhood='Muktichowk',
            latitude=26.6343,
            longitude=87.9863
        )

        # Published Cafe
        self.cafe = Cafe.objects.create(
            name='Test Jhapa Cafe',
            slug='test-jhapa-cafe',
            tagline='Cozy coffee spot',
            description='Freshly ground in Birtamode',
            address='Muktichowk, Birtamode',
            location=self.location,
            latitude=26.6343,
            longitude=87.9863,
            price_range='moderate',
            publication_status='published',
            verification_status='verified',
            google_place_id='ChIJ1234567890',
            google_rating=4.5,
            google_user_ratings_total=120
        )

    # 1. Root & API v1 Endpoint Availability (Fixes Render 404s)
    def test_root_and_api_v1_endpoints(self):
        res_root = self.client.get('/')
        self.assertEqual(res_root.status_code, status.HTTP_200_OK)
        self.assertEqual(res_root.json().get('service'), 'cafekhoj-api')

        res_api_v1 = self.client.get('/api/v1')
        self.assertEqual(res_api_v1.status_code, status.HTTP_200_OK)
        self.assertEqual(res_api_v1.json().get('version'), 'v1')

        res_api_v1_slash = self.client.get('/api/v1/')
        self.assertEqual(res_api_v1_slash.status_code, status.HTTP_200_OK)

    # 2. Public Visitor Browsing (No Login Required)
    def test_public_visitor_browsing_without_auth(self):
        # Cafes list
        res_list = self.client.get(reverse('cafe-list'))
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res_list.data['results']), 1)

        # Cafe detail
        res_detail = self.client.get(reverse('cafe-detail', kwargs={'slug': 'test-jhapa-cafe'}))
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['name'], 'Test Jhapa Cafe')
        self.assertEqual(float(res_detail.data['google_rating']), 4.5)

        # Search
        res_search = self.client.get(reverse('global-search') + '?q=Jhapa')
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)

    # 3. Operator Registration & OTP Email Verification
    def test_operator_registration_otp_and_login_blocking(self):
        # Register operator
        reg_payload = {
            'username': 'jhapa_operator',
            'email': 'operator@jhapa.np',
            'password': 'StrongOperatorPassword123!',
            'first_name': 'Subash',
            'last_name': 'Adhikari',
            'phone': '+977-9800000000',
            'role': 'business',
            'operator_relationship': 'Owner',
            'terms_accepted': True
        }
        res_reg = self.client.post(reverse('auth-register'), reg_payload)
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_reg.data.get('requires_verification'))

        operator_user = User.objects.get(email='operator@jhapa.np')
        self.assertFalse(operator_user.is_email_verified)
        self.assertEqual(operator_user.operator_relationship, 'owner')

        # Attempt login before verification -> Must be blocked with 403
        res_unverified_login = self.client.post(reverse('auth-login'), {
            'username': 'operator@jhapa.np',
            'password': 'StrongOperatorPassword123!'
        })
        self.assertEqual(res_unverified_login.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(res_unverified_login.data.get('requires_verification'))

        # Verify OTP with invalid code -> Fails
        res_fail_otp = self.client.post(reverse('auth-verify-otp'), {
            'email': 'operator@jhapa.np',
            'code': '000000'
        })
        self.assertEqual(res_fail_otp.status_code, status.HTTP_400_BAD_REQUEST)

        # Extract OTP from dispatched email in outbox
        self.assertGreaterEqual(len(mail.outbox), 1)
        match = re.search(r'\b\d{6}\b', mail.outbox[-1].body)
        self.assertIsNotNone(match)
        otp_code = match.group(0)

        # Verify with actual OTP
        res_ok_otp = self.client.post(reverse('auth-verify-otp'), {
            'email': 'operator@jhapa.np',
            'code': otp_code
        })
        self.assertEqual(res_ok_otp.status_code, status.HTTP_200_OK)
        self.assertTrue(res_ok_otp.data.get('verified'))

        operator_user.refresh_from_db()
        self.assertTrue(operator_user.is_email_verified)

        # Already verified account informs user they are already verified
        res_already = self.client.post(reverse('auth-verify-otp'), {
            'email': 'operator@jhapa.np',
            'code': otp_code
        })
        self.assertEqual(res_already.status_code, status.HTTP_200_OK)
        self.assertTrue(res_already.data.get('verified'))

    # 4. Operator 1-Device Authorization Policy
    def test_operator_one_device_limit_and_admin_approval(self):
        operator = User.objects.create_user(
            username='singledr_op',
            email='single@op.np',
            password='OpPassword123!',
            role='business',
            is_email_verified=True
        )

        # Device 1 login -> Succeeds and establishes session
        res_dev1 = self.client.post(
            reverse('auth-login'),
            {'username': 'single@op.np', 'password': 'OpPassword123!'},
            HTTP_X_DEVICE_ID='macbook-pro-office',
            HTTP_X_DEVICE_NAME='Operator Office Laptop'
        )
        self.assertEqual(res_dev1.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_dev1.data)

        # Active session count for operator = 1
        self.assertEqual(DeviceSession.objects.filter(user=operator, is_active=True).count(), 1)

        # Device 2 login (different device ID) -> Blocked with device_authorization_required
        res_dev2 = self.client.post(
            reverse('auth-login'),
            {'username': 'single@op.np', 'password': 'OpPassword123!'},
            HTTP_X_DEVICE_ID='iphone-15-personal',
            HTTP_X_DEVICE_NAME='Operator iPhone 15'
        )
        self.assertEqual(res_dev2.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res_dev2.data.get('status'), 'device_authorization_required')
        self.assertNotIn('access', res_dev2.data)

        # Verify authorization request and admin notification created
        auth_req = DeviceAuthorizationRequest.objects.get(user=operator, device_id='iphone-15-personal')
        self.assertEqual(auth_req.status, 'pending')
        self.assertTrue(AdminNotification.objects.filter(notification_type='device_auth_pending').exists())

        # Admin approves Device 2 request
        self.client.force_authenticate(user=self.primary_admin_user)
        res_approve = self.client.post(
            reverse('admin-device-review', kwargs={'pk': auth_req.id}),
            {'decision': 'approve', 'admin_notes': 'Verified with cafe owner via phone'}
        )
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)

        # Check that Device 1 is now deactivated and Device 2 is active (strictly 1 active device)
        self.assertEqual(DeviceSession.objects.filter(user=operator, is_active=True).count(), 1)
        self.assertTrue(DeviceSession.objects.filter(user=operator, device_id='iphone-15-personal', is_active=True).exists())
        self.assertFalse(DeviceSession.objects.filter(user=operator, device_id='macbook-pro-office', is_active=True).exists())

        # Now Device 2 can log in directly
        self.client.force_authenticate(user=None)
        res_dev2_retry = self.client.post(
            reverse('auth-login'),
            {'username': 'single@op.np', 'password': 'OpPassword123!'},
            HTTP_X_DEVICE_ID='iphone-15-personal',
            HTTP_X_DEVICE_NAME='Operator iPhone 15'
        )
        self.assertEqual(res_dev2_retry.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_dev2_retry.data)

    # 5. Strictly Enforce Max 2 Platform Administrators
    def test_max_two_platform_administrators_limit(self):
        # Currently 1 admin exists (self.primary_admin)
        self.assertEqual(PlatformAdministrator.objects.count(), 1)

        # Admin adds 2nd administrator -> Succeeds
        self.client.force_authenticate(user=self.primary_admin_user)
        res_admin2 = self.client.post(reverse('admin-platform-delegate'), {
            'email': 'second_admin@cafekhoj.np',
            'full_name': 'Second Administrator',
            'notes': 'Designated secondary operations lead'
        })
        self.assertEqual(res_admin2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PlatformAdministrator.objects.count(), 2)

        # Attempt to add 3rd administrator -> Blocked (Limit = 2)
        res_admin3 = self.client.post(reverse('admin-platform-delegate'), {
            'email': 'third_admin@cafekhoj.np',
            'full_name': 'Third Attempt',
            'notes': 'Exceeding limit'
        })
        self.assertEqual(res_admin3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(PlatformAdministrator.objects.count(), 2)

        # Model validation level check
        user3 = User.objects.create_user(username='u3', email='u3@cafekhoj.np')
        third_inst = PlatformAdministrator(user=user3, notes='Direct create')
        with self.assertRaises(ValidationError):
            third_inst.clean()

    # 6. Read-Only Google Places Integrity (Operators cannot forge Google rating)
    def test_google_places_read_only_integrity(self):
        operator = User.objects.create_user(
            username='cafe_operator_jhapa',
            email='jhapa_op@cafekhoj.np',
            password='OpPassword123!',
            role='business',
            is_email_verified=True
        )
        from business.models import BusinessMembership
        BusinessMembership.objects.create(cafe=self.cafe, user=operator, role='owner')

        self.client.force_authenticate(user=operator)

        # Operator attempts to manually update Google rating to 5.0 and verification_status to verified
        res_tamper = self.client.patch(
            reverse('cafe-update', kwargs={'pk': self.cafe.id}),
            {
                'google_rating': 5.0,
                'google_user_ratings_total': 99999,
                'verification_status': 'verified',
                'publication_status': 'published',
                'name': 'Updated Cafe Name'
            }
        )
        self.assertEqual(res_tamper.status_code, status.HTTP_200_OK)

        self.cafe.refresh_from_db()
        # Name should be updated, but Google rating and status must NOT be modified by operator
        self.assertEqual(self.cafe.name, 'Updated Cafe Name')
        self.assertEqual(float(self.cafe.google_rating), 4.5)
        self.assertEqual(self.cafe.google_user_ratings_total, 120)
