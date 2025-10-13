# ==========================
# 1️⃣ Builder Stage
# ==========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# ==========================
# 2️⃣ Production Stage
# ==========================
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for Vite)
RUN npm install --legacy-peer-deps

# Copy built files and source code from builder
COPY --from=builder /app .

# Expose Vite preview port
EXPOSE 5173

# Start Vite in preview mode (production-like)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
