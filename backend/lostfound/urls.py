from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import HttpResponse

frontend_dist = settings.BASE_DIR.parent / 'frontend' / 'dist'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('matching_system.urls')),
]

if frontend_dist.exists():
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': frontend_dist / 'assets'}),
        path('', TemplateView.as_view(template_name='index.html'), name='frontend-root'),
    ]
else:
    urlpatterns += [
        path('', lambda request: HttpResponse("Lost & Found API is running. Build frontend with 'cd frontend && npm run build'."), name='root-fallback'),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

