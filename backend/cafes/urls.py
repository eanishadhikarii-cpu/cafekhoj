from django.urls import path
from .views import (
    CafeListView, CafeDetailView, CafeNearbyView, CafeCreateView, CafeUpdateView,
    CategoryListView, FacilityListView, MenuItemListCreateView, MenuItemDetailView,
    GlobalSearchView
)

urlpatterns = [
    path('cafes/', CafeListView.as_view(), name='cafe-list'),
    path('cafes/create/', CafeCreateView.as_view(), name='cafe-create'),
    path('cafes/nearby/', CafeNearbyView.as_view(), name='cafe-nearby'),
    path('cafes/<slug:slug>/', CafeDetailView.as_view(), name='cafe-detail'),
    path('cafes/<int:pk>/update/', CafeUpdateView.as_view(), name='cafe-update'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('facilities/', FacilityListView.as_view(), name='facility-list'),
    path('menu-items/', MenuItemListCreateView.as_view(), name='menu-item-list-create'),
    path('menu-items/<int:pk>/', MenuItemDetailView.as_view(), name='menu-item-detail'),
    path('search/', GlobalSearchView.as_view(), name='global-search'),
]

