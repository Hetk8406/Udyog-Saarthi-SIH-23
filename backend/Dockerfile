FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install runtime tools (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root system user and group
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /bin/bash appuser

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY --chown=appuser:appuser . /app/

# Create directories for static files, media, and private storage with non-root ownership
RUN mkdir -p /app/staticfiles /app/media /app/private_storage && \
    chown -R appuser:appuser /app/staticfiles /app/media /app/private_storage

# Collect static assets into staticfiles using a temporary build-only key (no secret baked in)
RUN SECRET_KEY="build-time-dummy-key-for-collectstatic" \
    DEBUG="False" \
    USE_SQLITE="True" \
    python manage.py collectstatic --noinput

USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--threads", "2", "--access-logfile", "-", "--error-logfile", "-", "core.wsgi:application"]
