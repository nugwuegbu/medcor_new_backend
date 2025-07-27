"""
Django settings for medcor_backend project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-your-secret-key-here')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev',
    '*'  # Allow all hosts for development
]

# CSRF Configuration
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://localhost:8000',
    'https://127.0.0.1:8000',
    'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000',
    'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev',
]

# Session and CSRF settings for admin
CSRF_COOKIE_SECURE = False  # For development
SESSION_COOKIE_SECURE = False  # For development
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access for debugging
CSRF_USE_SESSIONS = False  # Use cookies instead of sessions
CSRF_FAILURE_VIEW = 'django.views.csrf.csrf_failure'

# Session configuration for better compatibility
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_SAVE_EVERY_REQUEST = True

# Application definition
SHARED_APPS = [
    'django_tenants',  # mandatory
    'tenant_users.tenants',  # django-tenant-users tenant management
    'tenant_users.permissions',  # django-tenant-users permissions
    'tenants',  # custom tenant app
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'ckeditor',  # Rich text editor
    'django_filters',  # Advanced filtering for DRF
    'drf_spectacular',  # OpenAPI 3 schema generation
    'core',  # Move core to shared to avoid User model conflicts
    'subscription_plan',  # Subscription and payment management
]

TENANT_APPS = [
    # Tenant-specific apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'tenant_users.permissions',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    # 'drf_spectacular',  # Temporarily disabled due to schema conflicts
    'corsheaders',
    'core',
    'api',
    'treatment',
    'appointment',
    # 'simple_treatment',  # Temporarily disabled - dependency issues
    # 'simple_appointment',  # Temporarily disabled - dependency issues
]

INSTALLED_APPS = list(SHARED_APPS) + [
    app for app in TENANT_APPS if app not in SHARED_APPS
]

MIDDLEWARE = [
    'django_tenants.middleware.main.TenantMainMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'tenant_users.tenants.middleware.TenantAccessMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',  # Default Django backend
    "tenant_users.permissions.backend.UserBackend",
]

ROOT_URLCONF = 'medcor_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'medcor_backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': os.getenv('PGDATABASE'),
        'USER': os.getenv('PGUSER'),
        'PASSWORD': os.getenv('PGPASSWORD'),
        'HOST': os.getenv('PGHOST'),
        'PORT': os.getenv('PGPORT', '5432'),
    }
}

DATABASE_ROUTERS = ('django_tenants.routers.TenantSyncRouter', )

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME':
        'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME':
        'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME':
        'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME':
        'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

BASE_DOMAIN = "14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev"
PUBLIC_SCHEMA_NAME = "public"

# Tenant configuration
TENANT_MODEL = "tenants.Client"  # app.Model
TENANT_DOMAIN_MODEL = "tenants.Domain"  # app.Model

# Custom User model
AUTH_USER_MODEL = 'tenants.User'

# Multi-tenant configuration settings
TENANT_USER_CREATION_ENABLED = True  # Allow tenant user creation
TENANT_ADMIN_ENABLED = True  # Enable admin access for tenants

# django-tenant-users configuration
TENANT_USERS_DOMAIN = '14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev'  # Default domain for development
PUBLIC_SCHEMA_URLCONF = 'medcor_backend.urls_public'  # Public schema URL configuration

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS':
    'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE':
    20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_SCHEMA_CLASS':
    'drf_spectacular.openapi.AutoSchema',
}

# Simple JWT configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5000', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000',
    'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev',
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# DRF Spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE':
    'MedCor.ai Healthcare Platform API',
    'DESCRIPTION':
    'Comprehensive API documentation for the MedCor.ai healthcare platform featuring multi-tenant architecture, AI-powered chat, face recognition authentication, appointment management, treatment tracking, and medical analysis tools.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'AUTHENTICATION_WHITELIST': [],
    'DISABLE_ERRORS_AND_WARNINGS': True,
    'VERSION':
    '1.0.0',
    'SERVE_INCLUDE_SCHEMA':
    False,
    'COMPONENT_SPLIT_REQUEST':
    True,
    'SORT_OPERATIONS':
    False,
    'ENABLE_DJANGO_ADMIN_LOGIN_FORM':
    True,
    'AUTHENTICATION_WHITELIST': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'SERVERS': [{
        'url': 'http://localhost:8000',
        'description': 'Development Server'
    }, {
        'url': 'https://14b294fa-eeaf-46d5-a262-7c25b42c30d9-00-m9ex3vzr6khq.sisko.replit.dev:8000',
        'description': 'Replit Production Server'
    }],
    'TAGS': [
        {
            'name':
            'Authentication',
            'description':
            'User authentication, registration, and JWT token management'
        },
        {
            'name': 'Appointments',
            'description': 'Medical appointment scheduling and management'
        },
        {
            'name': 'Treatments',
            'description': 'Medical treatments and procedures management'
        },
        {
            'name': 'Analysis',
            'description': 'AI-powered medical analysis (hair, skin, lips)'
        },
        {
            'name': 'Chat',
            'description': 'AI-powered chat system with HeyGen avatars'
        },
        {
            'name': 'Users',
            'description': 'User management and profiles'
        },
    ],
    'EXTERNAL_DOCS': {
        'description': 'MedCor.ai Platform Documentation',
        'url': 'https://github.com/your-org/medcor-ai/docs',
    },
}

# JWT settings
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_LIFETIME = int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME',
                                          86400))  # 24 hours in seconds
JWT_REFRESH_TOKEN_LIFETIME = 7 * 24 * 60 * 60  # 7 days in seconds

# External API settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
HEYGEN_API_KEY = os.getenv('HEYGEN_API_KEY')
YOUCAM_API_KEY = os.getenv('YOUCAM_API_KEY')
YOUCAM_SECRET_KEY = os.getenv('YOUCAM_SECRET_KEY')
AZURE_FACE_API_KEY = os.getenv('AZURE_FACE_API_KEY')
AZURE_FACE_ENDPOINT = os.getenv('AZURE_FACE_ENDPOINT')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY')

# OAuth Configuration
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
GOOGLE_OAUTH_REDIRECT_URI = os.getenv('GOOGLE_OAUTH_REDIRECT_URI')

# Apple OAuth
APPLE_OAUTH_CLIENT_ID = os.getenv('APPLE_OAUTH_CLIENT_ID')
APPLE_OAUTH_CLIENT_SECRET = os.getenv('APPLE_OAUTH_CLIENT_SECRET')
APPLE_OAUTH_REDIRECT_URI = os.getenv('APPLE_OAUTH_REDIRECT_URI')

# Microsoft OAuth
MICROSOFT_OAUTH_CLIENT_ID = os.getenv('MICROSOFT_OAUTH_CLIENT_ID')
MICROSOFT_OAUTH_CLIENT_SECRET = os.getenv('MICROSOFT_OAUTH_CLIENT_SECRET')
MICROSOFT_OAUTH_REDIRECT_URI = os.getenv('MICROSOFT_OAUTH_REDIRECT_URI')

# Frontend URL for OAuth redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')

# Session configuration for OAuth state management
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1800  # 30 minutes
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_SAVE_EVERY_REQUEST = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
