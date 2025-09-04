"""
Database configuration for MedCor Backend
Easy switching between different database engines
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Database Configuration Options
DATABASE_CONFIGS = {
    "sqlite": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    },
    "postgresql": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "medcor_db"),
        "USER": os.getenv("DB_USER", "your_username"),
        "PASSWORD": os.getenv("DB_PASSWORD", "your_password"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
    "mysql": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "medcor_db"),
        "USER": os.getenv("DB_USER", "your_username"),
        "PASSWORD": os.getenv("DB_PASSWORD", "your_password"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "3306"),
    },
}

# Current database engine (change this to switch databases)
# Can be set via environment variable DB_ENGINE
CURRENT_DB_ENGINE = os.getenv(
    "DB_ENGINE", "sqlite"
)  # Options: 'sqlite', 'postgresql', 'mysql'


def get_database_config():
    """Get the current database configuration"""
    return DATABASE_CONFIGS.get(CURRENT_DB_ENGINE, DATABASE_CONFIGS["sqlite"])


# Usage in settings.py:
# DATABASES = {
#     'default': get_database_config()
# }
