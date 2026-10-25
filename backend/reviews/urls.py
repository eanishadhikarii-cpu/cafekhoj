from django.urls import path
from .views import (
    CafeReviewListCreateView, ReviewDetailView, ReviewHelpfulView,
    ReviewReportView, ReviewRespondView, FavouriteToggleView,
    UserFavouritesListView, UserReviewsListView
)

urlpatterns = [
    path('cafes/<int:cafe_id>/reviews/', CafeReviewListCreateView.as_view(), name='cafe-reviews'),
    path('reviews/<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
    path('reviews/<int:pk>/helpful/', ReviewHelpfulView.as_view(), name='review-helpful'),
    path('reviews/<int:pk>/report/', ReviewReportView.as_view(), name='review-report'),
    path('reviews/<int:pk>/respond/', ReviewRespondView.as_view(), name='review-respond'),
    path('favourites/', FavouriteToggleView.as_view(), name='favourite-toggle'),
    path('me/favourites/', UserFavouritesListView.as_view(), name='user-favourites'),
    path('me/reviews/', UserReviewsListView.as_view(), name='user-reviews'),
]

