# ==========================================
# Multi-Stage Production Dockerfile: CampusHub Fastify API
# ==========================================

# Stage 1: Build & Compilation
FROM node:22-alpine AS builder

WORKDIR /app

# Native tools for argon2 compilation if needed
RUN apk add --no-cache python3 make g++

COPY package.json ./

RUN npm install

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# Stage 2: Production Minimal Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Add curl for healthcheck validation
RUN apk add --no-cache curl

USER node

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/src/generated ./dist/generated

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]
