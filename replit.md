# MedCare AI - Compressed Replit.md

## Overview
MedCare AI is an advanced healthcare platform designed to enhance patient interaction through interactive AI avatars, face recognition for authentication, and multi-language support. It offers seamless AI-powered chatbot experiences, identifies returning patients, detects preferred languages, and transitions between nurse and doctor avatars for personalized care. The project aims to provide comprehensive patient management, appointment scheduling, and health analysis capabilities, with significant market potential in digital healthcare.

## User Preferences
Preferred communication style: Simple, everyday language.
medcor_backend MUST run on port 8000.
medcor_backend2 MUST run on port 8002.
Never change these ports to avoid conflicts.

## System Architecture
### Frontend
- **Framework**: React with TypeScript, Vite build tool
- **UI Framework**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS (medical-themed design tokens)
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Design**: Medical-themed color scheme, responsive, component-based, dark mode support.
- **Dashboard Structure**: Four main dashboards: Superadmin, Admin (hospital/clinic), Doctor, and Patient.

### Backend
- **Framework**: Django 4.2+ with Django REST Framework
- **Runtime**: Python 3.11+ (async support)
- **Database**: PostgreSQL (Supabase)
- **Architecture**: Multi-tenant with shared database and tenant ID approach
- **Authentication**: JWT-based (django-rest-framework-simplejwt), bcrypt hashing, passwordless login via face recognition.
- **API Documentation**: Auto-generated with drf-spectacular (Swagger/ReDoc)
- **Key Apps**: `core` (user auth), `tenants` (hospital management), `appointments`, `medical_records`, `treatments`, `subscription_plans`.
- **Middleware**: Custom TenantMiddleware for multi-tenant request handling.
- **MCP Server**: Model Context Protocol (MCP) server providing programmatic access to healthcare management functions, including 33 tools for CRUD operations and guided prompts.
- **API Design**: RESTful endpoints with comprehensive CRUD for users, doctors, appointments, medical records, and more. User deactivation instead of deletion for data integrity.

### Key Features & Technical Implementations
- **AI Chat System**: HeyGen interactive avatars, OpenAI GPT-4o, multi-language support, automatic language detection, avatar transitions, session continuity.
- **Face Recognition**: Azure Face API/AWS Rekognition for authentication, privacy-compliant.
- **Doctor Management**: Comprehensive profiles, availability, and experience tracking.
- **Appointment System**: Form-based booking, doctor/time slot management, status tracking, fully voice-driven booking with multi-step conversation management.
- **Health Analysis Widgets**: Integrated YouCam AI for Skin, Lips, and Hair analysis with personalized recommendations.
- **Multi-Tenant System**: Management of tenants, domains, users (Patient, Doctor, Nurse roles), customizable branding, subdomain routing.
- **Subscription Management**: Subscription plans, payment tracking, usage analytics.
- **Voice Chat Integration**: Full voice command system for healthcare features, including appointment booking, analysis, medical records, and doctor listings.

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
- **ElevenLabs**: Text-to-speech API

### Development Tools
- **vite**: Build tool
- **tsx**: TypeScript execution
- **tailwindcss**: CSS framework