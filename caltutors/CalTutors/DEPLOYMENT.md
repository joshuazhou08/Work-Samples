# CalTutors Backend Deployment Guide

## 🚀 Production-Ready API Backend

This Django REST API backend is optimized for production deployment with enterprise-level security and performance configurations.

## 📋 Pre-Deployment Checklist

### ✅ Security

- [x] DEBUG is set to False in production
- [x] SECRET_KEY is environment-based and secure
- [x] HTTPS enforcement with HSTS headers
- [x] Secure cookies (session and CSRF)
- [x] XSS and clickjacking protection
- [x] Content type sniffing disabled
- [x] API throttling configured

### ✅ Performance

- [x] Database connection pooling
- [x] Redis caching support
- [x] Optimized logging levels
- [x] JSON-only API responses in production

### ✅ Architecture

- [x] Pure API backend (no admin interface)
- [x] No static file serving (handled by frontend)
- [x] CORS configured for frontend integration

## 🔧 Environment Variables

Create a `.env` file in your production environment with these variables:

### Required Variables

```bash
# Core Django Settings
DEBUG=False
DJANGO_SECRET_KEY=your-super-secret-key-here-make-it-long-and-random-50-plus-characters

# Hosting Configuration
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# CORS Configuration (Frontend domains that can access your API)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://your-frontend.vercel.app

# Database
DATABASE_URL=postgresql://username:password@host:port/database_name

# Security (for HTTPS deployments)
SECURE_SSL_REDIRECT=True

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=INFO

# Redis Caching (recommended for production)
REDIS_URL=redis://127.0.0.1:6379/1

# Custom settings
PASSWORD_RESET_TIMEOUT=3600
```

## 🔧 Environment Configuration Examples

### Development (.env file)

```bash
DEBUG=True
DJANGO_SECRET_KEY=your-dev-secret-key
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/caltutors_dev
FRONTEND_URL=http://localhost:3000
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Production Scenarios

#### Scenario 1: Same Domain (Frontend and API on same domain)

```bash
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Scenario 2: API Subdomain (API on subdomain, frontend on main domain)

```bash
DJANGO_ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Scenario 3: Multiple Frontends (One API, multiple frontend apps)

```bash
DJANGO_ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com,https://mobile.yourdomain.com
```

#### Scenario 4: Railway + Vercel (Backend on Railway, Frontend on Vercel)

```bash
DJANGO_ALLOWED_HOSTS=your-app.railway.app,api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://yourdomain.com
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
# Install all dependencies
uv sync

# Or if using pip
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Run migrations
uv run python manage.py migrate

# Create superuser (optional, for API management)
uv run python manage.py createsuperuser
```

### 3. Verify Configuration

```bash
# Check deployment readiness
uv run python manage.py check --deploy

# Test the server
uv run python manage.py runserver
```

## 🚂 Railway Deployment (Recommended)

Railway is a modern deployment platform that's perfect for Django APIs. Here's how to deploy:

### 1. Railway Setup

**Build Command:**

```bash
uv sync --frozen && uv run python manage.py migrate
```

**Start Command:**

```bash
uv run gunicorn CalTutors.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 30
```

### 2. Railway Environment Variables

Set these in your Railway project dashboard:

```bash
# Core Settings
DEBUG=False
DJANGO_SECRET_KEY=your-50-character-secret-key-here

# Hosting (Railway provides your-app.railway.app automatically)
DJANGO_ALLOWED_HOSTS=your-app.railway.app,yourdomain.com,www.yourdomain.com

# CORS (Your frontend domains)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://your-frontend.vercel.app

# Security
SECURE_SSL_REDIRECT=True

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Optional
LOG_LEVEL=INFO
```

**Note:** Railway automatically provides `DATABASE_URL` when you add a PostgreSQL service.

### 3. Railway Configuration File (Optional)

Create `railway.toml` in your project root:

```toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/accounts/auth-ping/"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[services.variables]
PORT = "8000"
```

### 4. Railway Deployment Steps

1. **Connect Repository** - Link your GitHub repo to Railway
2. **Add PostgreSQL** - Add a PostgreSQL service in Railway dashboard
3. **Set Environment Variables** - Add all variables listed above
4. **Configure Build/Start Commands** - Use the commands provided
5. **Deploy** - Railway will automatically deploy on git push

### 5. Custom Domain Setup

1. In Railway dashboard, go to your service settings
2. Add your custom domain (e.g., `api.yourdomain.com`)
3. Update your DNS to point to Railway's provided CNAME
4. Update `DJANGO_ALLOWED_HOSTS` to include your custom domain

## 🌐 Alternative Production Deployments

### Option 1: Gunicorn (Self-Hosted)

```bash
# Install gunicorn (already in dependencies)
uv add gunicorn

# Run with gunicorn
gunicorn CalTutors.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --worker-class sync \
  --timeout 30 \
  --keep-alive 2 \
  --max-requests 1000 \
  --max-requests-jitter 100
```

### Option 2: uWSGI

```bash
# Install uWSGI
uv add uwsgi

# Run with uWSGI
uwsgi --http :8000 --module CalTutors.wsgi --processes 3 --threads 2
```

### Option 3: Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "uv run python manage.py migrate && uv run gunicorn CalTutors.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
```

## 🔄 Reverse Proxy Configuration

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Media files (if needed)
    location /media/ {
        alias /path/to/your/project/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health/ {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }
}
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

Your API includes a health check endpoint:

```bash
# Check API health
curl -X GET https://yourdomain.com/api/accounts/auth-ping/
```

### Log Monitoring

Logs are written to `/logs/debug.log`. Monitor this file for errors:

```bash
# Follow logs
tail -f logs/debug.log

# Check for errors
grep ERROR logs/debug.log
```

### Database Monitoring

```bash
# Check database connections
uv run python manage.py dbshell -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🚨 Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use strong, unique SECRET_KEY (50+ characters)
- Rotate secrets regularly

### 2. Database Security

- Use strong database passwords
- Enable SSL connections to database
- Regularly backup your database

### 3. API Security

- Monitor API usage and throttling
- Implement proper authentication
- Use HTTPS everywhere

### 4. Server Security

- Keep OS and packages updated
- Use firewall to restrict access
- Monitor server logs

## 📊 Performance Optimization

### 1. Database

- Enable connection pooling (already configured)
- Add database indexes for frequently queried fields
- Use database query optimization

### 2. Caching

- Enable Redis caching (set REDIS_URL)
- Cache frequently accessed data
- Use database query caching

### 3. API Optimization

- API throttling is configured (100/hour anonymous, 1000/hour authenticated)
- JSON-only responses in production
- Efficient serializers

## 🔄 Deployment Workflow

### 1. Development to Staging

```bash
# 1. Run tests
uv run python manage.py test

# 2. Check deployment readiness
uv run python manage.py check --deploy

# 3. Collect any media files
# (No static files needed for API-only backend)

# 4. Deploy to staging environment
```

### 2. Staging to Production

```bash
# 1. Backup production database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy new version
git pull origin main

# 3. Install dependencies
uv sync

# 4. Run migrations
uv run python manage.py migrate

# 5. Restart application server
sudo systemctl restart gunicorn
# or
sudo supervisorctl restart caltutors
```

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Verify `CORS_ALLOWED_ORIGINS` includes your frontend domain with correct protocol (https://)
   - Check that `DJANGO_ALLOWED_HOSTS` includes your API domain
   - Ensure frontend URL matches exactly (no trailing slashes)
   - Common fix: `CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`

2. **Database Connection Errors**

   - Verify DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
   - Check database server is running
   - Verify network connectivity

3. **SSL/HTTPS Issues**

   - Ensure `SECURE_SSL_REDIRECT=True` only in HTTPS environments
   - Check SSL certificate validity
   - Verify proxy headers are set correctly

4. **Performance Issues**

   - Enable Redis caching
   - Check database query performance
   - Monitor API throttling limits

5. **Authentication Issues**
   - Verify token authentication is working
   - Check user permissions
   - Monitor failed login attempts

### Debug Commands

```bash
# Check configuration
uv run python manage.py check

# Test database connection
uv run python manage.py dbshell

# View migrations
uv run python manage.py showmigrations

# Create superuser
uv run python manage.py createsuperuser

# Interactive shell
uv run python manage.py shell
```

## 📈 Scaling Considerations

### Horizontal Scaling

- Use load balancer (nginx, HAProxy)
- Multiple application server instances
- Shared database and Redis cache

### Database Scaling

- Read replicas for read-heavy workloads
- Connection pooling (already configured)
- Database partitioning for large datasets

### Caching Strategy

- Redis for session storage
- Database query caching
- API response caching

## 🔐 Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/caltutors_$DATE.sql
find /backups -name "caltutors_*.sql" -mtime +7 -delete
```

### Media Files Backup

```bash
# Backup media files
rsync -av media/ /backups/media/
```

## 📞 Support

For deployment issues:

1. Check logs in `/logs/debug.log`
2. Verify environment variables
3. Test database connectivity
4. Check API endpoints manually

Your CalTutors API backend is now ready for production! 🎉
