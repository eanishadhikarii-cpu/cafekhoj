import math
from rest_framework import generics, views, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.db.models import Q, Count, Exists, OuterRef, Case, When, Value, FloatField
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import (
    Category, Facility, Cafe, CafePhoto, OpeningHour,
    MenuCategory, MenuItem, CafeChangeRequest
)
from .serializers import (
    CategorySerializer, FacilitySerializer, CafeListSerializer,
    CafeDetailSerializer, CafeWriteSerializer, MenuItemSerializer,
    MenuCategorySerializer, CafeChangeRequestSerializer
)
from .google_places import sync_cafe_google_places
from reviews.models import Favourite
from business.models import BusinessMembership
from core.models import Location, AdminNotification


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance between two points on Earth in km."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(
            cafe_count=Count('cafes', filter=Q(cafes__publication_status='published'))
        ).order_by('name')


class FacilityListView(generics.ListAPIView):
    serializer_class = FacilitySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    queryset = Facility.objects.all().order_by('name')


class CafeListView(generics.ListAPIView):
    serializer_class = CafeListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Cafe.objects.filter(publication_status='published').select_related('location').prefetch_related('categories', 'facilities')

        # Filter by city or district
        city = self.request.query_params.get('city')
        if city:
            qs = qs.filter(Q(location__city__iexact=city) | Q(location__district__iexact=city))

        # Filter by category slug
        category_slug = self.request.query_params.get('category')
        if category_slug:
            qs = qs.filter(categories__slug=category_slug)

        # Filter by facility slug
        facility_slug = self.request.query_params.get('facility')
        if facility_slug:
            qs = qs.filter(facilities__slug=facility_slug)

        # Filter by price range
        price = self.request.query_params.get('price')
        if price:
            qs = qs.filter(price_range=price)

        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            try:
                qs = qs.filter(average_rating__gte=float(min_rating))
            except ValueError:
                pass

        # Filter by verification status
        verified = self.request.query_params.get('verified')
        if verified is not None and verified.lower() in ('true', '1'):
            qs = qs.filter(verification_status='verified')

        # Filter by search keyword
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(tagline__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search) |
                Q(location__city__icontains=search) |
                Q(location__neighbourhood__icontains=search) |
                Q(categories__name__icontains=search)
            ).distinct()

        # Sorting
        sort_by = self.request.query_params.get('sort', 'relevance')
        if sort_by in ('highest_rated', 'rating'):
            qs = qs.order_by('-average_rating', '-review_count')
        elif sort_by in ('most_reviewed', 'reviews'):
            qs = qs.order_by('-review_count', '-average_rating')
        elif sort_by in ('newest', 'recently_added'):
            qs = qs.order_by('-created_at')
        elif sort_by == 'name':
            qs = qs.order_by('name')
        else:
            qs = qs.order_by('-average_rating', '-review_count', 'name')

        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # User location for distance computation
        user_lat = request.query_params.get('lat')
        user_lng = request.query_params.get('lng')

        user_fav_ids = set()
        if request.user.is_authenticated:
            user_fav_ids = set(Favourite.objects.filter(user=request.user).values_list('cafe_id', flat=True))

        results = response.data['results'] if 'results' in response.data else response.data

        for item in results:
            item['is_favourited'] = item['id'] in user_fav_ids
            if user_lat and user_lng:
                try:
                    dist = haversine_distance(
                        float(user_lat), float(user_lng),
                        float(item['latitude']), float(item['longitude'])
                    )
                    item['distance_km'] = round(dist, 2)
                except (ValueError, TypeError):
                    item['distance_km'] = None

        if request.query_params.get('sort') == 'nearest' and user_lat and user_lng:
            results.sort(key=lambda x: x.get('distance_km') or 999999)

        return response


class CafeDetailView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        # Allow platform admin or cafe operators to view unpublished cafes
        cafe = get_object_or_404(
            Cafe.objects.select_related('location')
            .prefetch_related('categories', 'facilities', 'photos', 'opening_hours', 'menu_categories__items'),
            slug=slug
        )

        if cafe.publication_status != 'published':
            can_view = False
            if request.user.is_authenticated:
                if request.user.is_platform_admin() or BusinessMembership.objects.filter(user=request.user, cafe=cafe).exists() or cafe.submitted_by == request.user:
                    can_view = True
            if not can_view:
                return Response({'detail': 'Not found or not yet published.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CafeDetailSerializer(cafe)
        data = serializer.data

        if request.user.is_authenticated:
            data['is_favourited'] = Favourite.objects.filter(user=request.user, cafe=cafe).exists()
            data['claimed_by_current_user'] = BusinessMembership.objects.filter(user=request.user, cafe=cafe).exists() or request.user.is_platform_admin()
        else:
            data['is_favourited'] = False
            data['claimed_by_current_user'] = False

        related = Cafe.objects.filter(
            publication_status='published',
            location=cafe.location
        ).exclude(id=cafe.id)[:4]
        data['related_cafes'] = CafeListSerializer(related, many=True).data

        return Response(data)


class CafeNearbyView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            lat = float(request.query_params.get('lat', 26.6343))
            lng = float(request.query_params.get('lng', 87.9863))
            radius = float(request.query_params.get('radius', 15.0))
        except ValueError:
            return Response({'error': 'Invalid lat/lng parameters.'}, status=status.HTTP_400_BAD_REQUEST)

        cafes = Cafe.objects.filter(publication_status='published').select_related('location').prefetch_related('categories')

        results = []
        for cafe in cafes:
            dist = haversine_distance(lat, lng, float(cafe.latitude), float(cafe.longitude))
            if dist <= radius:
                serialized = CafeListSerializer(cafe).data
                serialized['distance_km'] = round(dist, 2)
                results.append(serialized)

        results.sort(key=lambda x: x['distance_km'])
        return Response(results)


class CafeCreateView(generics.CreateAPIView):
    serializer_class = CafeWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        is_admin = user.is_platform_admin()

        pub_status = 'published' if is_admin else 'pending_review'
        ver_status = 'verified' if is_admin else 'pending_verification'

        cafe = serializer.save(
            submitted_by=user,
            publication_status=pub_status,
            verification_status=ver_status
        )

        if user.is_business_owner():
            BusinessMembership.objects.get_or_create(cafe=cafe, user=user, role='owner')

        # Trigger initial Google Places sync if place_id was provided
        if cafe.google_place_id:
            sync_cafe_google_places(cafe)

        # Notify platform admin if submitted by operator
        if not is_admin:
            AdminNotification.objects.create(
                notification_type='listing_pending',
                title=f"New Cafe Listing: {cafe.name}",
                message=f"Cafe '{cafe.name}' in {cafe.address} was submitted by {user.get_full_name() or user.username} ({user.email}).",
                related_object_type='Cafe',
                related_object_id=str(cafe.id)
            )


class CafeUpdateView(generics.UpdateAPIView):
    serializer_class = CafeWriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Cafe.objects.all()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.user.is_platform_admin():
            return
        is_member = BusinessMembership.objects.filter(cafe=obj, user=request.user).exists()
        if not is_member:
            self.permission_denied(request, message="You are not authorized to edit this cafe listing.")

    def perform_update(self, serializer):
        cafe = serializer.save()
        # If place ID changed or provided and not yet synced, sync Google Places
        if cafe.google_place_id and cafe.google_sync_status != 'synced':
            sync_cafe_google_places(cafe)


# -------------------------------------------------------------
# Admin Moderation & Google Places Endpoints
# -------------------------------------------------------------

class AdminCafeListView(generics.ListAPIView):
    serializer_class = CafeListSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Cafe.objects.all().select_related('location').prefetch_related('categories', 'facilities')
        pub_status = self.request.query_params.get('publication_status')
        if pub_status:
            qs = qs.filter(publication_status=pub_status)
        ver_status = self.request.query_params.get('verification_status')
        if ver_status:
            qs = qs.filter(verification_status=ver_status)
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(address__icontains=q))
        return qs.order_by('-created_at')


class AdminCafeReviewView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        cafe = get_object_or_404(Cafe, pk=pk)
        action = request.data.get('action') # 'publish', 'reject', 'suspend', 'verify', 'unverify'
        admin_notes = request.data.get('admin_notes', '')
        rejection_reason = request.data.get('rejection_reason', '')

        if action == 'publish':
            cafe.publication_status = 'published'
        elif action == 'reject':
            cafe.publication_status = 'rejected'
            cafe.rejection_reason = rejection_reason
        elif action == 'suspend':
            cafe.publication_status = 'suspended'
        elif action == 'verify':
            cafe.verification_status = 'verified'
            cafe.last_verified_at = timezone.now()
        elif action == 'unverify':
            cafe.verification_status = 'unverified'
        else:
            return Response({'error': f"Invalid action '{action}'."}, status=status.HTTP_400_BAD_REQUEST)

        if admin_notes:
            cafe.admin_notes = admin_notes
        cafe.save()

        return Response({
            'message': f"Cafe '{cafe.name}' updated successfully.",
            'cafe': CafeDetailSerializer(cafe).data
        })


class AdminCafeSyncGoogleView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        cafe = get_object_or_404(Cafe, pk=pk)
        place_id = request.data.get('google_place_id')
        if place_id:
            cafe.google_place_id = place_id.strip()
            cafe.save(update_fields=['google_place_id'])

        synced = sync_cafe_google_places(cafe)
        return Response({
            'success': synced,
            'google_sync_status': cafe.google_sync_status,
            'google_rating': float(cafe.google_rating) if cafe.google_rating else None,
            'google_user_ratings_total': cafe.google_user_ratings_total,
            'google_maps_url': cafe.google_maps_url,
            'google_last_synced_at': cafe.google_last_synced_at,
        })


# -------------------------------------------------------------
# Cafe Change Requests Workflow
# -------------------------------------------------------------

class CafeChangeRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = CafeChangeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin():
            return CafeChangeRequest.objects.all().select_related('cafe', 'requested_by', 'reviewed_by')
        return CafeChangeRequest.objects.filter(requested_by=user).select_related('cafe', 'requested_by', 'reviewed_by')

    def perform_create(self, serializer):
        user = self.request.user
        cafe = serializer.validated_data['cafe']
        if not user.is_platform_admin():
            if not BusinessMembership.objects.filter(cafe=cafe, user=user).exists():
                raise PermissionDenied("You can only submit change requests for cafes you manage.")
        change_req = serializer.save(requested_by=user)
        AdminNotification.objects.create(
            notification_type='claim_submitted',
            title=f"Listing Update Request: {cafe.name}",
            message=f"Operator {user.email} submitted modifications for {cafe.name} requiring admin approval.",
            related_object_type='CafeChangeRequest',
            related_object_id=str(change_req.id)
        )


class CafeChangeRequestReviewView(views.APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        change_req = get_object_or_404(CafeChangeRequest, pk=pk)
        decision = request.data.get('decision') # 'approve' or 'reject'
        admin_notes = request.data.get('admin_notes', '')

        if decision not in ('approve', 'reject'):
            return Response({'error': 'Decision must be approve or reject.'}, status=status.HTTP_400_BAD_REQUEST)

        change_req.status = 'approved' if decision == 'approve' else 'rejected'
        change_req.reviewed_by = request.user
        change_req.reviewed_at = timezone.now()
        change_req.admin_notes = admin_notes
        change_req.save()

        if decision == 'approve':
            # Apply proposed changes safely
            cafe = change_req.cafe
            safe_fields = {'name', 'tagline', 'description', 'address', 'phone', 'email', 'website', 'social_instagram', 'social_facebook', 'price_range', 'cover_image_url'}
            for field, val in change_req.proposed_changes.items():
                if field in safe_fields and hasattr(cafe, field):
                    setattr(cafe, field, val)
            cafe.save()

        return Response({
            'message': f"Change request {decision}d successfully.",
            'request': CafeChangeRequestSerializer(change_req).data
        })


# -------------------------------------------------------------
# Menu Items & Global Search
# -------------------------------------------------------------

class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        cafe_id = self.request.query_params.get('cafe_id')
        if cafe_id:
            return MenuItem.objects.filter(cafe_id=cafe_id).order_by('-is_signature', 'name')
        return MenuItem.objects.all()

    def perform_create(self, serializer):
        cafe = serializer.validated_data['cafe']
        if not self.request.user.is_platform_admin():
            if not BusinessMembership.objects.filter(cafe=cafe, user=self.request.user).exists():
                raise PermissionDenied("You do not manage this cafe.")
        menu_cat = serializer.validated_data.get('menu_category')
        if not menu_cat:
            menu_cat, _ = MenuCategory.objects.get_or_create(cafe=cafe, name='Main Menu', defaults={'display_order': 0})
            serializer.save(menu_category=menu_cat)
        else:
            serializer.save()


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = MenuItem.objects.all()

    def perform_update(self, serializer):
        item = self.get_object()
        if not self.request.user.is_platform_admin():
            if not BusinessMembership.objects.filter(cafe=item.cafe, user=self.request.user).exists():
                raise PermissionDenied("You do not manage this cafe.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_platform_admin():
            if not BusinessMembership.objects.filter(cafe=instance.cafe, user=self.request.user).exists():
                raise PermissionDenied("You do not manage this cafe.")
        instance.delete()


class GlobalSearchView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q or len(q) < 2:
            return Response({'cafes': [], 'categories': [], 'locations': []})

        cafes = Cafe.objects.filter(
            Q(name__icontains=q) | Q(address__icontains=q) | Q(tagline__icontains=q),
            publication_status='published'
        )[:6]

        categories = Category.objects.filter(
            Q(name__icontains=q) | Q(description__icontains=q)
        )[:4]

        locations = Location.objects.filter(
            Q(city__icontains=q) | Q(neighbourhood__icontains=q)
        )[:4]

        return Response({
            'cafes': CafeListSerializer(cafes, many=True).data,
            'categories': CategorySerializer(categories, many=True).data,
            'locations': [{'id': loc.id, 'name': str(loc), 'city': loc.city} for loc in locations]
        })
