# MedCor Backend 2 - Multi-Tenant Healthcare Platform

[![CI/CD Pipeline](https://github.com/your-username/medcor_backend2/workflows/Deploy%20to%20Production/badge.svg)](https://github.com/your-username/medcor_backend2/actions)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Django Version](https://img.shields.io/badge/django-5.0.1-green.svg)](https://www.djangoproject.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🏥 Overview

MedCor Backend 2 is a comprehensive, production-ready healthcare management platform built with Django and designed for multi-tenant healthcare organizations. It provides a complete suite of healthcare management tools including patient records, appointment scheduling, medical treatments, and AI-powered voice interactions through FastMCP integration.

### ✨ Key Features

- 🏥 **Multi-Tenant Architecture**: Shared database with complete tenant isolation
- 🔐 **JWT Authentication**: Secure token-based authentication with role-based access control
- 👥 **Role-Based Access Control**: Admin, Doctor, Nurse, Patient roles with granular permissions
- 📅 **Advanced Appointment Management**: Smart scheduling with time slots and conflict resolution
- 📋 **Comprehensive Medical Records**: Secure patient health information with audit trails
- 💊 **Treatment & Prescription Management**: Complete care plan and medication tracking
- 💳 **Subscription Plans**: Flexible tiered billing system for hospitals
- 🎙️ **AI Voice Integration**: FastMCP server for voice interactions and AI-powered queries
- 📚 **Auto-Generated API Documentation**: Interactive Swagger/ReDoc documentation
- 🔄 **Real-time Updates**: Server-Sent Events (SSE) for live data synchronization
- 🐳 **Docker Ready**: Complete containerization with Docker Compose
- 🚀 **CI/CD Pipeline**: Automated deployment with GitHub Actions
- 📊 **Health Monitoring**: Comprehensive health checks and monitoring

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Web App   │  │  Mobile App │  │  Voice App  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx)                    │
│  • SSL Termination  • Rate Limiting  • Static File Serving     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Django REST API Server                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Django    │  │   Celery    │  │  MCP Server │            │
│  │   (Gunicorn)│  │   Workers   │  │  (FastMCP)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Message Broker (RabbitMQ)                    │
│  • Task Queue  • Background Jobs  • Real-time Notifications    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                        │
│  • Multi-tenant Data  • Medical Records  • User Management     │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend

- **Framework**: Django 5.0.1 with Django REST Framework 3.14.0
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: JWT (django-rest-framework-simplejwt)
- **API Documentation**: drf-spectacular with Swagger/ReDoc
- **Task Queue**: Celery 5.3.4 with RabbitMQ
- **AI Integration**: FastMCP 0.1.0 with LangChain
- **Web Server**: Gunicorn with Nginx

### AI & Voice

- **Voice Processing**: FastMCP server
- **AI Models**: OpenAI GPT integration
- **Document Processing**: LangChain with PDF/DOCX support
- **Real-time Communication**: Server-Sent Events (SSE)

### DevOps & Deployment

- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud**: AWS RDS PostgreSQL
- **Monitoring**: Health checks and automated rollback
- **Security**: Bandit, Safety, and automated security scanning

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL database (or use provided AWS RDS)
- Docker & Docker Compose (optional)
- Git

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**

```bash
git clone https://github.com/your-username/medcor_backend2.git
cd medcor_backend2
```

2. **Configure environment**

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

3. **Start with Docker Compose**

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f web
```

4. **Initialize database**

```bash
# Run inside the web container
docker-compose exec web python setup_database.py
```

### Option 2: Local Development Setup

1. **Clone and setup**

```bash
git clone https://github.com/your-username/medcor_backend2.git
cd medcor_backend2
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**

```bash
pip install -r requirements.txt
```

3. **Configure environment**

```bash
cp env.example .env
# Edit .env with your database credentials
```

4. **Setup database**

```bash
python setup_database.py
```

5. **Run development server**

```bash
python manage.py runserver 0.0.0.0:8002
```

### Access Points

- **API**: http://localhost:8002
- **API Documentation**: http://localhost:8002/api/docs/
- **ReDoc**: http://localhost:8002/api/redoc/
- **MCP Server**: http://localhost:8001
- **Health Check**: http://localhost:8002/api/health/

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint                     | Description             |
| ------ | ---------------------------- | ----------------------- |
| `POST` | `/api/auth/register/`        | User registration       |
| `POST` | `/api/auth/login/`           | User login (JWT tokens) |
| `POST` | `/api/auth/logout/`          | User logout             |
| `POST` | `/api/auth/token/refresh/`   | Refresh JWT token       |
| `GET`  | `/api/auth/profile/`         | Get user profile        |
| `PUT`  | `/api/auth/profile/`         | Update user profile     |
| `POST` | `/api/auth/change-password/` | Change password         |

### Hospital Management (Multi-Tenant)

| Method   | Endpoint               | Description          |
| -------- | ---------------------- | -------------------- |
| `GET`    | `/api/hospitals/`      | List all hospitals   |
| `POST`   | `/api/hospitals/`      | Create new hospital  |
| `GET`    | `/api/hospitals/{id}/` | Get hospital details |
| `PUT`    | `/api/hospitals/{id}/` | Update hospital      |
| `DELETE` | `/api/hospitals/{id}/` | Delete hospital      |

### User Management

| Method | Endpoint                           | Description     |
| ------ | ---------------------------------- | --------------- |
| `GET`  | `/api/auth/users/`                 | List users      |
| `POST` | `/api/auth/users/`                 | Create user     |
| `GET`  | `/api/auth/users/doctors/`         | List doctors    |
| `GET`  | `/api/auth/users/patients/`        | List patients   |
| `POST` | `/api/auth/users/{id}/activate/`   | Activate user   |
| `POST` | `/api/auth/users/{id}/deactivate/` | Deactivate user |

### Appointment Management

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| `GET`  | `/api/appointments/`       | List appointments        |
| `POST` | `/api/appointments/`       | Create appointment       |
| `GET`  | `/api/appointments/{id}/`  | Get appointment details  |
| `PUT`  | `/api/appointments/{id}/`  | Update appointment       |
| `GET`  | `/api/appointments/slots/` | Get available time slots |

### Medical Records

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| `GET`  | `/api/medical-records/`      | List medical records  |
| `POST` | `/api/medical-records/`      | Create medical record |
| `GET`  | `/api/medical-records/{id}/` | Get record details    |
| `PUT`  | `/api/medical-records/{id}/` | Update record         |

### Treatment Management

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| `GET`  | `/api/treatments/`      | List treatments       |
| `POST` | `/api/treatments/`      | Create treatment      |
| `GET`  | `/api/treatments/{id}/` | Get treatment details |
| `PUT`  | `/api/treatments/{id}/` | Update treatment      |

### Subscription Plans

| Method | Endpoint                             | Description          |
| ------ | ------------------------------------ | -------------------- |
| `GET`  | `/api/subscription-plans/`           | List available plans |
| `GET`  | `/api/subscription-plans/{id}/`      | Get plan details     |
| `POST` | `/api/subscription-plans/subscribe/` | Subscribe to plan    |

## 🎙️ FastMCP Server Integration

The FastMCP server provides programmatic access to healthcare functions with voice interaction capabilities.

### Running MCP Server

```bash
# Standalone
python mcp_server.py

# With Docker
docker-compose up mcp-server
```

### Available MCP Tools (40+ tools)

#### Hospital Management

- `create_hospital` - Create new hospital
- `list_hospitals` - List all hospitals
- `get_hospital` - Get hospital details
- `update_hospital` - Update hospital information

#### User Management

- `create_user` - Create new user
- `list_users` - List users by role
- `get_user` - Get user details
- `update_user` - Update user information

#### Appointment Management

- `create_appointment` - Schedule appointment
- `list_appointments` - List appointments
- `update_appointment_status` - Update appointment status
- `get_available_slots` - Get available time slots

#### Medical Records

- `create_medical_record` - Create medical record
- `list_medical_records` - List patient records
- `update_medical_record` - Update medical record

### MCP Resources (10+ endpoints)

- `hospitals://list` - List all hospitals
- `doctors://list/{hospital_id}` - List doctors by hospital
- `appointments://today/{hospital_id}` - Today's appointments
- `patients://list/{hospital_id}` - List patients by hospital

### Example MCP Usage

```python
# Connect to MCP server
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async with stdio_client(StdioServerParameters(
    command="python",
    args=["mcp_server.py"]
)) as (read, write):
    async with ClientSession(read, write) as session:
        # List hospitals
        result = await session.list_tools()
        print(result)
```

## 🔐 Authentication & Security

### JWT Token Usage

```bash
# Login to get tokens
curl -X POST http://localhost:8002/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@medcor.ai", "password": "admin123"}'

# Use access token in requests
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8002/api/auth/profile/
```

### Multi-Tenant Access

The system supports multiple tenant access methods:

1. **Subdomain Routing**: `hospital1.medcor.ai`
2. **Header-Based**: `X-Tenant-Subdomain: hospital1`
3. **API Parameter**: `?hospital_id=uuid`

### Role-Based Permissions

- **Super Admin**: Full system access
- **Hospital Admin**: Hospital-level management
- **Doctor**: Patient care and medical records
- **Nurse**: Patient assistance and basic records
- **Patient**: Personal health information access

## 🗄️ Database Schema

### Core Models

- **User**: Custom user model with role-based access
- **Hospital**: Multi-tenant hospitals/clinics
- **Appointment**: Patient-doctor appointments with time slots
- **MedicalRecord**: Patient health records with audit trails
- **Treatment**: Treatment plans and care management
- **Prescription**: Medication prescriptions and tracking
- **SubscriptionPlan**: Billing plans for hospitals
- **Subscription**: Hospital subscription management
- **Specialty**: Doctor specializations
- **TimeSlot**: Available appointment times

## 🐳 Docker Deployment

### Production Docker Compose

```yaml
version: "3.8"

services:
  web:
    build: .
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 120 medcor_backend2.wsgi:application"
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - CELERY_BROKER_URL=${CELERY_BROKER_URL}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health/"]
      interval: 30s
      timeout: 10s
      retries: 3

  celery:
    build: .
    command: celery -A medcor_backend2 worker --loglevel=info
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - CELERY_BROKER_URL=${CELERY_BROKER_URL}

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - web
```

### Build and Deploy

```bash
# Build the image
docker build -t medcor-backend .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f web
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The project includes a complete CI/CD pipeline with:

- **Automated Testing**: Unit tests, integration tests, and security scans
- **Code Quality**: Black, isort, flake8, and bandit security checks
- **Docker Build**: Multi-stage Docker builds for optimization
- **Deployment**: Automated deployment to production server
- **Health Checks**: Post-deployment health verification
- **Rollback**: Automatic rollback on deployment failure

### Pipeline Stages

1. **Code Quality Checks**

   - Linting with flake8
   - Code formatting with black
   - Import sorting with isort
   - Security scanning with bandit

2. **Testing**

   - Unit tests with pytest
   - Integration tests
   - API endpoint testing
   - Database migration testing

3. **Build & Deploy**

   - Docker image building
   - Push to registry
   - Deploy to production
   - Health check verification

4. **Monitoring**
   - Service health monitoring
   - Performance metrics
   - Error tracking

## 🔧 Development

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific test
python manage.py test appointments.tests

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Creating Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

### Code Quality

```bash
# Format code
black .

# Sort imports
isort .

# Lint code
flake8 .

# Security check
bandit -r .
```

### Creating Superuser

```bash
python manage.py createsuperuser
```

## 🌍 Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key-here

# Django Settings
DEBUG=False
ALLOWED_HOSTS=your-domain.com,api.medcor.ai
CORS_ALLOWED_ORIGINS=https://your-frontend.com

# Celery
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672//
CELERY_RESULT_BACKEND=rpc://

# AI Services
OPENAI_API_KEY=your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- `GET /api/health/` - Basic health check
- `GET /api/health/detailed/` - Detailed system status
- `GET /api/health/database/` - Database connectivity
- `GET /api/health/celery/` - Celery worker status

### Monitoring Features

- **Service Health**: Automatic health checks every 30 seconds
- **Database Monitoring**: Connection pool and query performance
- **Celery Monitoring**: Worker status and task queue health
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Metrics**: Response times and throughput monitoring

## 🔒 Security Considerations

### Production Security Checklist

- ✅ Always use HTTPS in production
- ✅ Change default passwords immediately
- ✅ Set `DEBUG=False` in production
- ✅ Configure proper CORS origins
- ✅ Use environment variables for secrets
- ✅ Enable rate limiting
- ✅ Regular security updates
- ✅ Database encryption at rest
- ✅ JWT token expiration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection

### Security Tools

- **Bandit**: Python security linter
- **Safety**: Dependency vulnerability scanner
- **Django Security**: Built-in security features
- **HTTPS**: SSL/TLS encryption
- **JWT**: Secure token authentication

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
python manage.py dbshell

# Verify environment variables
echo $DATABASE_URL

# Test connection
python -c "import psycopg2; print('Connected')"
```

#### Migration Errors

```bash
# Reset migrations (development only)
python manage.py migrate --fake-initial

# Check migration status
python manage.py showmigrations

# Create new migration
python manage.py makemigrations
```

#### Static Files Not Loading

```bash
# Collect static files
python manage.py collectstatic

# Check static file settings
python manage.py findstatic admin/css/base.css
```

#### Celery Issues

```bash
# Check Celery status
celery -A medcor_backend2 inspect active

# Restart Celery workers
docker-compose restart celery

# Check RabbitMQ
sudo systemctl status rabbitmq-server
```

#### Docker Issues

```bash
# Rebuild containers
docker-compose build --no-cache

# Clean up Docker
docker system prune -a

# Check container logs
docker-compose logs -f web
```

### Log Files

- **Django Logs**: `django.log`
- **Server Logs**: `server.log`
- **Celery Logs**: `celery.log`
- **Nginx Logs**: `/var/log/nginx/`

## 📞 Support & Contributing

### Getting Help

- 📧 **Email**: support@medcor.ai
- 📚 **Documentation**: [API Documentation](API_DOCUMENTATION.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/medcor_backend2/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/medcor_backend2/discussions)

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guidelines
- Write comprehensive tests
- Update documentation
- Use conventional commit messages
- Ensure all tests pass
- Update version numbers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Django and Django REST Framework teams
- FastMCP for voice integration
- PostgreSQL community
- All contributors and users

---

**Made with ❤️ for the healthcare community**

For more information, visit [medcor.ai](https://medcor.ai) or check out our [complete documentation](https://docs.medcor.ai).
