"""
Django settings for medcor_backend2 project.
Multi-tenant healthcare platform with shared database architecture.
"""

from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta
import dj_database_url

# Load environment variables
load_dotenv()

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    
    # Custom apps
    'core',
    'tenants',
    'appointments',
    'medical_records',
    'treatments',
    'subscription_plans',
    'specialty',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',  # Added SessionMiddleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'tenants.middleware.TenantMiddleware',  # Custom tenant middleware
]

ROOT_URLCONF = 'medcor_backend2.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'medcor_backend2.wsgi.application'

# Database configuration
DATABASES = {
    'default': dj_database_url.parse(
        os.getenv('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Custom User Model
AUTH_USER_MODEL = 'core.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=60),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=7),
}

# CORS Settings
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5000').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins for development
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Spectacular settings for API documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'MedCor Healthcare Platform API',
    'DESCRIPTION': '''
# MedCor Healthcare Platform API Documentation

## Overview
MedCor is a comprehensive multi-tenant healthcare management platform that provides APIs for hospital management, patient care, appointment scheduling, and medical records management.

## API Workflow - Getting Started

### Step 1: Create a Hospital (Tenant)
First, create a hospital/clinic which serves as the tenant in our multi-tenant architecture:
- **POST** `/api/hospitals/` - Create a new hospital

### Step 2: User Registration & Authentication
Register users and assign them to hospitals:
- **POST** `/api/auth/register/` - Register new user (assign to hospital)
- **POST** `/api/auth/login/` - Login and get JWT tokens

### Step 3: Create Core Entities
After authentication, create the necessary entities in order:

1. **Doctors & Staff**
   - **POST** `/api/auth/users/` - Create doctor/nurse/staff accounts
   - **POST** `/api/specialty/doctor-specialties/` - Assign specialties to doctors

2. **Availability & Scheduling**
   - **POST** `/api/appointments/availability-slots/` - Set doctor availability
   - **GET** `/api/appointments/availability-slots/` - View available slots

3. **Patient Management**
   - **POST** `/api/auth/users/` - Create patient accounts
   - **POST** `/api/medical-records/` - Create patient medical records

4. **Appointments & Treatments**
   - **POST** `/api/appointments/` - Book appointments
   - **POST** `/api/treatments/` - Record treatments
   - **POST** `/api/treatments/prescriptions/` - Issue prescriptions

## Authentication
All endpoints (except registration/login) require JWT authentication:
- Include `Authorization: Bearer <token>` in request headers
- Tokens expire after 60 minutes
- Use refresh token endpoint to get new access tokens

## Multi-Tenancy
- Each hospital is a separate tenant
- Users are associated with specific hospitals
- Data is isolated between hospitals
- Admin users can manage multiple hospitals

## Rate Limiting
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## Response Formats
All responses follow RESTful conventions with appropriate HTTP status codes.
    ''',
    'VERSION': '2.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
        'filter': True,
        'tryItOutEnabled': True,
    },
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication and registration'},
        {'name': 'Hospitals', 'description': 'Hospital/Tenant management'},
        {'name': 'Users', 'description': 'User management and profiles'},
        {'name': 'Appointments', 'description': 'Appointment scheduling and management'},
        {'name': 'Medical Records', 'description': 'Patient medical records'},
        {'name': 'Treatments', 'description': 'Treatment plans and prescriptions'},
        {'name': 'Specialties', 'description': 'Doctor specializations'},
        {'name': 'Subscriptions', 'description': 'Hospital subscription plans'},
        {'name': 'Chat & Voice', 'description': 'AI chat and voice interactions'},
    ],
    'EXTERNAL_DOCS': {
        'description': 'MedCor Platform Documentation',
        'url': 'https://medcor.ai/docs',
    },
    'CONTACT': {
        'name': 'MedCor Support',
        'email': 'support@medcor.ai',
    },
    'LICENSE': {
        'name': 'Proprietary',
    },
}

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Email Configuration (for future use)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Security Settings for Production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'