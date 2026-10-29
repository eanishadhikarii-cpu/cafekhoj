from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import User, Location
from cafes.models import Cafe, Category, Facility, MenuCategory, MenuItem
from reviews.models import Review, Favourite
from business.models import BusinessClaim, BusinessMembership, SubscriptionPlan


class CafeKhojAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser(
            username='admin_test', email='adm@cafekhoj.np', password='AdminPass123!', role='admin'
        )
        self.customer = User.objects.create_user(
            username='user_test', email='user@test.np', password='UserPass123!', role='customer'
        )
        self.business_user = User.objects.create_user(
            username='owner_test', email='owner@test.np', password='OwnerPass123!', role='business'
        )

        # Location
        self.loc = Location.objects.create(
            country='Nepal', province='Koshi Province', district='Jhapa',
            city='Birtamode', neighbourhood='Muktichowk', latitude=26.6343, longitude=87.9863
        )

        # Category
        self.category = Category.objects.create(name='Coffee Lovers', slug='coffee-lovers')

        # Cafe
        self.cafe = Cafe.objects.create(
            name='Test Himalayan Cafe',
            slug='test-himalayan-cafe',
            tagline='Freshly roasted',
            description='A cozy cafe',
            address='Muktichowk, Birtamode',
            location=self.loc,
            latitude=26.6343,
            longitude=87.9863,
            price_range='moderate',
            verification_status='verified',
            publication_status='published'
        )
        self.cafe.categories.add(self.category)

    def test_user_registration_and_login(self):
        """Tests user registration and token generation."""
        import re
        from django.core import mail

        reg_res = self.client.post(reverse('auth-register'), {
            'username': 'newuser101',
            'email': 'newuser101@example.com',
            'password': 'SecurePassword123!',
            'first_name': 'Ram',
            'last_name': 'Sharma',
            'role': 'customer'
        })
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(reg_res.data.get('requires_verification'))
        self.assertIn('user', reg_res.data)

        # Retrieve OTP generated during registration from dispatched email
        self.assertGreaterEqual(len(mail.outbox), 1)
        match = re.search(r'\b\d{6}\b', mail.outbox[-1].body)
        self.assertIsNotNone(match)
        otp_code = match.group(0)

        # Verify OTP
        verify_res = self.client.post(reverse('auth-verify-otp'), {
            'email': 'newuser101@example.com',
            'code': otp_code
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data.get('verified'))

        # Login
        login_res = self.client.post(reverse('auth-login'), {
            'username': 'newuser101',
            'password': 'SecurePassword123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)

    def test_cafe_list_and_filtering(self):
        """Tests cafe listing, filtering by city and category."""
        res = self.client.get(reverse('cafe-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results']), 1)

        # Filter by city
        res_city = self.client.get(reverse('cafe-list') + '?city=Birtamode')
        self.assertEqual(res_city.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_city.data['results']), 1)

        # Filter by category
        res_cat = self.client.get(reverse('cafe-list') + '?category=coffee-lovers')
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_cat.data['results']), 1)

    def test_nearby_distance_calculation(self):
        """Tests calculation of Haversine distance for nearby cafes."""
        res = self.client.get(reverse('cafe-nearby') + '?lat=26.6343&lng=87.9863&radius=5')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)
        self.assertIn('distance_km', res.data[0])
        # Same coordinates should be near 0.0 km
        self.assertLessEqual(res.data[0]['distance_km'], 0.1)

    def test_review_submission_and_duplicate_prevention(self):
        """Tests authenticated review submission and prevents duplicate active reviews."""
        self.client.force_authenticate(user=self.customer)
        
        # Submit first review
        res = self.client.post(reverse('cafe-reviews', kwargs={'cafe_id': self.cafe.id}), {
            'rating': 5,
            'review_text': 'Exceptional cappuccino and wonderful atmosphere!'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['rating'], 5)

        # Verify cafe aggregate rating recalculated safely
        self.cafe.refresh_from_db()
        self.assertEqual(float(self.cafe.average_rating), 5.0)
        self.assertEqual(self.cafe.review_count, 1)

        # Attempt duplicate review for the same cafe by the same user
        dup_res = self.client.post(reverse('cafe-reviews', kwargs={'cafe_id': self.cafe.id}), {
            'rating': 4,
            'review_text': 'Another review from the same person'
        })
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_favourite_toggle(self):
        """Tests saving and un-saving a cafe in favourites."""
        self.client.force_authenticate(user=self.customer)
        
        # Toggle add
        res1 = self.client.post(reverse('favourite-toggle'), {'cafe_id': self.cafe.id})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data['is_favourited'])

        # Check me/favourites
        favs_res = self.client.get(reverse('user-favourites'))
        self.assertEqual(favs_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(favs_res.data['results']), 1)

        # Toggle remove
        res2 = self.client.post(reverse('favourite-toggle'), {'cafe_id': self.cafe.id})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data['is_favourited'])

    def test_business_claim_and_admin_approval(self):
        """Tests business claim submission and administrator approval workflow."""
        # 1. Business user claims cafe
        self.client.force_authenticate(user=self.business_user)
        claim_res = self.client.post(reverse('business-claims'), {
            'cafe': self.cafe.id,
            'business_role': 'Co-Founder',
            'contact_phone': '+977-9800000000',
            'contact_email': 'owner@test.np',
            'evidence_reference': 'VAT/PAN: 601234567, Municipality Reg: 4421'
        })
        self.assertEqual(claim_res.status_code, status.HTTP_201_CREATED)
        claim_id = claim_res.data['id']

        # 2. Admin approves claim
        self.client.force_authenticate(user=self.admin)
        app_res = self.client.post(reverse('admin-api-claim-review', kwargs={'pk': claim_id}), {
            'decision': 'approve',
            'admin_notes': 'Verified against Jhapa Chamber of Commerce registry.'
        })
        self.assertEqual(app_res.status_code, status.HTTP_200_OK)
        self.assertEqual(app_res.data['status'], 'approved')

        # Check that user is now membership manager
        self.assertTrue(BusinessMembership.objects.filter(cafe=self.cafe, user=self.business_user).exists())

    def test_csv_import_validation_and_dry_run(self):
        """Tests CSV import parser with header validation and dry-run mode."""
        self.client.force_authenticate(user=self.admin)

        valid_csv = (
            "name,address,city,district,latitude,longitude,price_range,phone,tagline,description\n"
            "Chiya Junction,Main Road,Damak,Jhapa,26.6650,87.7010,budget,+977-23-580001,Pure Chiya,Great local tea spot\n"
        )

        # 1. Dry run
        dry_res = self.client.post(reverse('admin-api-import'), {
            'csv_text': valid_csv,
            'dry_run': 'true'
        })
        self.assertEqual(dry_res.status_code, status.HTTP_200_OK)
        self.assertTrue(dry_res.data['dry_run'])
        self.assertEqual(dry_res.data['valid_rows'], 1)
        self.assertEqual(dry_res.data['records_created'], 0)
        self.assertFalse(Cafe.objects.filter(name='Chiya Junction').exists())

        # 2. Live import
        live_res = self.client.post(reverse('admin-api-import'), {
            'csv_text': valid_csv,
            'dry_run': 'false'
        })
        self.assertEqual(live_res.status_code, status.HTTP_200_OK)
        self.assertEqual(live_res.data['records_created'], 1)
        self.assertTrue(Cafe.objects.filter(name='Chiya Junction').exists())

        # 3. Duplicate detection
        dup_res = self.client.post(reverse('admin-api-import'), {
            'csv_text': valid_csv,
            'dry_run': 'false'
        })
        self.assertEqual(dup_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(dup_res.data['errors']), 1)
        self.assertIn("already exists", dup_res.data['errors'][0]['error'])

