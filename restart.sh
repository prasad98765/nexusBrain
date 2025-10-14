#!/bin/bash

# Stop and remove existing containers
echo "Stopping existing containers..."
docker compose down

# Remove dangling images (optional, ensures fresh build)
echo "Removing old images..."
docker image prune -f

# Build and start containers in detached mode
echo "Building and starting containers..."
docker compose up -d --build

# List running containers
echo "Current running containers:"
docker ps
