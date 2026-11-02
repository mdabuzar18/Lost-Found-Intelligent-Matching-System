from django.core.management.base import BaseCommand
from matching_system.models import Report, MatchCandidate
from matching_system.matching_engine import find_matches_for_report, ensure_report_embeddings


class Command(BaseCommand):
    help = "Runs multi-modal matching engine across all open reports"

    def handle(self, *args, **options):
        self.stdout.write("Running batch matching job across all open reports...")
        open_lost = Report.objects.filter(report_type='LOST', status='OPEN')
        total_matches = 0

        for rep in open_lost:
            ensure_report_embeddings(rep)
            matches = find_matches_for_report(rep)
            total_matches += len(matches)
            self.stdout.write(f"  Report #{rep.id} ({rep.title[:40]}): {len(matches)} matches")

        self.stdout.write(self.style.SUCCESS(
            f"Finished. Total active suggested matches in database: {MatchCandidate.objects.filter(status='SUGGESTED').count()}"
        ))
