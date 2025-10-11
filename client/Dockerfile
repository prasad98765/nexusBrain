# Frontend Dockerfile

# Use Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy rest of the frontend code
COPY . .

# Expose frontend port (usually 5173 for Vite or 3000 for React)
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]
