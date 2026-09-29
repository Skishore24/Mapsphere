# Multi-stage Dockerfile for MapSphere Frontend (React + Vite + Nginx)
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build production bundle
COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine-slim
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
