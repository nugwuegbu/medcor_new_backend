from django.core.management.base import BaseCommand
from specialty.models import Specialty


class Command(BaseCommand):
    help = 'Populate initial specialty data'
    
    def handle(self, *args, **options):
        """Create initial specialty data"""
        
        specialties_data = [
            {
                'code': 'general_medicine',
                'name': 'General Medicine',
                'description': 'General medical practice covering common health issues and preventive care',
                'certification_required': True,
                'years_of_training': 3
            },
            {
                'code': 'pediatrics',
                'name': 'Pediatrics',
                'description': 'Medical care for infants, children, and adolescents',
                'certification_required': True,
                'years_of_training': 3
            },
            {
                'code': 'gynecology',
                'name': 'Gynecology',
                'description': 'Medical practice dealing with the health of the female reproductive system',
                'certification_required': True,
                'years_of_training': 4
            },
            {
                'code': 'cardiology',
                'name': 'Cardiology',
                'description': 'Medicine dealing with disorders of the heart and blood vessels',
                'certification_required': True,
                'years_of_training': 6
            },
            {
                'code': 'dermatology',
                'name': 'Dermatology',
                'description': 'Diagnosis and treatment of skin, hair, and nail conditions',
                'certification_required': True,
                'years_of_training': 4
            },
            {
                'code': 'orthopedics',
                'name': 'Orthopedics',
                'description': 'Medical specialty focusing on the musculoskeletal system',
                'certification_required': True,
                'years_of_training': 5
            },
            {
                'code': 'psychiatry',
                'name': 'Psychiatry',
                'description': 'Medical specialty devoted to mental health and emotional well-being',
                'certification_required': True,
                'years_of_training': 4
            },
            {
                'code': 'neurology',
                'name': 'Neurology',
                'description': 'Medical specialty dealing with disorders of the nervous system',
                'certification_required': True,
                'years_of_training': 4
            },
            {
                'code': 'ophthalmology',
                'name': 'Ophthalmology',
                'description': 'Medical and surgical eye care',
                'certification_required': True,
                'years_of_training': 4
            },
            {
                'code': 'ent',
                'name': 'ENT (Ear, Nose, and Throat)',
                'description': 'Medical and surgical treatment of ear, nose, and throat conditions',
                'certification_required': True,
                'years_of_training': 5
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for spec_data in specialties_data:
            specialty, created = Specialty.objects.update_or_create(
                code=spec_data['code'],
                defaults=spec_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created specialty: {specialty.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated specialty: {specialty.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Specialty population complete! '
                f'Created: {created_count}, Updated: {updated_count}'
            )
        )