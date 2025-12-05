###############################
# Stage 1 — Build Go Charger
###############################
FROM golang:1.23 AS go-build

WORKDIR /build

# Only copy automation directory for better caching
COPY automation/ ./automation/

# Build the charger binary
WORKDIR /build/automation
RUN go build -o bin/charger ./cmd/charger


###############################
# Stage 2 — Python Backend + Celery
###############################
FROM python:3.11-slim AS python-app

# Install WeasyPrint system dependencies
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libglib2.0-0 \
    fonts-liberation \
    libpangoft2-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working dir
WORKDIR /app

# Copy entire monorepo (backend + automation)
COPY . .

# Copy the Go charger binary from stage 1
COPY --from=go-build /build/automation/bin/charger automation/bin/charger
RUN chmod +x automation/bin/charger

# Install uv
RUN pip install --no-cache-dir uv

# Set up uv environment inside backend/
ENV UV_PROJECT_ENVIRONMENT="/app/backend/.venv"
WORKDIR /app/backend

# Install Python dependencies with uv
RUN uv sync --frozen
ENV PATH="/app/backend/.venv/bin:$PATH"

###############################
# Final Command (Django API)
# Celery worker/beat override this in Railway
###############################
CMD uv run python manage.py migrate --noinput && \
    uv run gunicorn CalTutors.wsgi:application --bind 0.0.0.0:$PORT --workers 4
