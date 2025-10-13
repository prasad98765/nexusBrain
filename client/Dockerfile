# Stage 1: Build React app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy build output from builder stage
# Adjusted to match Vite's outDir: ../dist/public
COPY --from=builder /dist/public /usr/share/nginx/html

# Expose port 80 for EC2 access
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
