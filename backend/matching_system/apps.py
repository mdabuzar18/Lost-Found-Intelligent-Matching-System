from django.apps import AppConfig


class MatchingSystemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'matching_system'
    verbose_name = 'Lost & Found Intelligent Matching System'

    def ready(self):
        # Import signals to ensure signal handlers are connected
        try:
            import matching_system.signals  # noqa
        except ImportError:
            pass
