# MedCor Backend 2 - Multi-Tenant Healthcare Platform

## Overview
A comprehensive Django-based healthcare management system with multi-tenant architecture, JWT authentication, and FastMCP integration for voice interactions.

## Features
- 🏥 **Multi-Tenant Architecture**: Shared database with tenant isolation
- 🔐 **JWT Authentication**: Secure token-based authentication
- 👥 **Role-Based Access Control**: Admin, Doctor, Nurse, Patient roles
- 📅 **Appointment Management**: Scheduling with time slots
- 📋 **Medical Records**: Secure patient health information
- 💊 **Treatment & Prescriptions**: Care plan management
- 💳 **Subscription Plans**: Tiered billing for hospitals
- 🎙️ **FastMCP Integration**: Voice interaction capabilities
- 📚 **API Documentation**: Auto-generated Swagger/ReDoc

## Tech Stack
- **Backend**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT (django-rest-framework-simplejwt)
- **API Docs**: drf-spectacular
- **Voice**: FastMCP server integration
- **Deployment**: Gunicorn + Nginx

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL database (Supabase account)
- pip package manager

### Installation

1. **Clone the repository**
```bash
cd medcor_backend2
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
```bash
# Copy .env.example to .env and update with your credentials
cp .env.example .env
# Edit .env with your Supabase database URL
```

4. **Setup database**
```bash
python setup_database.py
```

5. **Run development server**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile
- `POST /api/auth/change-password/` - Change password

### Hospitals (Tenants)
- `GET /api/hospitals/` - List hospitals
- `POST /api/hospitals/` - Create hospital
- `GET /api/hospitals/{id}/` - Get hospital details
- `PUT /api/hospitals/{id}/` - Update hospital
- `DELETE /api/hospitals/{id}/` - Delete hospital

### Users
- `GET /api/auth/users/` - List users
- `POST /api/auth/users/` - Create user
- `GET /api/auth/users/doctors/` - List doctors
- `GET /api/auth/users/patients/` - List patients
- `POST /api/auth/users/{id}/activate/` - Activate user
- `POST /api/auth/users/{id}/deactivate/` - Deactivate user

### Appointments
- `GET /api/appointments/` - List appointments
- `POST /api/appointments/` - Create appointment
- `GET /api/appointments/{id}/` - Get appointment details
- `PUT /api/appointments/{id}/` - Update appointment
- `GET /api/appointments/slots/` - Get available slots

### Medical Records
- `GET /api/medical-records/` - List medical records
- `POST /api/medical-records/` - Create medical record
- `GET /api/medical-records/{id}/` - Get record details
- `PUT /api/medical-records/{id}/` - Update record

### Treatments
- `GET /api/treatments/` - List treatments
- `POST /api/treatments/` - Create treatment
- `GET /api/treatments/{id}/` - Get treatment details
- `PUT /api/treatments/{id}/` - Update treatment

### Subscription Plans
- `GET /api/subscription-plans/` - List plans
- `GET /api/subscription-plans/{id}/` - Get plan details
- `POST /api/subscription-plans/subscribe/` - Subscribe to plan

## API Documentation
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

## FastMCP Server

The FastMCP server provides programmatic access to healthcare functions:

### Running MCP Server
```bash
python mcp_server.py
```

### Available MCP Tools
- Hospital management (create, list)
- User management (create, list, doctors, patients)
- Appointment scheduling (create, list, update status)
- Medical records (create, list)
- Treatment plans (create, list)
- Subscription management

### MCP Resources
- `hospitals://list` - List all hospitals
- `doctors://list/{hospital_id}` - List doctors
- `appointments://today/{hospital_id}` - Today's appointments

## Multi-Tenant Access

The system supports multi-tenant access via:

1. **Subdomain Routing**: `hospital1.medcor.ai`
2. **Header-Based**: `X-Tenant-Subdomain: hospital1`
3. **API Parameter**: `?hospital_id=uuid`

## Authentication

### JWT Token Usage
```bash
# Login to get tokens
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medcor.ai", "password": "admin123"}'

# Use access token in requests
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8000/api/auth/profile/
```

## Default Accounts

After running `setup_database.py`, these accounts are available:

### Superuser
- Email: `admin@medcor.ai`
- Password: `admin123`

### Demo Hospital Users
- **Doctor**: `doctor@demo.com` / `demo123`
- **Nurse**: `nurse@demo.com` / `demo123`
- **Patient**: `patient@demo.com` / `demo123`

## Database Schema

### Core Models
- **User**: Custom user model with role-based access
- **Hospital**: Multi-tenant hospitals/clinics
- **Appointment**: Patient-doctor appointments
- **MedicalRecord**: Patient health records
- **Treatment**: Treatment plans and care
- **Prescription**: Medication prescriptions
- **SubscriptionPlan**: Billing plans
- **Subscription**: Hospital subscriptions

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Collecting Static Files
```bash
python manage.py collectstatic
```

### Creating Superuser
```bash
python manage.py createsuperuser
```

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy with Docker
```bash
docker build -t medcor-backend .
docker run -p 8000:8000 --env-file .env medcor-backend
```

### Deploy with Gunicorn
```bash
gunicorn medcor_backend2.wsgi:application --bind 0.0.0.0:8000
```

## Environment Variables

Required environment variables in `.env`:

```env
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.com
```

## Security Considerations

- Always use HTTPS in production
- Change default passwords immediately
- Set `DEBUG=False` in production
- Configure proper CORS origins
- Use environment variables for secrets
- Enable rate limiting
- Regular security updates

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check PostgreSQL service status
- Ensure network connectivity

### Migration Errors
- Run `python manage.py makemigrations`
- Check for model conflicts
- Review migration files

### Static Files Not Loading
- Run `python manage.py collectstatic`
- Check `STATIC_ROOT` setting
- Verify web server configuration

## Support

For issues or questions:
- Check the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Review API documentation at `/api/docs/`
- Check Django logs: `tail -f debug.log`

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request