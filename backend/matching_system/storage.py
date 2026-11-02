import os
from django.conf import settings
from django.core.files.storage import default_storage, FileSystemStorage

class ItemStorageService:
    """
    Clean storage interface for item images.
    Defaults to local Media storage in development, with pluggable
    backend configuration for AWS S3 or Google Cloud Storage.
    """

    @classmethod
    def get_storage(cls):
        """Returns the configured Django storage backend."""
        return default_storage

    @classmethod
    def get_public_url(cls, file_field) -> str:
        """Resolves the accessible public/media URL for an image."""
        if not file_field:
            return ""
        try:
            return file_field.url
        except Exception:
            return f"{settings.MEDIA_URL}{file_field}"

    @classmethod
    def is_cloud_storage_configured(cls) -> bool:
        """Check if S3 or external object storage is configured in environment."""
        return bool(os.getenv('AWS_STORAGE_BUCKET_NAME') or os.getenv('GS_BUCKET_NAME'))
