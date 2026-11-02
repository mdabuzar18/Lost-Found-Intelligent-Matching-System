import math
import logging
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from .models import Report, MatchCandidate, AuditLog
from .embeddings import cosine_similarity, generate_text_embedding, generate_image_embedding

logger = logging.getLogger(__name__)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in kilometers."""
    r = 6371.0  # Earth's radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def compute_location_score(rep1: Report, rep2: Report) -> float:
    """
    Calculate location proximity score:
    - If lat/long present on both: decaying function max(0, 1 - distance_km / max_km)
    - If location_name strings match or contain common keywords: text token matching
    Returns score between 0.0 and 1.0.
    """
    geo_score = 0.0
    has_coords = (rep1.latitude is not None and rep1.longitude is not None and
                  rep2.latitude is not None and rep2.longitude is not None)

    max_geo_km = getattr(settings, 'MATCH_GEO_MAX_KM', 5.0)

    if has_coords:
        try:
            d_km = haversine_distance_km(
                float(rep1.latitude), float(rep1.longitude),
                float(rep2.latitude), float(rep2.longitude)
            )
            geo_score = max(0.0, 1.0 - (d_km / max_geo_km))
        except Exception as e:
            logger.warning(f"Error computing haversine distance: {e}")
            geo_score = 0.0

    # Text keyword / token location match
    loc1 = (rep1.location_name or '').lower().strip()
    loc2 = (rep2.location_name or '').lower().strip()

    text_loc_score = 0.0
    if loc1 and loc2:
        if loc1 == loc2:
            text_loc_score = 1.0
        elif loc1 in loc2 or loc2 in loc1:
            text_loc_score = 0.90
        else:
            import re
            words1 = set(re.findall(r'\b[a-z0-9]+\b', loc1))
            words2 = set(re.findall(r'\b[a-z0-9]+\b', loc2))
            
            # Remove very generic spatial prepositions
            generic = {'near', 'at', 'in', 'on', 'the', 'by', 'of', 'and'}
            tokens1 = words1 - generic
            tokens2 = words2 - generic

            if tokens1 and tokens2:
                intersection = tokens1.intersection(tokens2)
                if intersection:
                    # Token overlap ratio relative to smaller set
                    ratio = len(intersection) / max(1, min(len(tokens1), len(tokens2)))
                    text_loc_score = max(text_loc_score, ratio)
                    
                    # Boost if exact gate / terminal / room numbers match
                    digits1 = {w for w in tokens1 if any(c.isdigit() for c in w)}
                    digits2 = {w for w in tokens2 if any(c.isdigit() for c in w)}
                    if digits1 and digits2 and digits1.intersection(digits2):
                        text_loc_score = max(text_loc_score, 0.90)


    # Return the strongest available location signal
    return max(geo_score, text_loc_score)


def compute_time_score(rep1: Report, rep2: Report) -> float:
    """
    Decaying function of time difference between lost and found event datetimes:
    score = max(0, 1 - days_apart / window_days)
    """
    window_days = float(getattr(settings, 'MATCH_TIME_WINDOW_DAYS', 14))
    if not rep1.event_datetime or not rep2.event_datetime:
        return 0.5  # Neutral fallback

    delta = abs((rep1.event_datetime - rep2.event_datetime).total_seconds())
    days_apart = delta / 86400.0
    return max(0.0, 1.0 - (days_apart / window_days))


def ensure_report_embeddings(report: Report):
    """Ensure report has text and image embeddings populated."""
    updated = False

    if not report.text_embedding:
        full_text = f"{report.title}. {report.description}"
        report.text_embedding = generate_text_embedding(full_text)
        updated = True

    if report.image and not report.image_embedding:
        try:
            report.image_embedding = generate_image_embedding(report.image)
            updated = True
        except Exception as e:
            logger.warning(f"Could not compute image embedding for report {report.id}: {e}")

    if updated:
        report.save(update_fields=['text_embedding', 'image_embedding'])


def evaluate_pair(lost_rep: Report, found_rep: Report) -> dict:
    """
    Evaluate similarity between a lost report and a found report.
    Returns dictionary with sub-scores and final confidence score (0-100).
    """
    ensure_report_embeddings(lost_rep)
    ensure_report_embeddings(found_rep)

    # 1. Text similarity
    text_sim = cosine_similarity(lost_rep.text_embedding, found_rep.text_embedding)

    # 2. Image similarity
    has_both_images = bool(lost_rep.image_embedding and found_rep.image_embedding)
    image_sim = None
    if has_both_images:
        image_sim = cosine_similarity(lost_rep.image_embedding, found_rep.image_embedding)

    # 3. Location score
    loc_score = compute_location_score(lost_rep, found_rep)

    # 4. Time score
    time_score = compute_time_score(lost_rep, found_rep)

    # 5. Aggregate weighted confidence score
    if image_sim is not None:
        weights = getattr(settings, 'MATCH_WEIGHTS_WITH_IMAGE', {
            'text': 0.35, 'image': 0.35, 'location': 0.15, 'time': 0.15
        })
        aggregate = (
            weights['text'] * text_sim +
            weights['image'] * image_sim +
            weights['location'] * loc_score +
            weights['time'] * time_score
        )
    else:
        weights = getattr(settings, 'MATCH_WEIGHTS_WITHOUT_IMAGE', {
            'text': 0.60, 'location': 0.20, 'time': 0.20
        })
        aggregate = (
            weights['text'] * text_sim +
            weights['location'] * loc_score +
            weights['time'] * time_score
        )

    final_confidence = round(max(0.0, min(100.0, aggregate * 100.0)), 1)

    return {
        'text_similarity': round(text_sim, 4),
        'image_similarity': round(image_sim, 4) if image_sim is not None else None,
        'location_score': round(loc_score, 4),
        'time_score': round(time_score, 4),
        'final_confidence': final_confidence,
    }


def find_matches_for_report(report: Report) -> list[MatchCandidate]:
    """
    Executes matching pipeline for a single report:
    1. Fetch candidates of opposite type with status OPEN
    2. Cheap pre-filtering (same category, event_datetime within ±window)
    3. Compute 4 sub-scores and final confidence
    4. Persist MatchCandidate if threshold met
    """
    ensure_report_embeddings(report)

    opposite_type = 'FOUND' if report.report_type == 'LOST' else 'LOST'
    window_days = getattr(settings, 'MATCH_TIME_WINDOW_DAYS', 14)
    min_threshold = getattr(settings, 'MATCH_MIN_CONFIDENCE_THRESHOLD', 35.0)

    # 1 & 2. Cheap pre-filtering: Opposite type, OPEN status, same category, datetime window
    time_min = report.event_datetime - timedelta(days=window_days)
    time_max = report.event_datetime + timedelta(days=window_days)

    candidates_qs = Report.objects.filter(
        report_type=opposite_type,
        status='OPEN',
        category=report.category,
        event_datetime__range=(time_min, time_max)
    ).exclude(id=report.id)

    matches_generated = []

    for candidate in candidates_qs:
        lost_rep = report if report.report_type == 'LOST' else candidate
        found_rep = candidate if report.report_type == 'LOST' else report

        scores = evaluate_pair(lost_rep, found_rep)

        if scores['final_confidence'] >= min_threshold:
            match_obj, created = MatchCandidate.objects.update_or_create(
                lost_report=lost_rep,
                found_report=found_rep,
                defaults={
                    'text_similarity_score': scores['text_similarity'],
                    'image_similarity_score': scores['image_similarity'],
                    'location_score': scores['location_score'],
                    'time_score': scores['time_score'],
                    'final_confidence_score': scores['final_confidence'],
                    'status': 'SUGGESTED',
                }
            )

            # Record audit log
            AuditLog.objects.create(
                action='MATCH_SUGGESTED' if created else 'MATCH_UPDATED',
                report_reference=report,
                match_reference=match_obj,
                details={
                    'lost_title': lost_rep.title,
                    'found_title': found_rep.title,
                    'confidence': scores['final_confidence'],
                    'text_sim': scores['text_similarity'],
                    'image_sim': scores['image_similarity'],
                    'loc_score': scores['location_score'],
                    'time_score': scores['time_score'],
                }
            )

            matches_generated.append(match_obj)

    logger.info(f"Processed report {report.id} ({report.title}): Found {len(matches_generated)} matches.")
    return matches_generated
