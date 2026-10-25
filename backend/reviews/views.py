from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import F
from .models import Review, ReviewResponse, ReviewReport, Favourite
from .serializers import ReviewSerializer, ReviewResponseSerializer, ReviewReportSerializer, FavouriteSerializer
from cafes.models import Cafe
from business.models import BusinessMembership


class CafeReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        cafe_id = self.kwargs.get('cafe_id')
        qs = Review.objects.filter(cafe_id=cafe_id, moderation_status='published').select_related('user', 'business_response__business_user').prefetch_related('photos')

        # Allow user to see their own pending review
        if self.request.user.is_authenticated:
            own_review = Review.objects.filter(cafe_id=cafe_id, user=self.request.user)
            qs = (qs | own_review).distinct()

        # Rating filter
        rating = self.request.query_params.get('rating')
        if rating:
            qs = qs.filter(rating=rating)

        # Ordering
        sort = self.request.query_params.get('sort', 'newest')
        if sort == 'highest':
            qs = qs.order_by('-rating', '-created_at')
        elif sort == 'lowest':
            qs = qs.order_by('rating', '-created_at')
        elif sort == 'helpful':
            qs = qs.order_by('-helpful_count', '-created_at')
        else:
            qs = qs.order_by('-created_at')

        return qs

    def perform_create(self, serializer):
        cafe = get_object_or_404(Cafe, id=self.kwargs.get('cafe_id'))
        serializer.save(user=self.request.user, cafe=cafe, moderation_status='published')


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Review.objects.all()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.user.is_platform_admin():
            return
        if obj.user != request.user:
            self.permission_denied(request, message="You can only edit or delete your own reviews.")


class ReviewHelpfulView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        review.helpful_count = F('helpful_count') + 1
        review.save(update_fields=['helpful_count'])
        review.refresh_from_db()
        return Response({'helpful_count': review.helpful_count})


class ReviewReportView(generics.CreateAPIView):
    serializer_class = ReviewReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        review = get_object_or_404(Review, pk=self.kwargs.get('pk'))
        serializer.save(reporter=self.request.user, review=review)


class ReviewRespondView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        user = request.user

        # Must be owner of the cafe or platform admin
        is_owner = BusinessMembership.objects.filter(cafe=review.cafe, user=user).exists()
        if not is_owner and not user.is_platform_admin():
            return Response(
                {'error': 'Only the verified cafe owner or admin can respond to this review.'},
                status=status.HTTP_403_FORBIDDEN
            )

        response_text = request.data.get('response_text', '').strip()
        if not response_text:
            return Response({'error': 'Response text cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        resp, created = ReviewResponse.objects.update_or_create(
            review=review,
            defaults={
                'business_user': user,
                'response_text': response_text,
            }
        )
        return Response(ReviewResponseSerializer(resp).data, status=status.HTTP_201_CREATED)


class FavouriteToggleView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cafe_id = request.data.get('cafe_id')
        cafe = get_object_or_404(Cafe, id=cafe_id)
        fav, created = Favourite.objects.get_or_create(user=request.user, cafe=cafe)
        if not created:
            fav.delete()
            return Response({'is_favourited': False, 'message': f'Removed {cafe.name} from favourites.'})
        return Response({'is_favourited': True, 'message': f'Saved {cafe.name} to favourites.'})


class UserFavouritesListView(generics.ListAPIView):
    serializer_class = FavouriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favourite.objects.filter(user=self.request.user).select_related('cafe', 'cafe__location')


class UserReviewsListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).select_related('cafe', 'user').order_by('-created_at')
