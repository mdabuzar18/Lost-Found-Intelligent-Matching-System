import threading
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.db import connection
from .models import Report, AuditLog
from .matching_engine import find_matches_for_report, ensure_report_embeddings

logger = logging.getLogger(__name__)


def _run_matching_in_background(report_id: int):
    """Worker function to compute embeddings and matches."""
    try:
        connection.close()  # Ensure fresh connection in separate thread
        report = Report.objects.get(id=report_id)
        ensure_report_embeddings(report)
        find_matches_for_report(report)
    except Exception as e:
        logger.error(f"Error matching report {report_id}: {e}")
    finally:
        connection.close()


@receiver(post_save, sender=Report)
def on_report_saved(sender, instance, created, **kwargs):
    """Trigger intelligent matching when a Report is created or updated."""
    # Only match if report is OPEN
    if instance.status != 'OPEN':
        return

    # Log creation audit event
    if created:
        AuditLog.objects.create(
            action='REPORT_CREATED',
            performed_by=instance.reported_by,
            report_reference=instance,
            details={
                'report_type': instance.report_type,
                'category': instance.category,
                'title': instance.title,
                'location': instance.location_name,
                'event_datetime': instance.event_datetime.isoformat() if instance.event_datetime else None,
            }
        )

    # In automated test mode, execute synchronously to avoid SQLite concurrency locks
    if getattr(settings, 'TESTING', False):
        try:
            report = Report.objects.get(id=instance.id)
            ensure_report_embeddings(report)
            find_matches_for_report(report)
        except Exception as e:
            logger.error(f"Error matching report {instance.id}: {e}")
    else:
        # Spawn background matching worker thread
        thread = threading.Thread(
            target=_run_matching_in_background,
            args=(instance.id,),
            daemon=True
        )
        thread.start()

