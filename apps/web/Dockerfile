# ==========================================
# Multi-Stage Production Dockerfile: CampusHub React Web UI
# ==========================================

# Stage 1: Build & Bundle
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./

RUN npm install

COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src ./src

# Build production bundle
ARG VITE_API_URL=http://localhost:4000/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Nginx Static Serving
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
