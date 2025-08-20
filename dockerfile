# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies needed for PostgreSQL client
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your Flask app runs on
EXPOSE 5000

# Run the application
CMD ["python", "-m", "server.app"]

