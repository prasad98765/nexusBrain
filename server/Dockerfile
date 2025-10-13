# # Backend Dockerfile

# FROM python:3.11-slim

# # Base working directory
# WORKDIR /app

# # Install system dependencies (needed for psycopg2)
# RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# # Copy requirements from project root (one level up)
# COPY ../requirements.txt ./requirements.txt

# # Install Python dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy backend source code into /app/server
# COPY . ./server

# # Move working directory into the backend folder
# WORKDIR /app/server

# # Expose backend port
# EXPOSE 5000

# # Start Flask app
# CMD ["python", "app.py"]


# Backend Dockerfile
#FROM python:3.11-slim

#WORKDIR /app

# Install system dependencies
#RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Upgrade pip
#RUN pip install --upgrade pip

# Copy requirements from *server folder*
#COPY requirements.txt .

# Install dependencies
#RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code into container
#COPY . .

#EXPOSE 5000

#CMD ["python", "-m", "server.app"]
# Stage 1: Build stage
# FROM python:3.11-slim AS builder

# WORKDIR /app

# # Install build dependencies
# RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# # Upgrade pip
# RUN pip install --upgrade pip

# # Copy only requirements first
# COPY requirements.txt .

# # Install dependencies into /install directory
# RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# # Copy backend code
# COPY . .

# # Stage 2: Final runtime image
# FROM python:3.11-slim

# WORKDIR /app

# # Copy installed dependencies from builder
# COPY --from=builder /install /usr/local

# # Copy backend code
# COPY --from=builder /app /app

# EXPOSE 5000

# # Set entrypoint
# CMD ["python", "-m", "server.app"]


# Stage 1: Builder
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc libpq-dev
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt
COPY . .

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /install /usr/local
COPY --from=builder /app /app
EXPOSE 5000
CMD ["python", "-m", "server.app"]
