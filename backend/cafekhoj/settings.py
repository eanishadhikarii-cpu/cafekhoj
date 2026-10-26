import os
import sys
from pathlib import Path
from datetime import timedelta
import dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env if present (local development)
dotenv.load_dotenv(BASE_DIR / '.env', override=True)

IS_TESTING = 'test' in sys.argv or any('pytest' in arg for arg in sys.argv)
IS_COLLECTSTATIC = 'collectstatic' in sys.argv

# ---------------------------------------------------------------------------
# SECURITY
# ---------------------------------------------------------------------------

# Default to False so production hosts that omit the variable are safe.
# Set DEBUG=True explicitly in your local .env for development.
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 't')

_DEFAULT_DEV_KEY = 'cafekhoj-dev-insecure-key-2026-production-ready'
SECRET_KEY = os.getenv('SECRET_KEY', _DEFAULT_DEV_KEY)

# Refuse to start in production with the known development key.
if not DEBUG and SECRET_KEY == _DEFAULT_DEV_KEY:
    raise RuntimeError(
        "SECRET_KEY must be set to a secure random value in production. "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(50))\""
    )

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')
    if host.strip()
]
# Automatically permit Render's dynamic external hostname if present
_render_host = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

# ---------------------------------------------------------------------------
# APPLICATION DEFINITION
# ---------------------------------------------------------------------------

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',

    # Local apps
    'core',
    'cafes',
    'reviews',
    'business',
]

try:
    import whitenoise  # noqa: F401
    HAS_WHITENOISE = True
except ImportError:
    HAS_WHITENOISE = False

MIDDLEWARE = [
    # CorsMiddleware must be before any middleware that generates responses.
    'corsheaders.middleware.CorsMiddleware',
    # SecurityMiddleware must be second; WhiteNoise is inserted directly after it.
    'django.middleware.security.SecurityMiddleware',
]
if HAS_WHITENOISE:
    MIDDLEWARE.append('whitenoise.middleware.WhiteNoiseMiddleware')

MIDDLEWARE.extend([
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
])

ROOT_URLCONF = 'cafekhoj.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cafekhoj.wsgi.application'

# ---------------------------------------------------------------------------
# DATABASE
# ---------------------------------------------------------------------------

# Check primary and fallback database environment variables
raw_db_url = os.getenv('DATABASE_URL', '').strip()
if not raw_db_url or raw_db_url.startswith('${{'):
    for alt_var in ('INTERNAL_DATABASE_URL', 'POSTGRES_URL', 'RENDER_POSTGRES_URL'):
        candidate = os.getenv(alt_var, '').strip()
        if candidate and not candidate.startswith('${{'):
            raw_db_url = candidate
            break

DATABASE_URL = raw_db_url


def configure_database(
    database_url: str,
    debug: bool,
    base_dir: Path,
    is_collectstatic: bool = False,
    is_testing: bool = False,
) -> dict:
    """
    Safely configure Django database backend with strict production safeguards.
    Supports Supabase direct, session pooler, transaction pooler, and Render PostgreSQL.
    Strictly forbids SQLite in production runtime.
    """
    url_str = (database_url or '').strip()

    if url_str.startswith('postgres://') or url_str.startswith('postgresql://'):
        import urllib.parse
        _url = urllib.parse.urlparse(url_str)
        _options = {}
        _qs = urllib.parse.parse_qs(_url.query)
        _sslmode = _qs.get('sslmode', [None])[0]

        # Enforce SSL for managed cloud databases (Supabase, Render, AWS, etc.)
        _is_cloud_db = bool(
            _url.hostname and (
                'supabase.co' in _url.hostname
                or 'supabase.com' in _url.hostname
                or 'render.com' in _url.hostname
            )
        )
        if _sslmode:
            _options['sslmode'] = _sslmode
        elif _is_cloud_db:
            # Managed cloud databases require SSL regardless of DEBUG status
            _options['sslmode'] = 'require'

        # Supabase / PgBouncer Transaction Pooler optimization (port 6543)
        # Transaction pooling requires disabling server-side cursors and setting connection max age to 0
        _is_transaction_pooler = (_url.port == 6543)

        return {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': _url.path.lstrip('/') or 'postgres',
                'USER': urllib.parse.unquote(_url.username or ''),
                'PASSWORD': urllib.parse.unquote(_url.password or ''),
                'HOST': _url.hostname,
                'PORT': _url.port or 5432,
                'CONN_MAX_AGE': 0 if _is_transaction_pooler else 60,
                'DISABLE_SERVER_SIDE_CURSORS': _is_transaction_pooler,
                **({'OPTIONS': _options} if _options else {}),
            }
        }

    if is_collectstatic:
        # During collectstatic (build phase), no database queries are executed.
        # An ephemeral in-memory sqlite engine allows static assets to compile cleanly.
        return {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
        }

    if not debug and not is_testing:
        if url_str.startswith('${{'):
            raise RuntimeError(
                f"DATABASE_URL is set to unresolved syntax '{url_str}'. "
                "In the Render web dashboard, '${{...}}' syntax is not expanded. "
                "Please copy the actual PostgreSQL connection string from Supabase (or Render) and paste it into "
                "the DATABASE_URL environment variable on your Render service."
            )
        raise RuntimeError(
            "DATABASE_URL must be configured with a PostgreSQL connection string in production (DEBUG=False). "
            "SQLite is prohibited in production."
        )

    return {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': base_dir / 'db.sqlite3',
        }
    }


DATABASES = configure_database(
    database_url=DATABASE_URL,
    debug=DEBUG,
    base_dir=BASE_DIR,
    is_collectstatic=IS_COLLECTSTATIC,
    is_testing=IS_TESTING,
)

AUTH_USER_MODEL = 'core.User'

# ---------------------------------------------------------------------------
# PASSWORD VALIDATION
# ---------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# INTERNATIONALISATION
# ---------------------------------------------------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# STATIC & MEDIA FILES
# ---------------------------------------------------------------------------

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise compressed manifest storage for production.
# Falls back gracefully when WhiteNoise is not installed or in local dev.
if HAS_WHITENOISE:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# REST FRAMEWORK
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'NON_FIELD_ERRORS_KEY': 'error',
}

# ---------------------------------------------------------------------------
# SIMPLE JWT
# ---------------------------------------------------------------------------

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

# In development (DEBUG=True) allow all origins so the Vite dev server works
# without needing to list every local port. In production this is False and
# only the explicitly listed origins in CORS_ALLOWED_ORIGINS are permitted.
CORS_ALLOW_ALL_ORIGINS = DEBUG

CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip('/')
    for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000',
    ).split(',')
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# CSRF
# ---------------------------------------------------------------------------
# Required by Django 4.0+ when the backend is served over HTTPS and the
# Django admin or DRF browsable API is accessed from a different origin.
# The JWT API endpoints themselves are stateless and do not use CSRF cookies,
# but the Django admin panel does. Set this to your production backend domain.
CSRF_TRUSTED_ORIGINS = [
    origin.strip().rstrip('/')
    for origin in os.getenv(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173',
    ).split(',')
    if origin.strip()
]

# ---------------------------------------------------------------------------
# HTTPS / SECURE COOKIE SETTINGS
# ---------------------------------------------------------------------------
# These are all False by default so local development works over plain HTTP.
# Set each to True via environment variables on your production host.

SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1', 't')
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 't')
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False').lower() in ('true', '1', 't')
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'False').lower() in ('true', '1', 't')
SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', 'False').lower() in ('true', '1', 't')

# ---------------------------------------------------------------------------
# LOGGING
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose' if not DEBUG else 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if not DEBUG else 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'WARNING' if not DEBUG else 'DEBUG',
            'propagate': False,
        },
    },
}
