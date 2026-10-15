# CampusHub — Full-Stack Enterprise Campus Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-black.svg)](https://www.fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1-darkblue.svg)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ed.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-128%20Passed-brightgreen.svg)](https://vitest.dev/)

**CampusHub** is a production-grade, modular campus management platform engineered with Fastify 5, TypeScript, Prisma ORM 7, MySQL, and React 19. It provides an all-in-one ecosystem for university administration, campus event scheduling, transactional ticket registration, student club governance, collaborative project Kanban boards, student community discussions, sentiment polls, in-app notifications, and executive telemetry.

---

## 🛠 Technology Stack

### Backend (`apps/api`)
- **Runtime & Framework:** Node.js 22 LTS, Fastify 5
- **Language:** TypeScript 5.8 (Strict mode, NodeNext ESM resolution)
- **Database & ORM:** MySQL 8 / MariaDB with Prisma ORM 7 (`@prisma/adapter-mariadb`)
- **Security & Cryptography:** Argon2id password hashing, Fastify JWT (`@fastify/jwt`), secure HttpOnly cookies (`@fastify/cookie`), Helmet security headers (`@fastify/helmet`), and Rate Limiting (`@fastify/rate-limit`)
- **Request Validation:** Fastify native AJV JSON schemas & Zod
- **Testing:** Vitest (128 integration tests across 9 test suites)
- **Architecture:** Modular monolith with centralized error handling, custom domain error classes, and transactional capacity locks

### Frontend (`apps/web`)
- **Framework & Tooling:** React 19, TypeScript, Vite
- **Component Systems:** Material UI (MUI v6) with customized campus palette & Tailwind CSS
- **Routing:** React Router v7
- **HTTP Client:** Centralized Axios instance with silent token refresh interceptors
- **Icons:** Lucide React
- **Forms & Validation:** React Hook Form + Zod

---

## 📁 Monorepo Structure

```
campushub/
├── apps/
│   ├── api/                           # Fastify 5 REST API Backend
│   │   ├── Dockerfile                 # Multi-stage production Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Complete relational schema (11 models)
│   │   │   └── seed.ts                # Database onboarding seed script
│   │   ├── src/
│   │   │   ├── common/                # Standardized errors, types, response helpers
│   │   │   ├── config/                # Environment configuration validated with Zod
│   │   │   ├── modules/
│   │   │   │   ├── admin/             # Module 9: Analytics, user moderation, status
│   │   │   │   ├── auth/              # Module 2: Registration, login, token refresh
│   │   │   │   ├── clubs/             # Module 5: Club directory, join requests, officers
│   │   │   │   ├── community/         # Module 7: Discussions, announcements, polls, votes
│   │   │   │   ├── event-registrations/# Module 4: Transactional ticket registration
│   │   │   │   ├── events/            # Module 3: Event lifecycle, filters, venues
│   │   │   │   ├── health/            # Module 1: System probes & DB connectivity
│   │   │   │   ├── notifications/     # Module 8: In-app alerts, unread counts, broadcast
│   │   │   │   ├── projects/          # Module 6: Student teams, Kanban task board
│   │   │   │   └── users/             # Module 2: User profile & password management
│   │   │   ├── plugins/               # Encapsulated Fastify plugins (cors, security, auth)
│   │   │   ├── app.ts                 # App factory & route registrations
│   │   │   └── server.ts              # Server startup & graceful shutdown
│   │   └── tests/                     # 9 Vitest integration test suites (128 tests)
│   │
│   └── web/                           # React 19 Vite Web Application
│       ├── Dockerfile                 # Multi-stage Dockerfile (Nginx alpine)
│       ├── nginx.conf                 # SPA routing & caching configuration
│       └── src/
│           ├── components/            # Header, layouts, protected routes
│           ├── features/              # Feature modules (admin, auth, clubs, community, etc.)
│           ├── services/              # Axios client with automatic refresh interceptor
│           ├── theme/                 # Material UI custom campus theme
│           ├── App.tsx                # Client routing & dashboard home
│           └── main.tsx               # App entrypoint
│
├── docker-compose.yml                 # Multi-service production orchestration
├── package.json                       # Monorepo workspaces definition
└── README.md                          # Full architectural documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 20 LTS (Recommended: Node 22)
- **npm** >= 10
- **Docker & Docker Compose** (for database and multi-service deployment)

### 2. Installation
Clone the repository and install dependencies across all workspaces:
```bash
git clone <repository-url>
cd campushub-new
npm install
```

### 3. Database Initialization
Start the MySQL 8 database container:
```bash
docker compose up -d mysql
```

Apply database migrations and generate the Prisma Client:
```bash
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
```

### 4. Database Seeding
Populate the database with demo users, organizations, events, projects, community posts, and polls:
```bash
npm run seed -w apps/api
```

#### Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Platform Admin** | `admin@university.edu` | `Password@123` |
| **Club Leader** | `leader@university.edu` | `Password@123` |
| **Student** | `student@university.edu` | `Password@123` |

### 5. Running in Development
Start backend API and frontend dev servers concurrently:
```bash
# Terminal 1: Backend API (http://localhost:4000)
npm run dev:api

# Terminal 2: Frontend Web (http://localhost:5173)
npm run dev:web
```

---

## 🐳 Production Deployment with Docker Compose

To deploy the entire production stack (MySQL 8, Fastify 5 API, and React/Nginx Web) in isolated containers:

```bash
docker compose up --build -d
```

- **Frontend Application:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:4000/api/v1`
- **API Health Check:** `http://localhost:4000/health`
- **MySQL Container Port:** `localhost:3307` (mapped internally to `3306`)

To view container logs or terminate:
```bash
docker compose logs -f api
docker compose down
```

---

## 🧪 Automated Testing

CampusHub features a comprehensive test suite with 128 tests across 9 test suites verifying RBAC, capacity transactions, token lifecycles, and security isolation:

```bash
# Run all backend integration tests
npm test

# Run tests with live watch mode
npm run test:watch -w apps/api

# Run TypeScript typechecks across entire monorepo
npm run typecheck

# Run frontend production build
npm run build:web
```

### Test Suite Summary
| Suite | Tests | Coverage Scope |
| :--- | :---: | :--- |
| `health.test.ts` | 3 | Health probes, DB readiness, system uptime |
| `auth.test.ts` | 17 | Argon2id hashing, registration, login, token refresh, password changes |
| `events.test.ts` | 15 | Event creation, filtering, categories, publishing lifecycle |
| `registrations.test.ts` | 11 | Transactional capacity checks, race conditions, attendance checks |
| `clubs.test.ts` | 18 | Club creation, join requests, leader approvals, officer promotions |
| `projects.test.ts` | 21 | Teams, collaborator invitations, Kanban drag/drop status flow |
| `community.test.ts` | 18 | Discussions, RBAC announcements, threaded comments, atomic poll votes |
| `notifications.test.ts` | 11 | In-app alerts, unread polling, user isolation, admin broadcasts |
| `admin.test.ts` | 14 | Telemetry aggregation, user directory, role promotion, account suspension |
| **Total** | **128** | **100% Passed (0 Failures)** |

---

## 📡 REST API Reference

All API routes are versioned under `/api/v1`. Protected routes require a valid `Authorization: Bearer <token>` header.

### Authentication & Users (`/api/v1/auth`, `/api/v1/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new student account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user, receive JWT & HttpOnly refresh cookie |
| `POST` | `/api/v1/auth/refresh` | Public | Silent token refresh via HttpOnly cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke refresh token and clear cookie |
| `GET` | `/api/v1/users/profile` | Authenticated | Retrieve profile details of authenticated user |
| `PATCH` | `/api/v1/users/profile` | Authenticated | Update user bio, department, and year of study |
| `POST` | `/api/v1/users/change-password` | Authenticated | Change user password (invalidates old sessions) |

### Campus Events (`/api/v1/events`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/events` | Public | List published events with category/status filters |
| `POST` | `/api/v1/events` | Club Leader / Admin | Create a new campus event |
| `GET` | `/api/v1/events/:id` | Public | Get event details with organizer information |
| `PATCH` | `/api/v1/events/:id` | Organizer / Admin | Update event details, status, or venue |
| `DELETE` | `/api/v1/events/:id` | Organizer / Admin | Cancel or delete event |

### Registrations & Attendance (`/api/v1/events`, `/api/v1/registrations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/events/:id/register` | Authenticated | Reserve a spot (transactional capacity protection) |
| `DELETE` | `/api/v1/events/:id/register` | Authenticated | Cancel registration and release spot |
| `GET` | `/api/v1/registrations/my-registrations` | Authenticated | List all event registrations for current user |
| `PATCH` | `/api/v1/registrations/:id/attend` | Organizer / Admin | Mark student attendance (check-in) |

### Clubs & Memberships (`/api/v1/clubs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/clubs` | Public | List campus organizations and active clubs |
| `POST` | `/api/v1/clubs` | Club Leader / Admin | Register a new campus organization |
| `GET` | `/api/v1/clubs/:id` | Public | Get club details and member directory |
| `POST` | `/api/v1/clubs/:id/join` | Authenticated | Submit membership request |
| `PATCH` | `/api/v1/clubs/:id/members/:userId/status` | Leader / Admin | Approve or reject membership request |
| `PATCH` | `/api/v1/clubs/:id/members/:userId/role` | Leader / Admin | Promote member to Officer |

### Projects & Task Kanban (`/api/v1/projects`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/projects` | Authenticated | List campus projects |
| `POST` | `/api/v1/projects` | Authenticated | Create project and initialize owner role |
| `GET` | `/api/v1/projects/:id` | Authenticated | Get project details and team members |
| `POST` | `/api/v1/projects/:id/invitations` | Project Maintainer | Invite student collaborator by email |
| `POST` | `/api/v1/projects/invitations/:id/accept` | Invitee | Accept invitation and join project |
| `POST` | `/api/v1/projects/:id/tasks` | Team Member | Create Kanban task |
| `PATCH` | `/api/v1/projects/:id/tasks/:taskId` | Team Member | Update task status (`TODO`, `IN_PROGRESS`, `DONE`) |

### Community & Polls (`/api/v1/community`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/community/posts` | Public | List posts (pinned notices prioritized first) |
| `POST` | `/api/v1/community/posts` | Authenticated | Create discussion or announcement (Leader/Admin only) |
| `GET` | `/api/v1/community/posts/:id` | Public | Get post details and chronological comments |
| `POST` | `/api/v1/community/posts/:id/comments` | Authenticated | Comment on post (notifies post author) |
| `GET` | `/api/v1/community/polls` | Public | List campus opinion polls |
| `POST` | `/api/v1/community/polls` | Authenticated | Launch interactive campus poll |
| `POST` | `/api/v1/community/polls/:id/vote` | Authenticated | Cast vote (atomic single-vote enforcement) |

### Notifications & Alerts (`/api/v1/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | Paginated notifications with unread/type filters |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | Fast polling endpoint for navbar badge |
| `PATCH` | `/api/v1/notifications/:id/read` | Authenticated | Mark single notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated | Mark all user notifications as read |
| `DELETE` | `/api/v1/notifications/:id` | Authenticated | Delete notification |
| `POST` | `/api/v1/notifications/broadcast` | Admin | Broadcast campus advisory to students/departments |

### Admin Governance & Telemetry (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/admin/analytics` | Admin | System-wide statistics and attendance rates |
| `GET` | `/api/v1/admin/users` | Admin | Searchable user directory with role/status filters |
| `PATCH` | `/api/v1/admin/users/:id/role` | Admin | Promote or demote user role |
| `PATCH` | `/api/v1/admin/users/:id/status` | Admin | Activate or suspend account (revokes sessions) |
| `PATCH` | `/api/v1/admin/posts/:id/moderate` | Admin | Flag or unflag moderated posts |
| `PATCH` | `/api/v1/admin/posts/:id/pin` | Admin | Pin or unpin announcements |

---

## 🔒 Security Hardening

CampusHub implements enterprise defense-in-depth practices:
1. **Password Hashing:** Argon2id with memory cost parameters for resistance against GPU/ASIC attacks.
2. **Token Security:** Short-lived JWT access tokens (15 minutes) paired with cryptographically secure, rotating refresh tokens stored in `HttpOnly`, `SameSite=Lax` cookies.
3. **Session Revocation:** Suspending a user account immediately purges all active refresh tokens from the database, terminating active sessions.
4. **Rate Limiting:** Protects backend endpoints against brute force and denial of service (300 requests/minute per IP, with internal health checks exempted).
5. **HTTP Security Headers:** Configured with `@fastify/helmet` (Content Security Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
6. **Input Validation:** Strict AJV JSON schemas reject unauthorized fields and sanitize all incoming payloads before hitting service layers.
7. **Concurrency & Race Conditions:**
   - Event capacities use database transactions (`tx.eventRegistration.count` vs `tx.event.capacity`).
   - Poll votes enforce single-vote integrity via composite unique database constraints `@@unique([pollId, userId])`.

---

## 📄 License
This project is licensed under the MIT License.
