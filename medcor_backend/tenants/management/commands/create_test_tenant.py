from django.core.management.base import BaseCommand
from tenants.models import Client, Domain


class Command(BaseCommand):
    """
    Management command to create a test tenant for multi-tenancy testing.
    
    Usage: python manage.py create_test_tenant
    """
    help = 'Create a test tenant for multi-tenancy testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--name',
            type=str,
            default='Test Hospital',
            help='Name of the test tenant (default: Test Hospital)'
        )
        parser.add_argument(
            '--domain',
            type=str,
            default='test.localhost',
            help='Domain for the test tenant (default: test.localhost)'
        )
        parser.add_argument(
            '--schema',
            type=str,
            default='test_hospital',
            help='Schema name for the test tenant (default: test_hospital)'
        )

    def handle(self, *args, **options):
        name = options['name']
        domain_name = options['domain']
        schema_name = options['schema']
        
        self.stdout.write(
            self.style.SUCCESS(f'Creating test tenant: {name}')
        )
        
        # Create the tenant
        try:
            tenant, created = Client.objects.get_or_create(
                schema_name=schema_name,
                defaults={'name': name}
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created tenant: {tenant.name} (schema: {tenant.schema_name})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Tenant already exists: {tenant.name} (schema: {tenant.schema_name})')
                )
            
            # Create the domain
            domain, domain_created = Domain.objects.get_or_create(
                domain=domain_name,
                defaults={
                    'tenant': tenant,
                    'is_primary': True
                }
            )
            
            if domain_created:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Created domain: {domain.domain} → {tenant.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Domain already exists: {domain.domain} → {tenant.name}')
                )
            
            # Display tenant information
            self.stdout.write('\n' + '='*50)
            self.stdout.write(self.style.HTTP_INFO('TENANT INFORMATION:'))
            self.stdout.write(f'Name: {tenant.name}')
            self.stdout.write(f'Schema: {tenant.schema_name}')
            self.stdout.write(f'Domain: {domain.domain}')
            self.stdout.write(f'Created: {tenant.created_on}')
            self.stdout.write(f'Auto Create Schema: {tenant.auto_create_schema}')
            self.stdout.write('='*50)
            
            # Display all tenants
            self.stdout.write('\n' + self.style.HTTP_INFO('ALL TENANTS:'))
            for client in Client.objects.all():
                domains = Domain.objects.filter(tenant=client)
                domain_list = ', '.join([d.domain for d in domains])
                self.stdout.write(f'• {client.name} ({client.schema_name}) → {domain_list}')
            
            self.stdout.write('\n' + self.style.SUCCESS('✅ Test tenant creation completed!'))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error creating tenant: {str(e)}')
            )