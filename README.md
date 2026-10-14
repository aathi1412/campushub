# CampusHub — Full-Stack Campus Management Platform

CampusHub is a modular monolith platform designed for modern campus administration, event organization, student club activities, project collaboration, and campus community engagement.

---

## 🛠 Technology Stack

### Backend
- **Framework:** Fastify 5
- **Language:** TypeScript (strict mode, NodeNext module resolution)
- **Database & ORM:** MySQL 8 with Prisma ORM 7 (`@prisma/adapter-mariadb`)
- **Password Hashing:** Argon2id
- **Validation:** AJV / Fastify native JSON schemas & Zod
- **Authentication:** JWT via `@fastify/jwt` & `@fastify/cookie`
- **Testing:** Vitest
- **Containerization:** Docker & Docker Compose

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **UI Components:** Material UI (MUI) v6
- **Styling:** Tailwind CSS + MUI Custom Theme
- **Icons:** Lucide React & MUI Icons
- **HTTP Client:** Axios (centralized instance with token handling)
- **Routing:** React Router v7
- **Form Management:** React Hook Form + Zod

---

## 📁 Monorepo Structure

```
campushub/
├── apps/
│   ├── api/                 # Fastify REST API Service
│   │   ├── prisma/          # Prisma 7 Schema & Migrations
│   │   ├── src/
│   │   │   ├── common/      # Standardized errors, types, response helpers
│   │   │   ├── config/      # Zod-validated environment config
│   │   │   ├── modules/     # Feature modules (health, auth, users, events, etc.)
│   │   │   ├── plugins/     # Fastify encapsulation plugins (cors, prisma, errorHandler)
│   │   │   ├── app.ts       # Application factory
│   │   │   └── server.ts    # Server startup & graceful shutdown
│   │   └── tests/           # Vitest integration tests
│   │
│   └── web/                 # React Vite Frontend Application
│       ├── src/
│       │   ├── components/  # Layout and shared UI components
│       │   ├── services/    # Centralized Axios client & API calls
│       │   ├── theme/       # Campus SaaS MUI Theme
│       │   ├── types/       # TypeScript API and domain models
│       │   ├── App.tsx      # Main application dashboard
│       │   └── main.tsx     # React DOM entry
│       └── vite.config.ts
│
├── docker-compose.yml       # MySQL 8 local development container
├── package.json             # Root workspace orchestration
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20
- npm >= 10
- Docker & Docker Compose (or a local MySQL 8 server)

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Database
```bash
docker compose up -d
```

### 4. Generate Prisma Client & Run Migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Servers
To run both backend and frontend concurrently or independently:
```bash
# Backend API (runs on http://localhost:4000)
npm run dev:api

# Frontend Web (runs on http://localhost:5173)
npm run dev:web
```

---

## 🧪 Testing & Verification

Run Vitest suite:
```bash
# Run backend tests
npm run test:api

# Check TypeScript across monorepo
npm run typecheck
```

---

## 📡 API Contract Specification

All API endpoints follow a predictable, standardized response format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { ... }
  }
}
```

---

## 📋 Implementation Roadmap

| Module | Title | Status | Description |
| :--- | :--- | :---: | :--- |
| **01** | **Backend Foundation** | ✅ Completed | Fastify 5, Prisma 7, MySQL, error handler, CORS, health probes |
| **02** | **Auth, Users & RBAC** | ⏳ In Progress | Argon2id, JWT, refresh tokens, profiles, STUDENT/CLUB_LEADER/ADMIN roles |
| **03** | **Events Management** | 📅 Next | CRUD, categories, capacity, pagination, status lifecycle |
| **04** | **Registrations & Attendance** | 📅 Upcoming | Capacity checks, transaction locks, attendance tracking |
| **05** | **Clubs & Memberships** | 📅 Upcoming | Club directory, join requests, officer approvals |
| **06** | **Project Collaboration** | 📅 Upcoming | Student teams, Kanban task boards, invites |
| **07** | **Campus Community** | 📅 Upcoming | Feed, lost-and-found, polls, upvotes |
| **08** | **Notifications** | 📅 Upcoming | In-app alerts, unread counts, event reminders |
| **09** | **Admin Dashboard** | 📅 Upcoming | Platform metrics, moderation, audit logging |
| **10** | **Production Readiness** | 📅 Upcoming | CI/CD, rate-limiting, security headers, OpenAPI docs |
