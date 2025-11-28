"""
Management command to create hospitals with subdomains.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from tenants.models import Hospital


class Command(BaseCommand):
    help = 'Create a new hospital with subdomain'

    def add_arguments(self, parser):
        parser.add_argument(
            '--name',
            type=str,
            required=True,
            help='Hospital name'
        )
        parser.add_argument(
            '--subdomain',
            type=str,
            required=True,
            help='Unique subdomain for the hospital'
        )
        parser.add_argument(
            '--type',
            type=str,
            default='GENERAL',
            choices=[choice[0] for choice in Hospital.HOSPITAL_TYPE_CHOICES],
            help='Hospital type'
        )
        parser.add_argument(
            '--address',
            type=str,
            required=True,
            help='Hospital address'
        )
        parser.add_argument(
            '--city',
            type=str,
            required=True,
            help='City'
        )
        parser.add_argument(
            '--state',
            type=str,
            required=True,
            help='State'
        )
        parser.add_argument(
            '--phone',
            type=str,
            help='Phone number'
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Email address'
        )
        parser.add_argument(
            '--description',
            type=str,
            help='Hospital description'
        )

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Check if subdomain already exists
                if Hospital.objects.filter(subdomain=options['subdomain']).exists():
                    raise CommandError(f"Hospital with subdomain '{options['subdomain']}' already exists")

                # Create hospital
                hospital = Hospital.objects.create(
                    name=options['name'],
                    subdomain=options['subdomain'],
                    hospital_type=options['type'],
                    address_line1=options['address'],
                    city=options['city'],
                    state=options['state'],
                    phone_number=options.get('phone', ''),
                    email=options.get('email', ''),
                    description=options.get('description', ''),
                    is_active=True,
                    is_verified=True,
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully created hospital: {hospital.name}\n"
                        f"Subdomain: {hospital.subdomain}\n"
                        f"URL: https://{hospital.subdomain}.medcor.ai\n"
                        f"ID: {hospital.id}"
                    )
                )

        except Exception as e:
            raise CommandError(f"Error creating hospital: {str(e)}")