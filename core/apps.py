from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self) -> None:  # pragma: no cover - import side effects only
        # Import chat-related models so Django registers them for migrations.
        from . import chat_models  # noqa: F401
