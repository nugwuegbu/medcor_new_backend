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

## Face Recognition Login Architecture

### Authentication Flow
1. **Initial Login**: Users first authenticate via OAuth providers (Google, Apple, Facebook)
2. **Phone Number Collection**: New users are prompted to provide phone number for appointment reminders
3. **Face Registration**: After OAuth login, users can register their face for future quick access
4. **Face Recognition Login**: Returning users can login instantly using face recognition

### Technical Implementation
- **OAuth Providers**: Google OAuth2 with passport.js (Apple & Facebook ready for integration)
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **Face Recognition**: Azure Face API integration for secure biometric authentication
- **User Management**: Extended user schema with OAuth and face recognition fields
- **Security**: Face patterns encrypted, no raw images stored, HIPAA compliant

### Database Schema Updates
- Added OAuth fields: oauthProvider, oauthProviderId
- Added face recognition fields: faceRegistered, faceId, personId, lastFaceLogin
- Added profile fields: email, phoneNumber, name, profilePicture, role
- Added tracking fields: lastLogin, isNewUser, createdAt, updatedAt

### API Endpoints
- POST /api/auth/face-login - Face recognition authentication
- POST /api/auth/register-face - Register face for authenticated user
- POST /api/auth/update-phone - Update user phone number
- GET /api/auth/google - Google OAuth login
- GET /api/auth/user - Get current authenticated user
- POST /api/auth/logout - Logout user

## Changelog

Changelog:
- July 04, 2025. Initial setup with face recognition and HeyGen avatar integration
- July 04, 2025. Added voice-to-text and text-to-voice capabilities with microphone controls
- July 04, 2025. Implemented comprehensive voice avatar chat interface with real-time audio processing
- July 04, 2025. Redesigned chat interface to match real Medcor.ai with full-screen HeyGen avatar background
- July 04, 2025. Added doctor portfolio display in chatbot when users ask about appointments or doctors
- July 04, 2025. Integrated HeyGen chatbot token authentication for proper API access
- July 04, 2025. Added user camera view on avatar's chest with hover-to-expand functionality and permission-based activation
- July 04, 2025. Fixed microphone functionality with proper cross-browser support including Safari AudioContext handling
- July 04, 2025. Working on Turkish voice support for HeyGen avatar - currently investigating proper voice ID configuration
- July 04, 2025. Discovered HeyGen Streaming Avatar API limitation - Turkish voices not supported for streaming avatars. Avatar works with default voice but pronounces Turkish text with English phonetics
- July 04, 2025. Fixed microphone timeout issue - now uses continuous recognition mode to prevent premature speech cutoff
- July 04, 2025. Implemented automatic photo capture and compliment system - captures user photo on first message after greeting and provides personalized appearance compliments via GPT-4 Vision
- July 04, 2025. Enhanced location detection with hybrid approach - tries browser geolocation first for accuracy, falls back to IP-based detection if denied
- July 04, 2025. Fixed avatar greeting system to include both weather information and appearance compliment on user's first message
- July 04, 2025. Integrated backend Google search for real weather data - now shows accurate Dubai weather (34°C, cloudy) instead of AI-generated data
- July 04, 2025. Shortened weather message format to be more concise: "Dubai - 34°C, cloudy" instead of longer descriptions
- July 04, 2025. Added info overlay component - blurred transparent card that shows nearby places (gas stations, restaurants, etc.) on the left side when users ask
- July 04, 2025. Integrated OpenStreetMap Overpass API for finding nearby places without requiring Google Maps API key
- July 04, 2025. Updated chat system to detect nearby place queries and trigger NEARBY_SEARCH command for backend processing
- July 05, 2025. Implemented avatar minimize feature - when searching for places or showing links, HeyGen avatar shrinks to circle size and moves to right corner while screen becomes white writing area
- July 05, 2025. Updated initial greeting to "Hi, how can I assist you?" followed by weather information formatted as "So your location is [location] - [temperature]°C, [condition]" and appearance compliment
- July 05, 2025. Removed static "Hello! How can I assist you today?" text that was permanently displayed on screen - greeting is now only spoken by avatar, not shown as text
- July 05, 2025. Fixed nearby places search to use Medcor Clinic's location in Dubai Healthcare City instead of user's location for more relevant results
- July 05, 2025. Memoized UserCameraView component with React.memo to prevent camera shaking when typing messages by avoiding unnecessary re-renders
- July 05, 2025. Fixed photo capture to work every 2nd user message (message 1, 3, 5, etc.) with appearance compliments from GPT-4 Vision
- July 05, 2025. Added useCallback hook for camera permission handler to ensure stable function reference and prevent child component re-renders
- July 05, 2025. Implemented comprehensive face recognition login system with OAuth integration (Google, Apple, Facebook)
- July 05, 2025. Added phone number collection during first login for appointment reminders
- July 05, 2025. Created secure authentication flow: OAuth login → Phone collection → Face registration → Face recognition login
- July 05, 2025. Modified doctor search behavior - now automatically opens chat interface (lightbulb menu) instead of showing inline results
- July 05, 2025. Removed website's doctors page from navigation to prevent confusion - all doctor queries now handled through chat interface
- July 05, 2025. Redesigned doctors screen - avatar now visible as small circle in top right, doctor cards made smaller in grid layout to accommodate multiple doctors
- July 05, 2025. Fixed speech recognition errors by adding try-catch blocks and timeouts to prevent "recognition already started" errors
- July 05, 2025. Fixed overlapping messages in chat interface by increasing container height and adding proper spacing between messages
- July 05, 2025. Updated doctors screen to show actual HeyGen avatar video in circle instead of placeholder icon
- July 05, 2025. Fixed doctor hover functionality - avatar now speaks in third person ("This is Dr. X") and stops speaking when mouse leaves
- July 05, 2025. Added authentication overlay with Google, Apple, Microsoft OAuth options that appears after user sends 2 messages
- July 05, 2025. Replaced AI Assistant logo with User Account button in chat interface menu
- July 05, 2025. Fixed avatar repetition issue - removed duplicate HeyGen avatar instance on doctors page and disabled hover speech to prevent continuous speaking
- July 05, 2025. Added Turkish language support with proper system prompts and automatic detection from message content
- July 05, 2025. Fixed weather greeting to properly display on first user message only
- July 05, 2025. Fixed HeyGen avatar session closing issue - added automatic session recovery and error handling to recreate avatar when session expires
- July 05, 2025. Fixed avatar aspect ratio distortion - changed video element from object-cover to object-contain to maintain proper proportions
- July 05, 2025. Fixed HeyGen avatar black stripes issue - made chat widget full screen (inset-0) and restored object-cover for full screen video display
- July 05, 2025. Restored chat widget to original dimensions (380px x 600px) while keeping HeyGen avatar full coverage with scale transform to eliminate black bars

## User Preferences

Preferred communication style: Simple, everyday language.