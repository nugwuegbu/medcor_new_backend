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