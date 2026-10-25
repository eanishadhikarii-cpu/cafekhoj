import csv
import io
from datetime import datetime, timedelta
from rest_framework import generics, views, status, permissions, serializers
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Avg, Sum, Q
from django.shortcuts import get_object_or_404

from .models import BusinessClaim, BusinessMembership, SubscriptionPlan, Subscription, Promotion
from .serializers import (
    BusinessClaimSerializer, BusinessMembershipSerializer,
    SubscriptionPlanSerializer, SubscriptionSerializer, PromotionSerializer
)
from cafes.models import Cafe, Category, Facility, OpeningHour, MenuItem, MenuCategory
from reviews.models import Review, ReviewReport
from core.models import User, Location, AuditLog, AnalyticsEvent


class BusinessClaimCreateListView(generics.ListCreateAPIView):
    serializer_class = BusinessClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin():
            status_param = self.request.query_params.get('status')
            if status_param:
                return BusinessClaim.objects.filter(status=status_param).select_related('cafe', 'claimant')
            return BusinessClaim.objects.all().select_related('cafe', 'claimant')
        return BusinessClaim.objects.filter(claimant=user).select_related('cafe', 'claimant')

    def perform_create(self, serializer):
        user = self.request.user
        cafe = serializer.validated_data['cafe']
        # Check if already claimed or pending
        if BusinessClaim.objects.filter(cafe=cafe, claimant=user, status='pending').exists():
            raise serializers.ValidationError("You already have a pending claim for this cafe.")
        serializer.save(claimant=user)


class BusinessDashboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Cafes managed by user
        memberships = BusinessMembership.objects.filter(user=user).select_related('cafe', 'cafe__location')
        cafe_ids = [m.cafe_id for m in memberships]

        if not cafe_ids and not user.is_platform_admin():
            return Response({
                'managed_cafes': [],
                'total_views': 0,
                'total_direction_clicks': 0,
                'total_contact_clicks': 0,
                'average_rating': 0.0,
                'total_reviews': 0,
                'recent_reviews': [],
                'promotions': [],
                'active_subscriptions': []
            })

        if user.is_platform_admin() and not cafe_ids:
            # Platform admins can preview dashboard with all verified cafes
            cafe_ids = list(Cafe.objects.filter(verification_status='verified').values_list('id', flat=True)[:5])

        cafes = Cafe.objects.filter(id__in=cafe_ids)
        
        # Analytics calculations
        events = AnalyticsEvent.objects.filter(cafe_id__in=cafe_ids)
        views_count = events.filter(event_type='listing_view').count()
        dir_clicks = events.filter(event_type='direction_click').count()
        contact_clicks = events.filter(event_type='contact_click').count()

        # Reviews
        reviews = Review.objects.filter(cafe_id__in=cafe_ids).select_related('user', 'cafe').order_by('-created_at')[:8]
        from reviews.serializers import ReviewSerializer
        reviews_data = ReviewSerializer(reviews, many=True).data

        # Promos
        promos = Promotion.objects.filter(cafe_id__in=cafe_ids).order_by('-created_at')
        promos_data = PromotionSerializer(promos, many=True).data

        # Subscriptions
        subs = Subscription.objects.filter(cafe_id__in=cafe_ids).select_related('plan').order_by('-created_at')
        subs_data = SubscriptionSerializer(subs, many=True).data

        from cafes.serializers import CafeListSerializer
        return Response({
            'managed_cafes': CafeListSerializer(cafes, many=True).data,
            'total_views': views_count,
            'total_direction_clicks': dir_clicks,
            'total_contact_clicks': contact_clicks,
            'average_rating': round(cafes.aggregate(avg=Avg('average_rating'))['avg'] or 0.0, 2),
            'total_reviews': reviews.count(),
            'recent_reviews': reviews_data,
            'promotions': promos_data,
            'active_subscriptions': subs_data
        })


class PromotionListCreateView(generics.ListCreateAPIView):
    serializer_class = PromotionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cafe_id = self.request.query_params.get('cafe_id')
        if cafe_id:
            return Promotion.objects.filter(cafe_id=cafe_id).order_by('-created_at')
        if self.request.user.is_platform_admin():
            return Promotion.objects.all().order_by('-created_at')
        # Return promotions of managed cafes
        user_cafe_ids = BusinessMembership.objects.filter(user=self.request.user).values_list('cafe_id', flat=True)
        return Promotion.objects.filter(cafe_id__in=user_cafe_ids).order_by('-created_at')

    def perform_create(self, serializer):
        cafe = serializer.validated_data['cafe']
        if not self.request.user.is_platform_admin():
            if not BusinessMembership.objects.filter(cafe=cafe, user=self.request.user).exists():
                raise permissions.PermissionDenied("You do not manage this cafe.")
        serializer.save()


class SubscriptionPlanListView(generics.ListAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by('display_order', 'price')


class SubscriptionInquiryView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cafe_id = request.data.get('cafe_id')
        plan_id = request.data.get('plan_id')
        payment_method_intent = request.data.get('payment_method_intent', 'Fonepay / Bank Transfer')
        notes = request.data.get('notes', '')

        cafe = get_object_or_404(Cafe, id=cafe_id)
        plan = get_object_or_404(SubscriptionPlan, id=plan_id)

        # Ensure user is manager of this cafe or admin
        if not request.user.is_platform_admin():
            if not BusinessMembership.objects.filter(cafe=cafe, user=request.user).exists():
                return Response({'error': 'You do not have management permissions for this cafe.'}, status=status.HTTP_403_FORBIDDEN)

        # Create pending subscription with clear inquiry reference
        now = timezone.now()
        ends = now + timedelta(days=30 if plan.billing_period == 'monthly' else 365)

        sub = Subscription.objects.create(
            cafe=cafe,
            plan=plan,
            status='pending_payment',
            started_at=now,
            ends_at=ends,
            payment_reference=f"INQ-{cafe.id}-{plan.code}-{int(now.timestamp())}",
            is_active=False
        )

        AuditLog.objects.create(
            actor_user=request.user,
            action='subscription_inquiry',
            entity_type='Subscription',
            entity_id=str(sub.id),
            details={
                'cafe_name': cafe.name,
                'plan_name': plan.name,
                'price': float(plan.price),
                'method': payment_method_intent,
                'notes': notes
            }
        )

        return Response({
            'subscription': SubscriptionSerializer(sub).data,
            'message': (
                f"Subscription inquiry for '{plan.name}' (NPR {plan.price}) has been initiated. "
                "Per Nepal merchant compliance, payments are verified via direct settlement (eSewa / Khalti / Fonepay / Bank Transfer). "
                "Our business accounts team will contact you to confirm settlement and activate premium visibility."
            ),
            'status': 'pending_payment'
        }, status=status.HTTP_201_CREATED)


class AdminDashboardView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_cafes = Cafe.objects.count()
        published_cafes = Cafe.objects.filter(publication_status='published').count()
        verified_cafes = Cafe.objects.filter(verification_status='verified').count()
        pending_claims = BusinessClaim.objects.filter(status='pending').count()
        total_users = User.objects.count()
        published_reviews = Review.objects.filter(moderation_status='published').count()
        pending_reviews = Review.objects.filter(moderation_status='pending').count()
        reported_reviews = ReviewReport.objects.filter(status='pending').count()
        active_promotions = Promotion.objects.filter(status='active', end_at__gte=now).count()
        total_events = AnalyticsEvent.objects.count()

        return Response({
            'total_cafes': total_cafes,
            'published_cafes': published_cafes,
            'verified_cafes': verified_cafes,
            'pending_claims': pending_claims,
            'total_users': total_users,
            'published_reviews': published_reviews,
            'pending_reviews': pending_reviews,
            'reported_reviews': reported_reviews,
            'active_promotions': active_promotions,
            'total_events': total_events,
        })


class AdminClaimReviewView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        claim = get_object_or_404(BusinessClaim, pk=pk)
        decision = request.data.get('decision') # 'approve' or 'reject'
        admin_notes = request.data.get('admin_notes', '')
        rejection_reason = request.data.get('rejection_reason', '')

        if decision not in ('approve', 'reject'):
            return Response({'error': 'Decision must be either "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            claim.reviewed_by = request.user
            claim.reviewed_at = timezone.now()
            claim.admin_notes = admin_notes

            if decision == 'approve':
                claim.status = 'approved'
                claim.save()
                
                # Add membership
                BusinessMembership.objects.get_or_create(
                    cafe=claim.cafe,
                    user=claim.claimant,
                    defaults={'role': 'owner'}
                )
                
                # Mark cafe verified
                claim.cafe.verification_status = 'verified'
                claim.cafe.last_verified_at = timezone.now()
                claim.cafe.save()

                # Upgrade claimant role to business
                if claim.claimant.role == 'customer':
                    claim.claimant.role = 'business'
                    claim.claimant.save()

                AuditLog.objects.create(
                    actor_user=request.user,
                    action='approve_business_claim',
                    entity_type='BusinessClaim',
                    entity_id=str(claim.id),
                    details={'cafe_name': claim.cafe.name, 'claimant': claim.claimant.username}
                )
            else:
                claim.status = 'rejected'
                claim.rejection_reason = rejection_reason
                claim.save()

                AuditLog.objects.create(
                    actor_user=request.user,
                    action='reject_business_claim',
                    entity_type='BusinessClaim',
                    entity_id=str(claim.id),
                    details={'cafe_name': claim.cafe.name, 'reason': rejection_reason}
                )

        return Response(BusinessClaimSerializer(claim).data)


class AdminReviewModerationView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        status_action = request.data.get('moderation_status') # published, rejected, flagged

        if status_action not in dict(Review.MODERATION_CHOICES):
            return Response({'error': 'Invalid moderation status.'}, status=status.HTTP_400_BAD_REQUEST)

        review.moderation_status = status_action
        review.save()

        AuditLog.objects.create(
            actor_user=request.user,
            action='moderate_review',
            entity_type='Review',
            entity_id=str(review.id),
            details={'cafe_name': review.cafe.name, 'new_status': status_action}
        )

        from reviews.serializers import ReviewSerializer
        return Response(ReviewSerializer(review).data)


class AdminReportsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    from reviews.serializers import ReviewReportSerializer
    serializer_class = ReviewReportSerializer
    queryset = ReviewReport.objects.all().select_related('review', 'reporter', 'review__cafe').order_by('-created_at')


class AdminReportResolveView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        report = get_object_or_404(ReviewReport, pk=pk)
        resolution = request.data.get('status', 'action_taken') # 'reviewed', 'dismissed', 'action_taken'
        report.status = resolution
        report.save()
        return Response({'status': report.status, 'message': 'Report resolution updated.'})


class AdminCSVImportView(views.APIView):
    """
    Bulk imports cafes from CSV with:
    - Dry run option
    - Column validation (name, address, city, district, latitude, longitude, price_range)
    - Coordinate range validation
    - Duplicate detection
    - Detailed error log without silent discarding
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        dry_run = str(request.data.get('dry_run', 'false')).lower() in ('true', '1')
        csv_file = request.FILES.get('file')
        raw_text = request.data.get('csv_text')

        if not csv_file and not raw_text:
            return Response({'error': 'Please provide either a CSV file upload or csv_text string.'}, status=status.HTTP_400_BAD_REQUEST)

        if csv_file:
            content = csv_file.read().decode('utf-8-sig', errors='replace')
        else:
            content = raw_text

        reader = csv.DictReader(io.StringIO(content))
        if not reader.fieldnames:
            return Response({'error': 'CSV has no header row.'}, status=status.HTTP_400_BAD_REQUEST)

        required_columns = {'name', 'address', 'city', 'latitude', 'longitude'}
        missing_columns = required_columns - set(col.strip().lower() for col in reader.fieldnames)
        if missing_columns:
            return Response({
                'error': f'Missing required columns: {", ".join(missing_columns)}',
                'required_columns': list(required_columns),
                'found_columns': reader.fieldnames
            }, status=status.HTTP_400_BAD_REQUEST)

        processed = 0
        created_count = 0
        errors = []
        rows_to_create = []

        for row_idx, row in enumerate(reader, start=2): # Line 2 is first data row
            processed += 1
            clean_row = {k.strip().lower(): (v.strip() if v else '') for k, v in row.items()}
            
            name = clean_row.get('name')
            address = clean_row.get('address')
            city = clean_row.get('city')
            district = clean_row.get('district', 'Jhapa') or 'Jhapa'
            lat_str = clean_row.get('latitude')
            lng_str = clean_row.get('longitude')
            price_range = clean_row.get('price_range', 'moderate').lower() or 'moderate'
            phone = clean_row.get('phone', '')
            tagline = clean_row.get('tagline', '')
            description = clean_row.get('description', '') or f"A delightful cafe located at {address}, {city}."
            is_sample = str(clean_row.get('is_sample_data', 'false')).lower() in ('true', '1')

            # Validation
            if not name:
                errors.append({'row': row_idx, 'error': 'Missing cafe name.'})
                continue
            if not address:
                errors.append({'row': row_idx, 'error': f"Missing address for '{name}'."})
                continue
            if not city:
                errors.append({'row': row_idx, 'error': f"Missing city for '{name}'."})
                continue

            try:
                lat = float(lat_str)
                lng = float(lng_str)
                if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                    errors.append({'row': row_idx, 'error': f"Coordinates out of range: ({lat}, {lng}) for '{name}'."})
                    continue
            except (ValueError, TypeError):
                errors.append({'row': row_idx, 'error': f"Invalid numeric latitude/longitude for '{name}': {lat_str}, {lng_str}."})
                continue

            if price_range not in ('budget', 'moderate', 'premium'):
                price_range = 'moderate'

            # Duplicate check by name & city
            if Cafe.objects.filter(name__iexact=name, location__city__iexact=city).exists():
                errors.append({'row': row_idx, 'error': f"Duplicate cafe: '{name}' already exists in '{city}'."})
                continue

            rows_to_create.append({
                'name': name,
                'address': address,
                'city': city,
                'district': district,
                'latitude': lat,
                'longitude': lng,
                'price_range': price_range,
                'phone': phone,
                'tagline': tagline,
                'description': description,
                'is_sample_data': is_sample
            })

        if not dry_run and rows_to_create:
            with transaction.atomic():
                for item in rows_to_create:
                    location, _ = Location.objects.get_or_create(
                        city=item['city'],
                        district=item['district'],
                        defaults={'country': 'Nepal', 'province': 'Koshi Province'}
                    )
                    Cafe.objects.create(
                        name=item['name'],
                        address=item['address'],
                        location=location,
                        latitude=item['latitude'],
                        longitude=item['longitude'],
                        price_range=item['price_range'],
                        phone=item['phone'],
                        tagline=item['tagline'],
                        description=item['description'],
                        verification_status='verified',
                        publication_status='published',
                        is_sample_data=item['is_sample_data'],
                        source='CSV Admin Import'
                    )
                    created_count += 1

                AuditLog.objects.create(
                    actor_user=request.user,
                    action='csv_bulk_import',
                    entity_type='Cafe',
                    entity_id=f"count:{created_count}",
                    details={'processed': processed, 'created': created_count, 'errors_count': len(errors)}
                )

        return Response({
            'dry_run': dry_run,
            'total_rows_processed': processed,
            'valid_rows': len(rows_to_create),
            'records_created': created_count if not dry_run else 0,
            'errors': errors,
            'summary': f"Processed {processed} rows: {len(rows_to_create)} valid, {len(errors)} errors. {'Dry run completed (no changes committed).' if dry_run else f'{created_count} cafes created.'}"
        })
