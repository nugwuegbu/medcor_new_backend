#!/usr/bin/env python3
"""
Migration script to migrate data from legacy KnowledgeBase models to the new unified model.
This script should be run after the database migration is applied.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medcor_backend2.settings')
django.setup()

from knowledgebase.models import KnowledgeBase, Ai_Identity, Behavior, Response, Source
from tenants.models import Hospital
from django.db import transaction

def migrate_hospital_data(hospital):
    """Migrate all knowledge base data for a specific hospital"""
    print(f"Migrating data for hospital: {hospital.name}")
    
    try:
        with transaction.atomic():
            # Get or create KnowledgeBase for this hospital
            knowledge_base, created = KnowledgeBase.objects.get_or_create(
                hospital=hospital,
                defaults={
                    'agent_name': f"{hospital.name} AI Assistant",
                    'agent_title': f"AI Medical Assistant for {hospital.name}",
                    'system_prompt': f"You are a helpful AI medical assistant for {hospital.name}.",
                }
            )
            
            if created:
                print(f"  ✓ Created new KnowledgeBase for {hospital.name}")
            else:
                print(f"  ✓ Found existing KnowledgeBase for {hospital.name}")
            
            # Migrate AI Identity data
            ai_identities = Ai_Identity.objects.filter(hospital=hospital)
            if ai_identities.exists():
                latest_ai = ai_identities.order_by('-created_at').first()
                knowledge_base.agent_name = latest_ai.agent_name
                knowledge_base.agent_title = latest_ai.agent_title
                knowledge_base.system_prompt = latest_ai.system_prompt
                knowledge_base.is_active = latest_ai.is_active
                print(f"  ✓ Migrated AI Identity data from {ai_identities.count()} records")
            
            # Migrate Behavior data
            behaviors = Behavior.objects.filter(hospital=hospital)
            if behaviors.exists():
                latest_behavior = behaviors.order_by('-created_at').first()
                knowledge_base.communication_tone = latest_behavior.communication_tone
                knowledge_base.communication_style = latest_behavior.communication_style
                knowledge_base.confidence_level = latest_behavior.confidence_level
                knowledge_base.response_length = latest_behavior.response_length
                if not ai_identities.exists():
                    knowledge_base.is_active = latest_behavior.is_active
                print(f"  ✓ Migrated Behavior data from {behaviors.count()} records")
            
            # Migrate Response data
            responses = Response.objects.filter(hospital=hospital)
            if responses.exists():
                latest_response = responses.order_by('-created_at').first()
                knowledge_base.greeting_message = latest_response.greeting_message
                knowledge_base.appointment_booking = latest_response.appointment_booking
                knowledge_base.face_analysis = latest_response.face_analysis
                knowledge_base.hair_analysis = latest_response.hair_analysis
                knowledge_base.hair_extension_analysis = latest_response.hair_extension_analysis
                knowledge_base.lips_analysis = latest_response.lips_analysis
                knowledge_base.skin_analysis = latest_response.skin_analysis
                knowledge_base.general_inquiries = latest_response.general_inquiries
                knowledge_base.fallback_response = latest_response.fallback_response
                knowledge_base.emergency_response = latest_response.emergency_response
                knowledge_base.business_hours = latest_response.business_hours
                knowledge_base.medical_specialties = latest_response.medical_specialties
                if not ai_identities.exists() and not behaviors.exists():
                    knowledge_base.is_active = latest_response.is_active
                print(f"  ✓ Migrated Response data from {responses.count()} records")
            
            # Migrate Source data
            sources = Source.objects.filter(hospital=hospital)
            if sources.exists():
                latest_source = sources.order_by('-created_at').first()
                knowledge_base.source_file = latest_source.source_file
                if not ai_identities.exists() and not behaviors.exists() and not responses.exists():
                    knowledge_base.is_active = latest_source.is_active
                print(f"  ✓ Migrated Source data from {sources.count()} records")
            
            # Save the updated KnowledgeBase
            knowledge_base.save()
            print(f"  ✓ Saved unified KnowledgeBase for {hospital.name}")
            
            return True
            
    except Exception as e:
        print(f"  ✗ Error migrating data for {hospital.name}: {str(e)}")
        return False

def migrate_all_hospitals():
    """Migrate data for all hospitals"""
    print("Starting migration to unified KnowledgeBase model...")
    print("=" * 50)
    
    hospitals = Hospital.objects.all()
    total_hospitals = hospitals.count()
    successful_migrations = 0
    failed_migrations = 0
    
    print(f"Found {total_hospitals} hospitals to migrate")
    print()
    
    for hospital in hospitals:
        if migrate_hospital_data(hospital):
            successful_migrations += 1
        else:
            failed_migrations += 1
        print()
    
    print("=" * 50)
    print("Migration Summary:")
    print(f"  Total hospitals: {total_hospitals}")
    print(f"  Successful migrations: {successful_migrations}")
    print(f"  Failed migrations: {failed_migrations}")
    
    if failed_migrations == 0:
        print("✓ All migrations completed successfully!")
    else:
        print(f"⚠ {failed_migrations} migrations failed. Please check the logs above.")

def verify_migration():
    """Verify that the migration was successful"""
    print("\nVerifying migration...")
    print("=" * 30)
    
    hospitals_with_kb = KnowledgeBase.objects.count()
    total_hospitals = Hospital.objects.count()
    
    print(f"Hospitals with KnowledgeBase: {hospitals_with_kb}")
    print(f"Total hospitals: {total_hospitals}")
    
    if hospitals_with_kb == total_hospitals:
        print("✓ All hospitals have KnowledgeBase entries")
    else:
        print(f"⚠ {total_hospitals - hospitals_with_kb} hospitals are missing KnowledgeBase entries")
    
    # Check for data integrity
    empty_kbs = KnowledgeBase.objects.filter(
        agent_name__isnull=True,
        greeting_message__isnull=True
    ).count()
    
    if empty_kbs == 0:
        print("✓ All KnowledgeBase entries have data")
    else:
        print(f"⚠ {empty_kbs} KnowledgeBase entries appear to be empty")

def cleanup_legacy_data():
    """Clean up legacy data after successful migration"""
    print("\nCleaning up legacy data...")
    print("=" * 30)
    
    # Count legacy records
    ai_count = Ai_Identity.objects.count()
    behavior_count = Behavior.objects.count()
    response_count = Response.objects.count()
    source_count = Source.objects.count()
    
    print(f"Legacy records found:")
    print(f"  AI Identities: {ai_count}")
    print(f"  Behaviors: {behavior_count}")
    print(f"  Responses: {response_count}")
    print(f"  Sources: {source_count}")
    
    if ai_count + behavior_count + response_count + source_count > 0:
        response = input("\nDo you want to delete legacy data? (y/N): ")
        if response.lower() == 'y':
            try:
                with transaction.atomic():
                    Ai_Identity.objects.all().delete()
                    Behavior.objects.all().delete()
                    Response.objects.all().delete()
                    Source.objects.all().delete()
                print("✓ Legacy data deleted successfully")
            except Exception as e:
                print(f"✗ Error deleting legacy data: {str(e)}")
        else:
            print("Legacy data preserved")
    else:
        print("No legacy data to clean up")

def main():
    """Main function"""
    print("KnowledgeBase Migration Script")
    print("=" * 40)
    print()
    
    # Check if migration is needed
    if KnowledgeBase.objects.exists():
        print("⚠ KnowledgeBase entries already exist!")
        response = input("Do you want to continue with migration? (y/N): ")
        if response.lower() != 'y':
            print("Migration cancelled")
            return
    
    # Run migration
    migrate_all_hospitals()
    
    # Verify migration
    verify_migration()
    
    # Ask about cleanup
    cleanup_legacy_data()
    
    print("\nMigration process completed!")

if __name__ == "__main__":
    main()