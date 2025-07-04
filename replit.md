# Replit.md - MedCare AI Interactive Chatbot & Avatar Integration

## Overview

MedCare AI is an advanced healthcare platform featuring HeyGen interactive avatars, face recognition authentication, and multi-language support. The system provides seamless patient interaction with AI-powered chatbots that can recognize returning patients, automatically detect preferred languages, and transition from nurse avatars to doctor-specific avatars for personalized care.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical-themed design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful endpoints with JSON responses
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

### Database Schema
The application uses a relational database with the following core entities:
- **Users**: Authentication and user management
- **Doctors**: Healthcare provider profiles with specialties and availability
- **Appointments**: Patient booking system with status tracking
- **Chat Messages**: AI conversation history with session management

## Key Components

### Advanced AI Chat System with Face Recognition
- **HeyGen Interactive Avatars**: Realistic AI-driven avatars with customizable voices and backgrounds
- **Face Recognition Authentication**: Azure Face API/AWS Rekognition for instant patient recognition
- **Passwordless Login**: Returning patients are automatically recognized and logged in
- **Multi-Language Support**: Automatic language detection from speech and face recognition data
- **OpenAI GPT-4o Integration**: Context-aware responses in multiple languages
- **Avatar Transitions**: Initial nurse avatar greeting → doctor-specific avatar for consultations
- **Session Continuity**: Previous chat history automatically loaded for recognized patients

### Doctor Management
- Comprehensive doctor profiles with photos, specialties, and biographies
- Experience tracking and education credentials
- Availability status management
- Seeded data for development with realistic medical professionals

### Appointment System
- Form-based booking with validation
- Doctor selection and time slot management
- Status tracking (pending, confirmed, cancelled)
- Email and phone contact integration

### UI/UX Design
- Medical-themed color scheme with accessibility considerations
- Responsive design for mobile and desktop
- Component-based architecture with reusable UI elements
- Dark mode support through CSS custom properties

## Data Flow

1. **User Interaction**: Users interact through the React frontend
2. **API Communication**: Frontend communicates with Express API endpoints
3. **Database Operations**: Drizzle ORM handles database queries to PostgreSQL
4. **AI Processing**: OpenAI API processes chat messages and generates responses
5. **State Management**: TanStack Query manages client-side cache and synchronization

## MCP Server AI Agents Architecture

### Booking Agent (Google Calendar Integration)
- **Real-time availability checking**: Queries Google Calendar API for doctor schedules
- **Conflict detection**: Prevents double-booking and scheduling conflicts
- **Automated rescheduling**: Handles appointment changes and cancellations
- **Multi-timezone support**: Manages appointments across different time zones

### Communication Agent (Tcall.ai Integration)
- **Automated outbound calls**: Appointment confirmations and reminders
- **Follow-up automation**: Post-appointment care instructions
- **Emergency notifications**: Critical health alerts via voice calls
- **Multi-language voice support**: Calls in patient's preferred language

### Face Recognition Agent (Azure Face API/AWS Rekognition)
- **Instant patient recognition**: Identifies returning patients via facial recognition
- **Privacy-compliant storage**: Encrypted face patterns, no raw image storage
- **Language detection**: Determines preferred language from facial recognition data
- **Security measures**: Anti-spoofing and liveness detection

### Travel Agent (Flight/Hotel Integration)
- **Out-of-city patient support**: Flight and hotel recommendations
- **Medical travel coordination**: Specialized healthcare travel arrangements
- **Insurance verification**: Travel insurance for medical procedures
- **Transportation assistance**: Airport to hospital transfer coordination

### CRM Sync Agent (HubSpot Integration)
- **Patient data synchronization**: Bi-directional sync with hospital CRM
- **Interaction tracking**: Complete patient journey analytics
- **Follow-up automation**: Scheduled patient outreach campaigns
- **Data analytics**: Patient satisfaction and engagement metrics

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **openai**: Official OpenAI API client for multilingual chat functionality
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **zod**: Schema validation for forms and API data

### AI & Recognition Services
- **HeyGen API**: Interactive avatar generation and voice synthesis
- **Azure Face API**: Face recognition and biometric authentication
- **Azure Text Analytics**: Language detection and sentiment analysis
- **Google Calendar API**: Real-time appointment scheduling
- **Tcall.ai API**: Automated voice communication system

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for server development
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development Environment
- Vite development server for frontend with hot module replacement
- TSX for running TypeScript server code directly
- Environment variables for database and API keys
- Replit-specific plugins for enhanced development experience

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Single Node.js process serves both static files and API endpoints
- PostgreSQL database migrations handled through Drizzle Kit

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `OPENAI_API_KEY`: OpenAI API authentication (required)
- `NODE_ENV`: Environment flag for development/production modes

## Changelog

Changelog:
- July 04, 2025. Initial setup with face recognition and HeyGen avatar integration
- July 04, 2025. Added voice-to-text and text-to-voice capabilities with microphone controls
- July 04, 2025. Implemented comprehensive voice avatar chat interface with real-time audio processing
- July 04, 2025. Redesigned chat interface to match real Medcor.ai with full-screen HeyGen avatar background
- July 04, 2025. Added doctor portfolio display in chatbot when users ask about appointments or doctors
- July 04, 2025. Integrated HeyGen chatbot token authentication for proper API access

## User Preferences

Preferred communication style: Simple, everyday language.