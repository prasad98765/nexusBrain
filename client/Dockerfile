# ==========================
# Frontend Node + Vite Dockerfile
# ==========================
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy only package files first (for caching npm install)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Ensure the correct root for Vite build
ENV NODE_ENV=production

# Build the Vite app
RUN npm run build

# Expose Vite preview port
EXPOSE 5173

# Start Vite preview server on 0.0.0.0:5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
