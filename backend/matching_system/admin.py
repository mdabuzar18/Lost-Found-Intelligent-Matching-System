from django.contrib import admin
from .models import User, Report, MatchCandidate, Claim, AuditLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'phone', 'role', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('name', 'email', 'phone')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'report_type', 'title', 'category', 'location_name', 'status', 'event_datetime', 'created_at')
    list_filter = ('report_type', 'category', 'status', 'event_datetime')
    search_fields = ('title', 'description', 'location_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(MatchCandidate)
class MatchCandidateAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'lost_report', 'found_report', 'final_confidence_score',
        'text_similarity_score', 'image_similarity_score', 'location_score', 'time_score',
        'status', 'created_at'
    )
    list_filter = ('status', 'created_at')
    search_fields = ('lost_report__title', 'found_report__title')


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ('id', 'found_report', 'claimant', 'status', 'created_at', 'resolved_at')
    list_filter = ('status', 'created_at')
    search_fields = ('found_report__title', 'claimant__name', 'verification_notes')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'action', 'performed_by', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('action', 'performed_by__name', 'performed_by__email')
    readonly_fields = ('action', 'performed_by', 'report_reference', 'match_reference', 'claim_reference', 'details', 'timestamp')
