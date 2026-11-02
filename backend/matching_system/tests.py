import json
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from .models import User, Report, MatchCandidate, Claim, AuditLog
from .embeddings import (
    generate_text_embedding, generate_image_embedding,
    cosine_similarity, _deterministic_text_vector
)
from .matching_engine import (
    haversine_distance_km, compute_location_score, compute_time_score,
    evaluate_pair, find_matches_for_report
)


class EmbeddingAndDistanceTests(TestCase):
    def test_text_embedding_generation_and_cosine_similarity(self):
        text1 = "Black Samsonite laptop bag with scratch near handle at Gate 3"
        text2 = "Lost black laptop bag at Gate 3"
        text3 = "Gold necklace with diamond pendant lost at mall food court"

        vec1 = generate_text_embedding(text1)
        vec2 = generate_text_embedding(text2)
        vec3 = generate_text_embedding(text3)

        self.assertEqual(len(vec1), 384)
        self.assertEqual(len(vec2), 384)
        self.assertEqual(len(vec3), 384)

        # Bag 1 and Bag 2 should have high semantic similarity
        sim_bags = cosine_similarity(vec1, vec2)
        # Bag and Diamond necklace should have low similarity
        sim_diff = cosine_similarity(vec1, vec3)

        self.assertGreater(sim_bags, 0.40)
        self.assertGreater(sim_bags, sim_diff)

    def test_haversine_distance_and_decay(self):
        # Two points in SFO airport ~100 meters apart
        lat1, lon1 = 37.621312, -122.378955
        lat2, lon2 = 37.621320, -122.378940
        d_km = haversine_distance_km(lat1, lon1, lat2, lon2)
        self.assertLess(d_km, 0.05)  # Less than 50 meters

        # Two points far apart (SFO to Berkeley ~30km)
        lat3, lon3 = 37.871853, -122.258423
        d_far = haversine_distance_km(lat1, lon1, lat3, lon3)
        self.assertGreater(d_far, 25.0)

    def test_location_token_scoring(self):
        user = User.objects.create(name="Test User", email="user1@test.com")
        now = timezone.now()

        rep1 = Report.objects.create(
            report_type='LOST', reported_by=user, category='bags',
            title="Lost Bag", description="description",
            location_name="Gate 3, Terminal 2", event_datetime=now
        )
        rep2 = Report.objects.create(
            report_type='FOUND', reported_by=user, category='bags',
            title="Found Bag", description="description",
            location_name="Terminal 2 Gate 3 Seating Area", event_datetime=now
        )
        rep3 = Report.objects.create(
            report_type='FOUND', reported_by=user, category='bags',
            title="Found Bag", description="description",
            location_name="North Parking Lot B", event_datetime=now
        )

        score_matching = compute_location_score(rep1, rep2)
        score_diff = compute_location_score(rep1, rep3)

        self.assertGreaterEqual(score_matching, 0.85)
        self.assertLess(score_diff, 0.20)

    def test_time_decay_scoring(self):
        user = User.objects.create(name="Test User", email="user2@test.com")
        now = timezone.now()

        rep1 = Report.objects.create(
            report_type='LOST', reported_by=user, category='electronics',
            title="Laptop", description="desc", location_name="Gate 1",
            event_datetime=now
        )
        # 2 hours apart
        rep2 = Report.objects.create(
            report_type='FOUND', reported_by=user, category='electronics',
            title="Laptop", description="desc", location_name="Gate 1",
            event_datetime=now - timedelta(hours=2)
        )
        # 20 days apart (>14 days window)
        rep3 = Report.objects.create(
            report_type='FOUND', reported_by=user, category='electronics',
            title="Laptop", description="desc", location_name="Gate 1",
            event_datetime=now - timedelta(days=20)
        )

        time_score_near = compute_time_score(rep1, rep2)
        time_score_far = compute_time_score(rep1, rep3)

        self.assertGreater(time_score_near, 0.95)
        self.assertEqual(time_score_far, 0.0)


class MatchingEngineIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_public = User.objects.create(
            name="Alice Walker", email="alice@test.com", phone="12345", role="public"
        )
        self.user_staff = User.objects.create(
            name="Officer Bob", email="bob@test.com", phone="54321", role="staff"
        )
        self.now = timezone.now()

    def test_intelligent_matching_problem_statement_pair(self):
        """Verify the user's specific problem statement scenario produces a strong match."""
        # Lost report
        lost_rep = Report.objects.create(
            report_type='LOST',
            reported_by=self.user_public,
            category='bags',
            title="Lost black laptop bag at Gate 3",
            description="Lost black laptop bag at Gate 3. 15 inch computer bag left while boarding.",
            location_name="Gate 3, Terminal 2",
            latitude=37.621312,
            longitude=-122.378955,
            event_datetime=self.now - timedelta(hours=2),
            status='OPEN'
        )

        # Found report
        found_rep = Report.objects.create(
            report_type='FOUND',
            reported_by=self.user_public,
            category='bags',
            title="Black Samsonite laptop bag, small scratch near handle, found near Gate 3",
            description="Black Samsonite laptop bag, small scratch near handle, found near Gate 3 charging area.",
            location_name="Near Gate 3 Departure",
            latitude=37.621320,
            longitude=-122.378940,
            event_datetime=self.now - timedelta(hours=1, minutes=45),
            status='OPEN'
        )

        matches = find_matches_for_report(lost_rep)
        self.assertGreaterEqual(len(matches), 1)

        candidate = matches[0]
        self.assertEqual(candidate.lost_report, lost_rep)
        self.assertEqual(candidate.found_report, found_rep)
        # Should be a high-confidence match (>60% text+location+time without image)
        self.assertGreater(candidate.final_confidence_score, 60.0)
        self.assertEqual(candidate.status, 'SUGGESTED')


    def test_negative_control_different_category_does_not_match(self):
        """Cheap pre-filtering must reject items of differing categories."""
        lost_rep = Report.objects.create(
            report_type='LOST', reported_by=self.user_public,
            category='keys', title="Lost car keys", description="Toyota key fob",
            location_name="Parking Garage", event_datetime=self.now
        )
        found_rep = Report.objects.create(
            report_type='FOUND', reported_by=self.user_public,
            category='clothing', title="Found black jacket", description="Winter coat",
            location_name="Parking Garage", event_datetime=self.now
        )

        matches = find_matches_for_report(lost_rep)
        self.assertEqual(len(matches), 0)

    def test_claim_lifecycle_and_audit_logging(self):
        """Test claim submission, staff approval, and audit trail generation."""
        lost_rep = Report.objects.create(
            report_type='LOST', reported_by=self.user_public,
            category='electronics', title="Lost iPad Pro", description="Silver 11 inch iPad",
            location_name="Cafeteria", event_datetime=self.now
        )
        found_rep = Report.objects.create(
            report_type='FOUND', reported_by=self.user_staff,
            category='electronics', title="Found Apple iPad", description="Silver tablet found in dining hall",
            location_name="Cafeteria", event_datetime=self.now
        )

        # Match candidate is automatically created via post_save signals
        match = MatchCandidate.objects.filter(lost_report=lost_rep, found_report=found_rep).first()
        if not match:
            match = MatchCandidate.objects.create(
                lost_report=lost_rep,
                found_report=found_rep,
                text_similarity_score=0.88,
                location_score=1.0,
                time_score=1.0,
                final_confidence_score=92.5,
                status='SUGGESTED'
            )

        # Confirm match via API
        response = self.client.post(f'/api/matches/{match.id}/confirm/', {

            'performed_by': self.user_staff.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        match.refresh_from_db()
        lost_rep.refresh_from_db()
        found_rep.refresh_from_db()
        self.assertEqual(match.status, 'CONFIRMED')
        self.assertEqual(lost_rep.status, 'MATCHED')
        self.assertEqual(found_rep.status, 'MATCHED')

        # Create Claim
        claim_resp = self.client.post('/api/claims/', {
            'match_candidate': match.id,
            'found_report': found_rep.id,
            'claimant': self.user_public.id,
            'verification_notes': "Unlocked device using passcode in front of staff."
        })
        self.assertEqual(claim_resp.status_code, status.HTTP_201_CREATED)
        claim_id = claim_resp.data['id']

        # Approve Claim
        appr_resp = self.client.post(f'/api/claims/{claim_id}/approve/', {
            'performed_by': self.user_staff.id,
            'verification_notes': "Serial number verified with purchase invoice."
        })
        self.assertEqual(appr_resp.status_code, status.HTTP_200_OK)

        claim = Claim.objects.get(id=claim_id)
        lost_rep.refresh_from_db()
        found_rep.refresh_from_db()
        self.assertEqual(claim.status, 'APPROVED')
        self.assertEqual(lost_rep.status, 'CLAIMED')
        self.assertEqual(found_rep.status, 'CLAIMED')

        # Verify audit logs exist
        audit_actions = list(AuditLog.objects.values_list('action', flat=True))
        self.assertIn('MATCH_CONFIRMED', audit_actions)
        self.assertIn('CLAIM_SUBMITTED', audit_actions)
        self.assertIn('CLAIM_APPROVED', audit_actions)

    def test_stats_api(self):
        """Verify dashboard statistics endpoint."""
        response = self.client.get('/api/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn('total_reports', data)
        self.assertIn('match_rate_percent', data)
        self.assertIn('category_breakdown', data)
