import os
from io import BytesIO
from datetime import timedelta
from PIL import Image, ImageDraw
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils import timezone

from matching_system.models import User, Report, MatchCandidate, Claim, AuditLog
from matching_system.embeddings import generate_text_embedding, generate_image_embedding
from matching_system.matching_engine import find_matches_for_report


def create_placeholder_image(color=(40, 40, 40), text_color=(240, 240, 240), label="Item"):
    """Create a clean 256x256 placeholder image with visual tones and shapes."""
    img = Image.new('RGB', (256, 256), color=color)
    draw = ImageDraw.Draw(img)
    
    # Draw geometric object shape to give distinctive visual features for CLIP/perceptual vectorizer
    draw.rectangle([40, 50, 216, 206], outline=text_color, width=4)
    draw.ellipse([80, 80, 176, 176], fill=text_color)
    draw.rectangle([110, 30, 146, 50], fill=text_color)  # handle
    
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=90)
    buf.seek(0)
    return ContentFile(buf.getvalue(), name=f"{label.lower().replace(' ', '_')}.jpg")


class Command(BaseCommand):
    help = "Seeds database with realistic lost and found scenarios and computes intelligent matches"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Lost & Found Intelligent Matching System data...")

        # 1. Clear existing seed data if any
        AuditLog.objects.all().delete()
        Claim.objects.all().delete()
        MatchCandidate.objects.all().delete()
        Report.objects.all().delete()
        User.objects.all().delete()

        # 2. Create Users (Staff and Public)
        staff_alex = User.objects.create(
            name="Alex Rivera (Airport Staff)",
            email="alex.rivera@airport-security.org",
            phone="+1-555-0192",
            role="staff"
        )
        staff_sarah = User.objects.create(
            name="Officer Sarah Chen",
            email="sarah.chen@transit-police.gov",
            phone="+1-555-0144",
            role="staff"
        )
        user_john = User.objects.create(
            name="John Doe (Passenger)",
            email="john.doe@gmail.com",
            phone="+1-555-4821",
            role="public"
        )
        user_emily = User.objects.create(
            name="Emily Watson (Student)",
            email="emily.watson@university.edu",
            phone="+1-555-7391",
            role="public"
        )
        user_marcus = User.objects.create(
            name="Marcus Vance (Visitor)",
            email="marcus.v@outlook.com",
            phone="+1-555-9032",
            role="public"
        )
        user_finder = User.objects.create(
            name="David Kim (Terminal Good Samaritan)",
            email="david.kim@techtravel.co",
            phone="+1-555-6120",
            role="public"
        )

        now = timezone.now()

        # 3. Create Reports
        reports_data = [
            # SCENARIO 1: The Classic Problem Statement Pair (Bags / Airport Gate 3)
            {
                'report_type': 'LOST',
                'reported_by': user_john,
                'category': 'bags',
                'title': "Lost black laptop bag at Gate 3",
                'description': "Lost black laptop bag at Gate 3. It is a 15-inch dark computer bag left in the departure lounge seating rows while charging my phone.",
                'location_name': "Gate 3, Terminal 2",
                'latitude': 37.621312,
                'longitude': -122.378955,
                'event_datetime': now - timedelta(hours=3),
                'color': (25, 25, 30),
                'label': "black_laptop_bag_lost",
            },
            {
                'report_type': 'FOUND',
                'reported_by': user_finder,
                'category': 'bags',
                'title': "Black Samsonite laptop bag, small scratch near handle, found near Gate 3",
                'description': "Found black Samsonite laptop bag, small scratch near handle, found near Gate 3 charging column under seat row 14.",
                'location_name': "Gate 3 Departure Area",
                'latitude': 37.621320,
                'longitude': -122.378940,
                'event_datetime': now - timedelta(hours=2, minutes=45),
                'color': (30, 30, 35),
                'label': "samsonite_bag_found",
            },

            # SCENARIO 2: University / Campus Electronics
            {
                'report_type': 'LOST',
                'reported_by': user_emily,
                'category': 'electronics',
                'title': "Silver Apple MacBook Air 13 in dark grey felt sleeve",
                'description': "Left my silver MacBook Air M2 inside a dark charcoal grey felt protective sleeve on a study desk on 2nd floor library.",
                'location_name': "Central Library 2nd Floor Study Hall",
                'latitude': 37.871853,
                'longitude': -122.258423,
                'event_datetime': now - timedelta(days=1, hours=4),
                'color': (180, 185, 190),
                'label': "macbook_silver_lost",
            },
            {
                'report_type': 'FOUND',
                'reported_by': staff_sarah,
                'category': 'electronics',
                'title': "Apple laptop in grey protective case recovered in study hall",
                'description': "Custodian handed in a silver Apple laptop inside a charcoal felt zippered sleeve found unattended on second floor library reading carrel.",
                'location_name': "Main Campus Library Floor 2",
                'latitude': 37.871860,
                'longitude': -122.258410,
                'event_datetime': now - timedelta(days=1, hours=3),
                'color': (175, 180, 185),
                'label': "apple_laptop_found",
            },

            # SCENARIO 3: Venue / Mall Jewelry & Accessories
            {
                'report_type': 'LOST',
                'reported_by': user_marcus,
                'category': 'jewelry',
                'title': "Rose gold Michael Kors ladies watch",
                'description': "Rose gold stainless steel watch with crystal pavé bezel and Roman numerals, slipped off my wrist near the mall food court washrooms.",
                'location_name': "Grand Mall Food Court Restrooms",
                'latitude': 37.774929,
                'longitude': -122.419416,
                'event_datetime': now - timedelta(days=2),
                'color': (212, 175, 55),
                'label': "gold_watch_lost",
            },
            {
                'report_type': 'FOUND',
                'reported_by': staff_alex,
                'category': 'jewelry',
                'title': "Ladies rose gold wristwatch with crystals found near food court",
                'description': "Found shiny rose gold watch with sparkling stones around the face on the bathroom counter adjacent to the food court.",
                'location_name': "Food Court Level 2 Restroom",
                'latitude': 37.774940,
                'longitude': -122.419400,
                'event_datetime': now - timedelta(days=2, minutes=30),
                'color': (215, 170, 50),
                'label': "rose_gold_watch_found",
            },

            # SCENARIO 4: Travel Documents / Passports
            {
                'report_type': 'LOST',
                'reported_by': user_john,
                'category': 'documents',
                'title': "Navy blue passport wallet with international tickets",
                'description': "Dark blue leather travel wallet containing passport, boarding card, and emergency cash, left during security screening.",
                'location_name': "Terminal 2 Security Checkpoint",
                'latitude': 37.620000,
                'longitude': -122.380000,
                'event_datetime': now - timedelta(hours=6),
                'color': (20, 35, 75),
                'label': "passport_wallet_lost",
            },
            {
                'report_type': 'FOUND',
                'reported_by': staff_alex,
                'category': 'documents',
                'title': "Blue leather passport case discovered at security tray",
                'description': "Unclaimed blue passport organizer tray item with travel documents found at security checkpoint scanner line.",
                'location_name': "T2 Security Inspection Area",
                'latitude': 37.620020,
                'longitude': -122.380010,
                'event_datetime': now - timedelta(hours=5, minutes=40),
                'color': (25, 40, 80),
                'label': "blue_passport_found",
            },

            # NEGATIVE CONTROL: Keys (Different locations, different descriptions -> Should NOT match)
            {
                'report_type': 'LOST',
                'reported_by': user_marcus,
                'category': 'keys',
                'title': "Set of 5 house keys with red Ferrari keychain",
                'description': "Ring of brass house keys with a distinctive red enameled Ferrari badge keychain lost in parking lot B.",
                'location_name': "North Parking Garage Level 3",
                'latitude': 37.630000,
                'longitude': -122.390000,
                'event_datetime': now - timedelta(days=5),
                'color': (180, 30, 30),
                'label': "ferrari_keys_lost",
            },
            {
                'report_type': 'FOUND',
                'reported_by': staff_sarah,
                'category': 'keys',
                'title': "Single silver bicycle U-lock key on black lanyard",
                'description': "One small silver master lock key attached to a black fabric lanyard found near bicycle racks outside entrance.",
                'location_name': "South Terminal Bike Parking",
                'latitude': 37.610000,
                'longitude': -122.370000,
                'event_datetime': now - timedelta(days=1),
                'color': (80, 80, 80),
                'label': "bike_key_found",
            },
        ]

        created_reports = []
        for item in reports_data:
            rep = Report(
                report_type=item['report_type'],
                reported_by=item['reported_by'],
                category=item['category'],
                title=item['title'],
                description=item['description'],
                location_name=item['location_name'],
                latitude=item['latitude'],
                longitude=item['longitude'],
                event_datetime=item['event_datetime'],
                status='OPEN',
            )
            # Create sample image
            img_file = create_placeholder_image(color=item['color'], label=item['label'])
            rep.image.save(f"{item['label']}.jpg", img_file, save=False)

            # Compute embeddings
            full_text = f"{rep.title}. {rep.description}"
            rep.text_embedding = generate_text_embedding(full_text)
            rep.image_embedding = generate_image_embedding(rep.image)
            rep.save()
            created_reports.append(rep)
            self.stdout.write(f"  Created [{rep.report_type}] {rep.title}")

        # 4. Run matching engine across all reports
        self.stdout.write("Running multi-modal matching engine...")
        total_matches = 0
        for rep in created_reports:
            if rep.report_type == 'LOST':
                matches = find_matches_for_report(rep)
                total_matches += len(matches)

        # 5. Create a sample Claim on one of the matched items to demonstrate claim workflow
        samsonite_match = MatchCandidate.objects.filter(
            lost_report__title__icontains="laptop bag",
            found_report__title__icontains="Samsonite"
        ).first()

        if samsonite_match:
            claim = Claim.objects.create(
                match_candidate=samsonite_match,
                found_report=samsonite_match.found_report,
                claimant=user_john,
                verification_notes="Claimant provided serial number matching laptop inside bag, and demonstrated the unique scratch near top handle from bike rack friction.",
                status="PENDING"
            )
            AuditLog.objects.create(
                action="CLAIM_SUBMITTED",
                performed_by=user_john,
                claim_reference=claim,
                report_reference=samsonite_match.found_report,
                details={'match_id': samsonite_match.id, 'notes': claim.verification_notes}
            )
            self.stdout.write(f"  Created demo pending Claim #{claim.id} for Samsonite laptop bag")

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded {len(created_reports)} reports, {MatchCandidate.objects.count()} match candidates, and {Claim.objects.count()} claims!"
        ))
