from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import health_check, root_view, api_v1_root_view

urlpatterns = [
    # Root service endpoint (resolves Render log: GET / 404)
    path('', root_view, name='service-root'),

    # Health checks for Render, monitors, and load balancers
    path('healthz/', health_check, name='healthz'),
    path('health/', health_check, name='health'),

    path('django-admin/', admin.site.urls),
    
    # API v1 root endpoint (resolves Render log: GET /api/v1 404)
    re_path(r'^api/v1/?$', api_v1_root_view, name='api-v1-root'),

    # Versioned REST API v1
    path('api/v1/', include('core.urls')),
    path('api/v1/', include('cafes.urls')),
    path('api/v1/', include('reviews.urls')),
    path('api/v1/', include('business.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
