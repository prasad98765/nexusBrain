# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:5001

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

