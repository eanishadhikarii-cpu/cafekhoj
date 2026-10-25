import os
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import User, Location, AnalyticsEvent, AuditLog
from cafes.models import Cafe, Category, Facility, MenuCategory, MenuItem, OpeningHour, CafePhoto
from reviews.models import Review, Favourite, ReviewResponse, ReviewReport
from business.models import BusinessClaim, BusinessMembership, SubscriptionPlan, Subscription, Promotion


class ExtendedE2ETests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser(
            username='admin_e2e', email='admin_e2e@cafekhoj.np', password='AdminPass123!', role='admin'
        )
        self.owner = User.objects.create_user(
            username='owner_e2e', email='owner_e2e@test.np', password='OwnerPass123!', role='business'
        )
        self.customer = User.objects.create_user(
            username='customer_e2e', email='customer_e2e@test.np', password='CustomerPass123!', role='customer'
        )
        self.other_customer = User.objects.create_user(
            username='other_customer_e2e', email='other_e2e@test.np', password='OtherPass123!', role='customer'
        )

        # Location
        self.loc = Location.objects.create(
            country='Nepal', province='Koshi Province', district='Jhapa',
            city='Birtamode', neighbourhood='Muktichowk', latitude=26.6343, longitude=87.9863
        )

        # Cafe
        self.cafe = Cafe.objects.create(
            name='Test Central Cafe',
            slug='test-central-cafe',
            tagline='Best brews in Birtamode',
            description='Cozy atmosphere and artisanal roasts.',
            address='Muktichowk, Birtamode',
            location=self.loc,
            latitude=26.6343,
            longitude=87.9863,
            price_range='moderate',
            verification_status='verified',
            publication_status='published'
        )

        # Membership for owner
        BusinessMembership.objects.create(cafe=self.cafe, user=self.owner, role='owner')

        # Plan
        self.plan = SubscriptionPlan.objects.create(
            name='Featured Monthly', code='featured_m', price=500.00, billing_period='monthly'
        )

    def test_global_search_endpoint(self):
        """Tests global multi-entity search endpoint."""
        res = self.client.get(reverse('global-search') + '?q=Central')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('cafes', res.data)
        self.assertTrue(any(c['id'] == self.cafe.id for c in res.data['cafes']))

    def test_analytics_tracking(self):
        """Tests telemetry event tracking."""
        res = self.client.post(reverse('analytics-track'), {
            'event_type': 'listing_view',
            'cafe': self.cafe.id,
            'anonymous_session_id': 'test_sess_123',
            'metadata': {'source': 'search'}
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AnalyticsEvent.objects.filter(cafe=self.cafe, event_type='listing_view').exists())

    def test_menu_item_create_update_delete(self):
        """Tests menu item management permissions and auto-category creation."""
        self.client.force_authenticate(user=self.owner)
        
        # Create item without specifying category (tests fallback)
        res = self.client.post(reverse('menu-item-list-create'), {
            'cafe': self.cafe.id,
            'name': 'Himalayan Cold Brew',
            'price': 280.00,
            'currency': 'NPR',
            'description': '18-hour slow steep',
            'dietary_labels': 'Vegan'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        item_id = res.data['id']

        # Non-owner cannot edit
        self.client.force_authenticate(user=self.customer)
        res_fail = self.client.patch(reverse('menu-item-detail', kwargs={'pk': item_id}), {'price': 300.00}, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_403_FORBIDDEN)

        # Owner can edit and delete
        self.client.force_authenticate(user=self.owner)
        res_update = self.client.patch(reverse('menu-item-detail', kwargs={'pk': item_id}), {'price': 300.00}, format='json')
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(float(res_update.data['price']), 300.00)

        res_delete = self.client.delete(reverse('menu-item-detail', kwargs={'pk': item_id}))
        self.assertEqual(res_delete.status_code, status.HTTP_204_NO_CONTENT)

    def test_review_response_workflow(self):
        """Tests owner review response and unauthorized user rejection."""
        # Customer writes review
        self.client.force_authenticate(user=self.customer)
        rev_res = self.client.post(reverse('cafe-reviews', kwargs={'cafe_id': self.cafe.id}), {
            'rating': 4,
            'review_text': 'Great ambience and coffee!'
        })
        self.assertEqual(rev_res.status_code, status.HTTP_201_CREATED)
        rev_id = rev_res.data['id']

        # Unauthorized customer cannot respond
        self.client.force_authenticate(user=self.other_customer)
        unauth_res = self.client.post(reverse('review-respond', kwargs={'pk': rev_id}), {
            'response_text': 'Fake response from stranger'
        })
        self.assertEqual(unauth_res.status_code, status.HTTP_403_FORBIDDEN)

        # Owner responds successfully
        self.client.force_authenticate(user=self.owner)
        auth_res = self.client.post(reverse('review-respond', kwargs={'pk': rev_id}), {
            'response_text': 'Thank you for visiting us Anita! Hope to see you again.'
        })
        self.assertEqual(auth_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ReviewResponse.objects.filter(review_id=rev_id).exists())

    def test_promotion_create_and_security(self):
        """Tests business promotion creation and owner validation."""
        self.client.force_authenticate(user=self.owner)
        res = self.client.post(reverse('business-promotions'), {
            'cafe': self.cafe.id,
            'title': 'Morning Espresso 20% Off',
            'description': 'Valid 7 AM - 10 AM on weekdays',
            'start_at': '2026-10-25T07:00:00Z',
            'end_at': '2026-11-25T10:00:00Z',
            'discount_percentage': 20,
            'is_sponsored': False,
            'status': 'active'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Promotion.objects.filter(title='Morning Espresso 20% Off').exists())

    def test_subscription_inquiry_flow(self):
        """Tests subscription inquiry recording and audit log creation."""
        self.client.force_authenticate(user=self.owner)
        res = self.client.post(reverse('subscriptions-inquire'), {
            'cafe_id': self.cafe.id,
            'plan_id': self.plan.id,
            'payment_method_intent': 'Fonepay',
            'notes': 'Please contact on 9817060233'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('subscription', res.data)
        self.assertEqual(res.data['status'], 'pending_payment')
        self.assertTrue(AuditLog.objects.filter(action='subscription_inquiry').exists())

    def test_admin_review_moderation(self):
        """Tests admin moderation of inappropriate reviews."""
        # Customer posts review
        self.client.force_authenticate(user=self.customer)
        rev = Review.objects.create(
            cafe=self.cafe, user=self.customer, rating=1, review_text='Spam review', moderation_status='published'
        )
        
        # Admin flags / rejects review
        self.client.force_authenticate(user=self.admin)
        mod_res = self.client.post(reverse('admin-api-review-moderate', kwargs={'pk': rev.id}), {
            'moderation_status': 'rejected'
        })
        self.assertEqual(mod_res.status_code, status.HTTP_200_OK)
        rev.refresh_from_db()
        self.assertEqual(rev.moderation_status, 'rejected')

