# Replit.md - MedCare AI Compressed

## Overview
MedCare AI is an advanced healthcare platform that integrates interactive AI avatars, face recognition for authentication, and multi-language support to enhance patient interaction. It provides seamless AI-powered chatbot experiences that can identify returning patients, detect preferred languages, and transition between nurse and doctor avatars for personalized care. The project aims to provide comprehensive patient management, appointment scheduling, and health analysis capabilities, with a vision for broad market potential in digital healthcare.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS (medical-themed design tokens)
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Design**: Medical-themed color scheme, responsive design, component-based, dark mode support.

### Dashboard Structure (Simplified - January 8, 2025)
- **4 Main Dashboards Only**:
  1. **Superadmin Dashboard** (`/superadmin/dashboard`) - Multi-tenancy management for MedCor platform
  2. **Admin Dashboard** (`/admin/dashboard`) - Hospital/clinic administration within a tenant
  3. **Doctor Dashboard** (`/doctor/dashboard`) - Doctor portal within hospital tenant
  4. **Patient Dashboard** (`/patient/dashboard`) - Patient portal within hospital tenant

### Backend
- **Runtime**: Python with Django framework
- **Language**: Python 3.11+ (async support)
- **Database**: PostgreSQL (Neon Database)
- **API Design**: Django REST Framework (RESTful endpoints)
- **Authentication**: JWT-based with bcrypt hashing, passwordless login via face recognition.
- **Session Management**: Django sessions (PostgreSQL backend)
- **Core Entities**: Users, Doctors, Appointments, Chat Messages, Treatments, Tenants (multi-tenant architecture).
- **Model Context Protocol (MCP) Server**: Provides programmatic access to healthcare management functions, including 33 tools for CRUD operations on tenants, users, appointments, treatments, and subscriptions, 3 resource endpoints, and 3 guided prompts. Supports multi-tenant operations and JWT-based authentication with role-based access control.
- **User Management API** (Updated Jan 8, 2025): Complete CRUD operations for user management including GET (list/detail), PATCH (update), and DELETE (deactivate) endpoints with admin-only permissions and comprehensive Swagger documentation. Uses deactivation instead of deletion for data integrity in multi-tenant environment.

### Key Features & Technical Implementations
- **AI Chat System**: HeyGen interactive avatars, OpenAI GPT-4o integration, multi-language support, automatic language detection, avatar transitions (nurse to doctor), session continuity.
- **Face Recognition**: Azure Face API/AWS Rekognition for authentication, privacy-compliant storage, language detection.
- **Doctor Management**: Comprehensive profiles, availability, and experience tracking.
- **Appointment System**: Form-based booking, doctor/time slot management, status tracking.
- **Health Analysis Widgets**: Integrated YouCam AI for Skin, Lips, and Hair analysis with camera capture, personalized recommendations, and transparent UI overlays.
- **Multi-Tenant System**: Comprehensive management of tenants, domains, users (Patient, Doctor, Nurse roles), and customizable branding per tenant. Subdomain routing for tenant-specific access.
- **Authentication System**: JWT-based authentication with role-based access control (Admin, Clinic, Doctor, Patient roles), secure password hashing, OAuth integration (Google, Apple, Microsoft).
- **Subscription Management**: Subscription plans, payment tracking, and usage analytics.
- **Patient Dashboard** (NEW - Jan 2025): Comprehensive patient portal with appointment management, medical records viewing, treatment history, prescription tracking, and real-time doctor availability. Full Django API integration for appointments, treatments, and medical records.
- **Enhanced Doctor Dashboard** (NEW - Jan 2025): Advanced doctor portal featuring patient management, appointment scheduling with status tracking (scheduled/in-progress/completed), treatment recording, prescription issuance, analytics dashboard, and patient medical history access. Integrated with Django backend for real-time data synchronization.
- **Critical Backend Fixes** (Jan 8, 2025): Fixed doctors/patients list filtering to use `role` field instead of non-existent groups. Made appointment `slot`, `treatment`, and `medical_record` fields optional to fix creation errors.
- **Analysis Tracking API Fix** (Jan 13, 2025): Added `/api/track-analysis` and `/api/analysis-tracking-stats` endpoints to Django fallback server for proper tracking when Neon database is unavailable. Fixed appointments endpoint to match documentation: `/api/appointments/appointments/`.
- **Production URL Configuration Fix** (Jan 14, 2025): Fixed Django `urls_public.py` configuration for production deployment at medcor.ai. Added proper path prefixes for appointments (`/api/appointments/`), tenants (`/api/tenants/`), and subscriptions (`/api/subscription/`). Updated simple Django fallback server to handle all three critical endpoints: `/api/appointments/appointments/`, `/api/analysis-tracking-stats`, and `/api/analysis-tracking`.
- **Voice Chat Integration Complete** (Jan 14, 2025): Fully implemented voice command system for all healthcare features. Added VOICE_COMMAND detection in backend `/api/chat/voice` endpoint with automatic widget navigation. Supports 9 major features: appointment scheduling, face/skin/lips/hair analysis, hair extensions, medical records, doctor listings, and profile/auth. All commands are processed in real-time with full Django API integration. Created comprehensive documentation in VOICE_CHAT_FEATURES.md.
- **Complete Voice-Driven Appointment Booking** (Jan 14, 2025): Enhanced appointment booking to be fully voice-driven without requiring clicks. Users can say "I want to book an appointment with Dr Johnson", and the system automatically opens calendar, processes voice-selected dates (e.g., "tomorrow", "August 15th"), shows doctor selection UI responsive to voice, displays time slots for voice selection, and provides voice-driven confirmation. Added VoiceConversationManager service for stateful multi-step conversations. Calendar UI now visually highlights voice-selected dates with animations. Added voice assistant indicators and confirmation summaries for seamless voice interaction.
- **MCP Server Integration for Voice Appointments** (Jan 14, 2025): Fully integrated Model Context Protocol (MCP) server with voice appointment system. Created MCPAppointmentService that bridges voice commands to MCP server operations for doctor lookup, availability checking, and appointment creation. Voice commands like "Book appointment with Dr. Johnson tomorrow at 2 PM" now trigger complete MCP workflow: parseAppointmentRequest() → findDoctor() → checkAvailability() → createAppointment(). System processes natural language, extracts appointment details (doctor, date, time, reason), and books appointments entirely through voice without any clicks. Comprehensive testing confirms all MCP tools (list_doctors, list_appointment_slots, create_appointment) working seamlessly with voice interface.

## External Dependencies
### Core Services
- **@neondatabase/serverless**: Serverless PostgreSQL
- **drizzle-orm**: Type-safe ORM
- **openai**: OpenAI API client
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **zod**: Schema validation
- **HeyGen API**: Interactive avatar generation and voice synthesis
- **Azure Face API / AWS Rekognition**: Face recognition
- **Azure Text Analytics**: Language detection, sentiment analysis
- **Google Calendar API**: Appointment scheduling
- **Tcall.ai API**: Automated voice communication
- **YouCam AI**: Skin, Lips, and Hair analysis
- **ElevenLabs**: Text-to-speech API (Turkish voice support)

### Development Tools
- **vite**: Build tool
- **tsx**: TypeScript execution
- **tailwindcss**: CSS framework