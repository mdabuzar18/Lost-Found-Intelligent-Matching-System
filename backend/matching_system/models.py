from django.db import models
from django.utils import timezone


class User(models.Model):
    ROLE_CHOICES = [
        ('staff', 'Staff / Administrator'),
        ('public', 'Public User'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='public')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.email}"


class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('LOST', 'Lost Item'),
        ('FOUND', 'Found Item'),
    ]

    CATEGORY_CHOICES = [
        ('electronics', 'Electronics & Gadgets'),
        ('bags', 'Bags, Backpacks & Luggage'),
        ('documents', 'Wallets, IDs & Documents'),
        ('jewelry', 'Jewelry & Watches'),
        ('keys', 'Keys & Access Cards'),
        ('clothing', 'Clothing & Footwear'),
        ('other', 'Other Items'),
    ]

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('MATCHED', 'Matched'),
        ('CLAIMED', 'Claimed'),
        ('CLOSED', 'Closed'),
    ]

    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES)
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='report_images/', null=True, blank=True)
    
    # Store vector embeddings as float arrays (compatible with SQLite JSON and Postgres JSON/pgvector)
    image_embedding = models.JSONField(null=True, blank=True, help_text="Normalized CLIP 512-dim embedding")
    text_embedding = models.JSONField(null=True, blank=True, help_text="Normalized Sentence-BERT 384-dim embedding")

    location_name = models.CharField(max_length=255, help_text="Descriptive location name, e.g. Gate 3, T2 Security Checkpoint")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    event_datetime = models.DateTimeField(help_text="Estimated date and time the item was lost or found")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'status']),
            models.Index(fields=['location_name']),
            models.Index(fields=['event_datetime']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"[{self.report_type}] {self.title} ({self.location_name}) - {self.status}"


class MatchCandidate(models.Model):
    STATUS_CHOICES = [
        ('SUGGESTED', 'Suggested Match'),
        ('CONFIRMED', 'Confirmed Match'),
        ('REJECTED', 'Rejected Match'),
    ]

    lost_report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='lost_matches')
    found_report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='found_matches')

    image_similarity_score = models.FloatField(null=True, blank=True, help_text="0.0 to 1.0 (null if either lacks photo)")
    text_similarity_score = models.FloatField(default=0.0, help_text="0.0 to 1.0 Sentence-BERT cosine similarity")
    location_score = models.FloatField(default=0.0, help_text="0.0 to 1.0 Haversine or token proximity score")
    time_score = models.FloatField(default=0.0, help_text="0.0 to 1.0 Temporal decay proximity score")
    final_confidence_score = models.FloatField(default=0.0, help_text="0.0 to 100.0 aggregate confidence percentage")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUGGESTED')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-final_confidence_score', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['lost_report', 'found_report'], name='unique_lost_found_match_candidate')
        ]

    def __str__(self):
        return f"Match #{self.id}: Lost '{self.lost_report.title}' <-> Found '{self.found_report.title}' ({self.final_confidence_score}%)"


class Claim(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('APPROVED', 'Approved & Handed Over'),
        ('REJECTED', 'Rejected'),
    ]

    match_candidate = models.ForeignKey(MatchCandidate, on_delete=models.SET_NULL, null=True, blank=True, related_name='claims')
    found_report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='claims')
    claimant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='claims')
    verification_notes = models.TextField(help_text="Staff notes on how ownership was proven (serial #, receipt, unlock code, distinctive marks)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Claim #{self.id} on Report #{self.found_report_id} by {self.claimant.name} ({self.status})"


class AuditLog(models.Model):
    action = models.CharField(max_length=100)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions')
    report_reference = models.ForeignKey(Report, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    match_reference = models.ForeignKey(MatchCandidate, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    claim_reference = models.ForeignKey(Claim, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.performed_by.name if self.performed_by else "System"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {actor}: {self.action}"
