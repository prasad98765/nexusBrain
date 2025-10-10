# ==========================
# 1️⃣ Builder Stage
# ==========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build (for production)
RUN npm run build

# ==========================
# 2️⃣ Production Stage
# ==========================
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY --from=builder /app/package*.json ./

# Install dependencies (including dev dependencies for Vite)
RUN npm ci --legacy-peer-deps

# Copy built files AND source code
COPY --from=builder /app .

EXPOSE 5173

CMD ["npm", "run", "dev"]
