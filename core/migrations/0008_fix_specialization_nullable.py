# Generated manually to fix specialization column constraint issue

from django.db import migrations


def make_specialization_nullable(apps, schema_editor):
    """Make specialization column nullable before data migration."""
    with schema_editor.connection.cursor() as cursor:
        # Make the column nullable first
        cursor.execute("ALTER TABLE users ALTER COLUMN specialization DROP NOT NULL")


def reverse_make_specialization_nullable(apps, schema_editor):
    """Reverse migration - make column not null again."""
    with schema_editor.connection.cursor() as cursor:
        # Set empty string for null values first
        cursor.execute("UPDATE users SET specialization = '' WHERE specialization IS NULL")
        # Make column not null again
        cursor.execute("ALTER TABLE users ALTER COLUMN specialization SET NOT NULL")


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_merge_20250909_1526"),
    ]

    operations = [
        migrations.RunPython(
            make_specialization_nullable,
            reverse_make_specialization_nullable,
        ),
    ]