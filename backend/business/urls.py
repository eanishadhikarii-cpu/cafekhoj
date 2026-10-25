from django.urls import path
from .views import (
    BusinessClaimCreateListView, BusinessDashboardView, PromotionListCreateView,
    SubscriptionPlanListView, SubscriptionInquiryView, AdminDashboardView,
    AdminClaimReviewView, AdminReviewModerationView, AdminReportsListView,
    AdminReportResolveView, AdminCSVImportView
)

urlpatterns = [
    # Business Owner Portal
    path('business-claims/', BusinessClaimCreateListView.as_view(), name='business-claims'),
    path('business/dashboard/', BusinessDashboardView.as_view(), name='business-dashboard'),
    path('business/promotions/', PromotionListCreateView.as_view(), name='business-promotions'),
    path('subscription-plans/', SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('subscriptions/inquire/', SubscriptionInquiryView.as_view(), name='subscriptions-inquire'),
    
    # Admin Portal
    path('admin-api/dashboard/', AdminDashboardView.as_view(), name='admin-api-dashboard'),
    path('admin-api/claims/<int:pk>/review/', AdminClaimReviewView.as_view(), name='admin-api-claim-review'),
    path('admin-api/reviews/<int:pk>/moderate/', AdminReviewModerationView.as_view(), name='admin-api-review-moderate'),
    path('admin-api/reports/', AdminReportsListView.as_view(), name='admin-api-reports'),
    path('admin-api/reports/<int:pk>/resolve/', AdminReportResolveView.as_view(), name='admin-api-report-resolve'),
    path('admin-api/import/', AdminCSVImportView.as_view(), name='admin-api-import'),
]

