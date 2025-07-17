# MedCor.ai Django Backend

A complete Python/Django backend implementation for the MedCor.ai medical platform, featuring REST API endpoints, JWT authentication, and comprehensive data models.

## Features

### 🔐 Authentication System
- JWT-based authentication with secure token management
- bcrypt password hashing for security
- Role-based access control (Admin, Doctor, Clinic, Patient)
- Face recognition login support (placeholder for Azure Face API)
- OAuth integration ready

### 🏥 Medical Platform Features
- **Doctor Management**: Complete doctor profiles with specialties, experience, and availability
- **Appointment System**: Booking, scheduling, and status tracking
- **Chat System**: AI-powered chat with HeyGen avatar integration
- **Analysis Tools**: Hair, skin, and lips analysis with YouCam API integration
- **Admin Dashboard**: Comprehensive statistics and user management

### 📊 Database Models
- **User**: Extended Django user model with medical platform fields
- **Doctor**: Healthcare provider profiles
- **Appointment**: Patient booking system
- **ChatMessage**: AI conversation history
- **HairAnalysisReport**: Hair analysis results storage
- **FaceAnalysisReport**: Face analysis data
- **FaceRecognitionLog**: Face recognition audit trail

### 🚀 Performance Features
- **Lazy Loading**: Optimized database queries with `select_related()`
- **Async API Calls**: External API calls use `aiohttp` for better performance
- **Efficient Serialization**: Django REST Framework serializers for data validation
- **Database Optimization**: Proper indexing and query optimization

## Installation

### Prerequisites
```bash
# Python 3.11+ required
python --version

# Install dependencies
pip install -r requirements.txt
```

### Database Setup
```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed database with test data
python manage.py seed_db

# Create superuser for admin access
python manage.py createsuperuser
```

### Development Server
```bash
# Start Django development server
python manage.py runserver 8000

# Or use the custom management script
python manage_server.py
```

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/signup/` - User registration
- `GET /api/auth/me/` - Get current user profile
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/face-login/` - Face recognition login
- `POST /api/auth/register-face/` - Register face for user
- `POST /api/auth/update-phone/` - Update phone number

### Medical Platform
- `GET /api/doctors/` - List available doctors
- `GET /api/appointments/` - List user appointments
- `POST /api/appointments/create/` - Create new appointment
- `GET /api/chat/messages/` - Get chat messages for session
- `POST /api/chat/messages/create/` - Create new chat message

### Analysis Tools
- `POST /api/hair-analysis/` - Hair analysis with YouCam API
- `POST /api/skin-analysis/` - Skin analysis with YouCam API
- `POST /api/lips-analysis/` - Lips analysis with YouCam API

### Admin Panel
- `GET /api/admin/stats/` - Get platform statistics
- `GET /api/admin/users/` - List all users (admin only)
- `GET /admin/` - Django admin interface

### Utilities
- `POST /api/location-weather/` - Get weather information

## Test Accounts

The seeded database includes these test accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@medcor.ai | MedcorAdmin123! | Platform administrator |
| Doctor | doctor@medcor.ai | MedcorDoc123! | Healthcare provider |
| Clinic | clinic@medcor.ai | MedcorClinic123! | Clinic administrator |
| Patient | patient@medcor.ai | MedcorPatient123! | Patient account |
| Patient | jane@medcor.ai | MedcorPatient123! | Second patient account |

## Environment Variables

Create a `.env` file in the Django project root:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/medcor_db

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME=86400

# YouCam API (for analysis features)
YOUCAM_API_KEY=your-youcam-api-key
YOUCAM_SECRET_KEY=your-youcam-secret-key

# Azure Face API (for face recognition)
AZURE_FACE_API_KEY=your-azure-face-api-key
AZURE_FACE_ENDPOINT=your-azure-face-endpoint
```

## Architecture

### Django Apps Structure
- **core/**: Main application models and admin
- **authentication/**: JWT authentication and user management
- **api/**: REST API endpoints and serializers

### Key Components

1. **Authentication System**
   - JWT tokens for stateless authentication
   - Role-based permissions (Admin, Doctor, Clinic, Patient)
   - bcrypt password hashing
   - Face recognition integration ready

2. **Database Models**
   - Extended User model with medical platform fields
   - Comprehensive medical entities (Doctor, Appointment, etc.)
   - Analysis report storage for YouCam integration

3. **API Layer**
   - Django REST Framework for API development
   - Async support for external API calls
   - Lazy loading for performance optimization
   - Comprehensive serializers for data validation

4. **External Integrations**
   - YouCam API for hair/skin/lips analysis
   - Azure Face API for face recognition
   - Weather API for location-based services

## Frontend Integration

The Django backend maintains API compatibility with the existing React frontend:

- **Same Endpoints**: All original API endpoints are preserved
- **Same Response Format**: JSON responses match the original format
- **Same Authentication**: JWT tokens work seamlessly
- **Same Data Structure**: Database models mirror the original schema

## Development

### Running Tests
```bash
# Run Django tests
python manage.py test

# Run specific app tests
python manage.py test authentication
python manage.py test api
python manage.py test core
```

### Database Management
```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (development only)
python manage.py flush
python manage.py seed_db
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medcor.ai", "password": "MedcorAdmin123!"}'

# Test protected endpoint
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Production Deployment

### Docker Setup
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput
RUN python manage.py migrate

CMD ["gunicorn", "medcor_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Environment Configuration
- Set `DEBUG=False` in production
- Configure proper database connection
- Set up secure `SECRET_KEY`
- Configure CORS for frontend domain
- Set up proper logging

## Migration from Node.js

The Django backend is designed to be a drop-in replacement for the Node.js backend:

1. **Database Schema**: Models match the original Drizzle schema
2. **API Endpoints**: All endpoints maintain the same paths and responses
3. **Authentication**: JWT implementation is compatible
4. **External APIs**: Same integrations (YouCam, Azure Face, etc.)
5. **Performance**: Improved with Django optimizations and async support

## Support

For issues or questions:
1. Check the Django admin panel at `/admin/`
2. Review API documentation in this README
3. Check database status with `python manage.py seed_db`
4. Test API endpoints with the provided curl examples

## License

This project is part of the MedCor.ai medical platform.