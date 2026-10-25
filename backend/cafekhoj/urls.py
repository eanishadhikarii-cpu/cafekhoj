from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import health_check

urlpatterns = [
    # Health checks for Render, monitors, and load balancers
    path('healthz/', health_check, name='healthz'),
    path('health/', health_check, name='health'),

    path('django-admin/', admin.site.urls),
    
    # Versioned REST API v1
    path('api/v1/', include('core.urls')),
    path('api/v1/', include('cafes.urls')),
    path('api/v1/', include('reviews.urls')),
    path('api/v1/', include('business.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
