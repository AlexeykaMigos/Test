# OrderFlow - Order Automation SaaS Platform

A comprehensive order management and automation platform built with NestJS, Next.js 14, PostgreSQL, and Redis.

## Features

- **Order Management** - Full CRUD with status lifecycle tracking (new → accepted → processing → assigned → in_progress → ready → shipped → delivered → completed)
- **Auto-Assignment** - Three algorithms: Round Robin, Min Load, Priority-based
- **Role-Based Access** - Admin, Manager, Executor, Client roles with granular permissions
- **Customer Management** - CRM features with segmentation and revenue tracking
- **Analytics Dashboard** - Revenue charts, employee efficiency, overdue tracking
- **Real-time Notifications** - In-app, email (SMTP), SMS channels
- **JWT Authentication** - Access + refresh token rotation with bcrypt password hashing
- **Swagger API Docs** - Full OpenAPI documentation at `/api/docs`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript, TypeORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Auth | JWT + Passport.js + bcryptjs |
| Validation | class-validator, Zod |
| Forms | React Hook Form |
| State | TanStack Query v5 |
| CI/CD | GitHub Actions |
| Infrastructure | Docker, docker-compose |

## Quick Start

### Prerequisites
- Docker and docker-compose
- Node.js 20+ (for local development)

### Using Docker (recommended)

```bash
# Clone and start all services
git clone <repo-url>
cd orderflow

# Copy environment file
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# Services:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Swagger Docs: http://localhost:3001/api/docs
```

### Local Development

```bash
# Start infrastructure only
docker-compose up -d postgres redis

# Backend
cd backend
npm install
cp .env.example .env
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Order Status Flow

```
NEW -> ACCEPTED -> PROCESSING -> ASSIGNED -> IN_PROGRESS -> READY -> SHIPPED -> DELIVERED -> COMPLETED
                                                                            (CANCELLED at any point)
```

## User Roles

| Role | Permissions |
|------|------------|
| Admin | Full access: manage users, orders, customers, analytics |
| Manager | Create/update orders, manage customers, view analytics |
| Executor | View and update assigned orders |
| Client | View orders linked to their customer profile |

## Auto-Assignment Algorithms

- **Round Robin** - Distributes orders evenly across all executors in rotation
- **Min Load** - Assigns to the executor with the fewest active orders
- **Priority** - Uses Min Load for urgent/high priority, Round Robin for others

## Project Structure

```
orderflow/
├── backend/              # NestJS API
│   └── src/
│       ├── config/       # Database, JWT config
│       ├── entities/     # TypeORM entities
│       └── modules/      # auth, orders, customers, users, notifications, analytics, admin
├── frontend/             # Next.js 14 App
│   └── src/
│       ├── app/          # App Router pages
│       ├── components/   # UI, layout, orders, analytics components
│       ├── hooks/        # useAuth, useOrders, useCustomers
│       ├── lib/          # API client, auth helpers
│       └── types/        # TypeScript interfaces
├── .github/workflows/    # GitHub Actions CI
├── docker-compose.yml
└── README.md
```

## Default Credentials

The first registered user automatically gets the Admin role.

> Important: Change all secrets and credentials before deploying to production.