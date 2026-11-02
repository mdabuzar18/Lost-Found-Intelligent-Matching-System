from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count

from .models import User, Report, MatchCandidate, Claim, AuditLog
from .serializers import (
    UserSerializer, ReportListSerializer, ReportDetailSerializer,
    MatchCandidateSerializer, ClaimSerializer, AuditLogSerializer
)
from .matching_engine import find_matches_for_report, ensure_report_embeddings


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return ReportDetailSerializer
        return ReportListSerializer

    def get_queryset(self):
        qs = Report.objects.select_related('reported_by').all()
        report_type = self.request.query_params.get('report_type')
        category = self.request.query_params.get('category')
        rep_status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if report_type:
            qs = qs.filter(report_type=report_type.upper())
        if category:
            qs = qs.filter(category=category)
        if rep_status:
            qs = qs.filter(status=rep_status.upper())
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location_name__icontains=search)
            )
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        report = serializer.save()
        ensure_report_embeddings(report)
        find_matches_for_report(report)

    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        report = self.get_object()
        if report.report_type == 'LOST':
            matches = report.lost_matches.select_related('found_report', 'lost_report').all()
        else:
            matches = report.found_matches.select_related('lost_report', 'found_report').all()

        serializer = MatchCandidateSerializer(matches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def trigger_match(self, request, pk=None):
        report = self.get_object()
        ensure_report_embeddings(report)
        matches = find_matches_for_report(report)
        serializer = MatchCandidateSerializer(matches, many=True)
        return Response({
            'status': 'Matching completed',
            'matches_found': len(matches),
            'matches': serializer.data
        })


class MatchCandidateViewSet(viewsets.ModelViewSet):
    queryset = MatchCandidate.objects.select_related(
        'lost_report', 'found_report', 'lost_report__reported_by', 'found_report__reported_by'
    ).all().order_by('-final_confidence_score', '-created_at')
    serializer_class = MatchCandidateSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        min_score = self.request.query_params.get('min_score')

        if status_param:
            qs = qs.filter(status=status_param.upper())
        if min_score:
            try:
                qs = qs.filter(final_confidence_score__gte=float(min_score))
            except ValueError:
                pass
        return qs

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        match = self.get_object()
        user_id = request.data.get('performed_by')
        staff_user = User.objects.filter(id=user_id).first() if user_id else None

        match.status = 'CONFIRMED'
        match.save(update_fields=['status'])

        # Update reports status
        match.lost_report.status = 'MATCHED'
        match.lost_report.save(update_fields=['status'])
        match.found_report.status = 'MATCHED'
        match.found_report.save(update_fields=['status'])

        AuditLog.objects.create(
            action='MATCH_CONFIRMED',
            performed_by=staff_user,
            match_reference=match,
            report_reference=match.found_report,
            details={
                'lost_id': match.lost_report.id,
                'found_id': match.found_report.id,
                'confidence': match.final_confidence_score
            }
        )

        return Response({'status': 'Match confirmed', 'match': MatchCandidateSerializer(match).data})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        match = self.get_object()
        user_id = request.data.get('performed_by')
        staff_user = User.objects.filter(id=user_id).first() if user_id else None

        match.status = 'REJECTED'
        match.save(update_fields=['status'])

        AuditLog.objects.create(
            action='MATCH_REJECTED',
            performed_by=staff_user,
            match_reference=match,
            report_reference=match.found_report,
            details={'reason': request.data.get('reason', 'Rejected by staff')}
        )

        return Response({'status': 'Match rejected', 'match': MatchCandidateSerializer(match).data})


class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.select_related(
        'found_report', 'claimant', 'match_candidate'
    ).all().order_by('-created_at')
    serializer_class = ClaimSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        claim_status = self.request.query_params.get('status')
        if claim_status:
            qs = qs.filter(status=claim_status.upper())
        return qs

    def perform_create(self, serializer):
        claim = serializer.save()
        AuditLog.objects.create(
            action='CLAIM_SUBMITTED',
            performed_by=claim.claimant,
            claim_reference=claim,
            report_reference=claim.found_report,
            details={'verification_notes': claim.verification_notes}
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        claim = self.get_object()
        user_id = request.data.get('performed_by')
        staff_user = User.objects.filter(id=user_id).first() if user_id else None
        notes = request.data.get('verification_notes')

        claim.status = 'APPROVED'
        claim.resolved_at = timezone.now()
        if notes:
            claim.verification_notes = f"{claim.verification_notes}\n[Resolution]: {notes}"
        claim.save(update_fields=['status', 'resolved_at', 'verification_notes'])

        # Update associated reports
        found_rep = claim.found_report
        found_rep.status = 'CLAIMED'
        found_rep.save(update_fields=['status'])

        if claim.match_candidate and claim.match_candidate.lost_report:
            lost_rep = claim.match_candidate.lost_report
            lost_rep.status = 'CLAIMED'
            lost_rep.save(update_fields=['status'])

        AuditLog.objects.create(
            action='CLAIM_APPROVED',
            performed_by=staff_user,
            claim_reference=claim,
            report_reference=found_rep,
            details={'notes': notes}
        )

        return Response({'status': 'Claim approved and items marked as CLAIMED', 'claim': ClaimSerializer(claim).data})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        claim = self.get_object()
        user_id = request.data.get('performed_by')
        staff_user = User.objects.filter(id=user_id).first() if user_id else None
        reason = request.data.get('reason', 'Verification details did not match.')

        claim.status = 'REJECTED'
        claim.resolved_at = timezone.now()
        claim.verification_notes = f"{claim.verification_notes}\n[Rejection reason]: {reason}"
        claim.save(update_fields=['status', 'resolved_at', 'verification_notes'])

        AuditLog.objects.create(
            action='CLAIM_REJECTED',
            performed_by=staff_user,
            claim_reference=claim,
            report_reference=claim.found_report,
            details={'reason': reason}
        )

        return Response({'status': 'Claim rejected', 'claim': ClaimSerializer(claim).data})


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('performed_by').all().order_by('-timestamp')
    serializer_class = AuditLogSerializer


class StatsView(APIView):
    """System overview statistics for dashboards and Viva/demonstrations."""
    def get(self, request):
        total_reports = Report.objects.count()
        lost_reports = Report.objects.filter(report_type='LOST').count()
        found_reports = Report.objects.filter(report_type='FOUND').count()
        open_reports = Report.objects.filter(status='OPEN').count()
        matched_reports = Report.objects.filter(status='MATCHED').count()
        claimed_reports = Report.objects.filter(status='CLAIMED').count()

        total_matches = MatchCandidate.objects.count()
        suggested_matches = MatchCandidate.objects.filter(status='SUGGESTED').count()
        confirmed_matches = MatchCandidate.objects.filter(status='CONFIRMED').count()

        total_claims = Claim.objects.count()
        pending_claims = Claim.objects.filter(status='PENDING').count()
        approved_claims = Claim.objects.filter(status='APPROVED').count()

        # Category breakdown
        category_counts = list(
            Report.objects.values('category').annotate(count=Count('id')).order_by('-count')
        )

        resolved_count = matched_reports + claimed_reports
        match_rate = round((resolved_count / total_reports * 100.0), 1) if total_reports > 0 else 0.0

        return Response({
            'total_reports': total_reports,
            'lost_reports': lost_reports,
            'found_reports': found_reports,
            'open_reports': open_reports,
            'matched_reports': matched_reports,
            'claimed_reports': claimed_reports,
            'match_rate_percent': match_rate,
            'total_matches': total_matches,
            'suggested_matches': suggested_matches,
            'confirmed_matches': confirmed_matches,
            'total_claims': total_claims,
            'pending_claims': pending_claims,
            'approved_claims': approved_claims,
            'category_breakdown': category_counts,
        })
