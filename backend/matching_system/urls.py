from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ReportViewSet, MatchCandidateViewSet,
    ClaimViewSet, AuditLogViewSet, StatsView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'matches', MatchCandidateViewSet, basename='match')
router.register(r'claims', ClaimViewSet, basename='claim')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('stats/', StatsView.as_view(), name='system-stats'),
    path('', include(router.urls)),
]
