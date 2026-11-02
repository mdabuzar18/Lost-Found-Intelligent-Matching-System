from rest_framework import serializers
from .models import User, Report, MatchCandidate, Claim, AuditLog


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone', 'role', 'created_at']


class ReportListSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.CharField(source='reported_by.name', read_only=True)
    has_image = serializers.SerializerMethodField()
    has_embeddings = serializers.SerializerMethodField()
    matches_count = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'reported_by', 'reported_by_name',
            'category', 'title', 'description', 'image', 'has_image',
            'has_embeddings', 'location_name', 'latitude', 'longitude',
            'event_datetime', 'status', 'matches_count', 'created_at', 'updated_at'
        ]

    def get_has_image(self, obj) -> bool:
        return bool(obj.image)

    def get_has_embeddings(self, obj) -> bool:
        return bool(obj.text_embedding is not None)

    def get_matches_count(self, obj) -> int:
        if obj.report_type == 'LOST':
            return obj.lost_matches.filter(status='SUGGESTED').count()
        else:
            return obj.found_matches.filter(status='SUGGESTED').count()


class ReportDetailSerializer(serializers.ModelSerializer):
    reported_by_detail = UserSerializer(source='reported_by', read_only=True)
    matches_count = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'reported_by', 'reported_by_detail',
            'category', 'title', 'description', 'image',
            'location_name', 'latitude', 'longitude',
            'event_datetime', 'status', 'matches_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_matches_count(self, obj) -> int:
        if obj.report_type == 'LOST':
            return obj.lost_matches.filter(status='SUGGESTED').count()
        else:
            return obj.found_matches.filter(status='SUGGESTED').count()


class MatchCandidateSerializer(serializers.ModelSerializer):
    lost_report = ReportListSerializer(read_only=True)
    found_report = ReportListSerializer(read_only=True)
    lost_report_id = serializers.PrimaryKeyRelatedField(
        queryset=Report.objects.all(), source='lost_report', write_only=True
    )
    found_report_id = serializers.PrimaryKeyRelatedField(
        queryset=Report.objects.all(), source='found_report', write_only=True
    )

    class Meta:
        model = MatchCandidate
        fields = [
            'id', 'lost_report', 'found_report', 'lost_report_id', 'found_report_id',
            'image_similarity_score', 'text_similarity_score',
            'location_score', 'time_score', 'final_confidence_score',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ClaimSerializer(serializers.ModelSerializer):
    found_report_detail = ReportListSerializer(source='found_report', read_only=True)
    claimant_detail = UserSerializer(source='claimant', read_only=True)
    match_candidate_detail = MatchCandidateSerializer(source='match_candidate', read_only=True)

    class Meta:
        model = Claim
        fields = [
            'id', 'match_candidate', 'match_candidate_detail',
            'found_report', 'found_report_detail',
            'claimant', 'claimant_detail',
            'verification_notes', 'status',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at', 'resolved_at']


class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'performed_by', 'performed_by_name',
            'report_reference', 'match_reference', 'claim_reference',
            'details', 'timestamp'
        ]
