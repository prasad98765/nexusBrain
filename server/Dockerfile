# ==========================
# 1️⃣ Builder Stage
# ==========================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies including PostgreSQL dev libraries
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN python -m venv /install && \
    /install/bin/pip install --upgrade pip && \
    /install/bin/pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# ==========================
# 2️⃣ Production Stage
# ==========================
FROM python:3.11-slim AS production

WORKDIR /app

# Copy virtual environment
COPY --from=builder /install /install

# Copy backend code
COPY --from=builder /app /app

# Set PATH
ENV PATH="/install/bin:$PATH"

EXPOSE 5000

CMD ["python", "app.py"]