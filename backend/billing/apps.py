from django.apps import AppConfig


class BillingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'billing'

    def ready(self):
        # Import signal handlers and models
        from . import signals  # noqa
        from . import models  # noqa
