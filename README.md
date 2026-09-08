# 🔐 NestJS OTP Authentication Microservices

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-8.x-FF4438?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-4.x-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

A production-ready, passwordless One-Time Password (OTP) authentication system built on NestJS using an event-driven **Microservices Monorepo** architecture, **CQRS**, and **Hexagonal Architecture (Ports & Adapters)**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Microservices Breakdown](#-microservices-breakdown)
- [OTP Authentication Workflow](#-otp-authentication-workflow)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker Compose](#running-with-docker-compose-recommended)
  - [Local Development Setup](#local-development-setup)
- [Database Management](#-database-management)
- [Testing & Quality](#-testing--quality)
- [Security Features](#-security-features)

---

## 🌟 Overview

This project demonstrates a robust, scalable passwordless authentication workflow:
- **No Password Vulnerabilities:** Eliminates credential stuffing and leaked password risks.
- **HMAC-SHA256 Protected OTPs:** OTPs are never stored in plain text; challenges are secured with unique challenge IDs and HMAC hashes.
- **Brute-Force & Rate Protection:** Built-in challenge attempt tracking (max 5 attempts), short TTLs (300s), and HTTP rate limiting via `@nestjs/throttler`.
- **Fault-Tolerant Microservices:** Decoupled RPC requests and asynchronous event handling powered by RabbitMQ with reactive fallback handling (`503 Service Unavailable`).
- **Clean Architecture:** Strict separation of domain logic, ports, application layer (CQRS Command/Query buses), and infrastructure adapters.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    Client(["🌐 Client / Frontend / Swagger"])

    subgraph Gateway ["🚪 Gateway Service (:3000)"]
        GW_Ctrl["API Gateway Controller (/api/v1/auth)"]
        GW_Guard["AuthGuard (JWT Verification)"]
        GW_Throttler["Throttler (Rate Limiting)"]
        GW_Client["RabbitMQ RPC Client"]
    end

    subgraph MessageBroker ["🐇 RabbitMQ Broker (:5672)"]
        Queue_Auth["Queue: auth_service_queue"]
        Event_Email["Topic/Event: emails.send-otp"]
    end

    subgraph AuthService ["🛡 Auth Service (Microservice)"]
        Auth_CQRS["CQRS (Command & Query Bus)"]
        Auth_Prisma["Prisma ORM Adapter"]
        Auth_Redis["Redis OTP & Token Store"]
        Auth_JWT["JWT Token Service"]
    end

    subgraph EmailService ["📧 Email Service (Microservice)"]
        Email_Listener["Event Pattern Handler"]
        Email_Sender["EmailSender Adapter"]
    end

    subgraph Storage ["💾 Data Stores"]
        Postgres[("🐘 PostgreSQL (auth_db)")]
        Redis[("⚡ Redis Cache")]
    end

    Client -->|HTTP / REST| GW_Ctrl
    GW_Ctrl --> GW_Throttler
    GW_Ctrl --> GW_Guard
    GW_Ctrl --> GW_Client

    GW_Client -->|RPC: auth.*| Queue_Auth
    Queue_Auth --> Auth_CQRS

    Auth_CQRS --> Auth_Prisma --> Postgres
    Auth_CQRS --> Auth_Redis --> Redis
    Auth_CQRS --> Auth_JWT
    Auth_CQRS -->|Emit: emails.send-otp| Event_Email

    Event_Email --> Email_Listener
    Email_Listener --> Email_Sender
```

---

## 📦 Microservices Breakdown

| Service | Protocol / Transport | Responsibilities |
| :--- | :--- | :--- |
| **`gateway-service`** | HTTP / REST (Port `3000`) | • Public REST API `/api/v1/auth`<br>• Swagger/OpenAPI documentation at `/docs`<br>• Helmet security headers, CORS, validation pipes<br>• Rate limiting (100 req/min)<br>• Global JWT `AuthGuard` with `@Public()` & `@CurrentUserId()`<br>• Microservice RPC proxy with Zod response schema validation |
| **`auth-service`** | RabbitMQ RPC (`auth_service_queue`) | • Handles `auth.register`, `auth.requestOtp`, `auth.verifyOtp`, `auth.get-me`<br>• CQRS pattern (Commands & Queries)<br>• PostgreSQL user persistence via Prisma ORM<br>• Redis-backed OTP challenge store (TTL, HMAC hash, attempts count)<br>• Redis-backed refresh token storage<br>• Issues access (JWT) and refresh tokens<br>• Emits `emails.send-otp` events |
| **`email-service`** | RabbitMQ Event (`emails.send-otp`) | • Listens to asynchronous email events<br>• Pluggable `EmailSender` interface (includes `ConsoleEmailSender` for dev) |
| **`@app/shared`** | Internal TypeScript Library | • Standard `IServiceResponse<T>` contract<br>• Error mapping from microservice error codes (`EServiceErrorCode`) to HTTP exceptions<br>• RxJS `handleServiceUnavailable()` operator for resilient RPC communication |

---

## 🔄 OTP Authentication Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant GW as Gateway Service
    participant RMQ as RabbitMQ
    participant Auth as Auth Service
    participant Redis as Redis
    participant DB as PostgreSQL
    participant Email as Email Service

    Note over User, DB: 1. Registration Flow
    User->>GW: POST /api/v1/auth { email }
    GW->>RMQ: RPC auth.register
    RMQ->>Auth: RegisterUserCommand
    Auth->>DB: Check & Create User
    DB-->>Auth: User record created
    Auth-->>GW: { hasError: false, data: { id } }
    GW-->>User: 201 Created { id }

    Note over User, Email: 2. Request OTP Flow
    User->>GW: POST /api/v1/auth/request-otp { email }
    GW->>RMQ: RPC auth.requestOtp
    RMQ->>Auth: OtpRequestCommand
    Auth->>DB: Validate user exists
    Auth->>Auth: Generate 6-digit OTP & Challenge UUID
    Auth->>Auth: HMAC-SHA256(challengeId:code, secret)
    Auth->>Redis: Set OTP Challenge (TTL: 300s, attempts: 0)
    Auth-->>RMQ: Emit event "emails.send-otp" { email, code }
    RMQ--)Email: Consume "emails.send-otp"
    Email->>User: Deliver OTP Code (Email / Console)
    Auth-->>GW: { hasError: false, data: { challengeId } }
    GW-->>User: 200 OK { challengeId }

    Note over User, Redis: 3. Verify OTP Flow
    User->>GW: POST /api/v1/auth/verify-otp { challengeId, code }
    GW->>RMQ: RPC auth.verifyOtp
    RMQ->>Auth: VerifyOtpCommand
    Auth->>Redis: Fetch challenge & increment attempts
    Auth->>Auth: Verify HMAC hash & attempts <= 5
    Auth->>Auth: Sign Access & Refresh Tokens
    Auth->>Redis: Store Refresh Token ID
    Auth-->>GW: { hasError: false, data: { accessToken, refreshToken } }
    GW-->>User: 200 OK { accessToken, refreshToken }

    Note over User, DB: 4. Authenticated Request Flow
    User->>GW: GET /api/v1/auth/me [Authorization: Bearer <token>]
    GW->>GW: AuthGuard validates JWT
    GW->>RMQ: RPC auth.get-me { userId }
    RMQ->>Auth: GetMeQuery
    Auth->>DB: Fetch user by ID
    Auth-->>GW: { hasError: false, data: { id, email } }
    GW-->>User: 200 OK { id, email }
```

---

## 📂 Project Structure

```
nest_otp_backend/
├── apps/
│   ├── auth-service/                     # Auth Microservice (CQRS & Hexagonal)
│   │   ├── prisma/
│   │   │   ├── migrations/               # PostgreSQL schema migrations
│   │   │   └── schema.prisma             # Prisma schema definition
│   │   └── src/
│   │       ├── appliacation/             # Application layer
│   │       │   ├── command-handlers/     # RegisterUser, OtpRequest, VerifyOtp
│   │       │   ├── commands/             # CQRS Command definitions
│   │       │   ├── dto/                  # Data transfer objects
│   │       │   ├── exceptions/           # Domain exceptions
│   │       │   ├── ports/                # OtpGenerator, OtpStore, TokenService, etc.
│   │       │   ├── queries/              # CQRS Query definitions
│   │       │   └── query-handlers/       # GetMe query handler
│   │       ├── infrastructure/           # Infrastructure adapters
│   │       │   ├── otp-generator/        # AppOtpGenerator (HMAC-SHA256)
│   │       │   ├── otp-store/            # RedisOtpStore
│   │       │   ├── prisma/               # PrismaService
│   │       │   ├── refresh-token-storage/# RedisRefreshTokenStorage
│   │       │   └── token-service/        # JwtTokenService
│   │       └── main.ts                   # Microservice bootstrap (RMQ transport)
│   │
│   ├── email-service/                    # Email Microservice
│   │   └── src/
│   │       ├── appliacation/             # Event patterns & email templates
│   │       ├── infrastructure/           # ConsoleEmailSender (extensible)
│   │       └── main.ts                   # Event listener bootstrap
│   │
│   └── gateway-service/                  # API Gateway (HTTP & Swagger)
│       └── src/
│           ├── authentication/           # AuthGuard, @Public(), @CurrentUserId()
│           ├── endpoints/                # REST Controllers & RPC Service proxies
│           └── main.ts                   # Express & Swagger bootstrap
│
├── libs/
│   └── shared/                           # Shared library across microservices
│       └── src/
│           ├── error-mapper.ts           # RPC to HTTP error mapping
│           ├── service-response.interface.ts # Standardized response contract
│           └── service-unavailable-filter.ts # RxJS fallback handling
│
├── auth-db/                              # Database configuration
│   └── .env-example
├── auth-service/
│   └── .env-example
├── email-service/
│   └── .env-example
├── gateway-service/
│   └── .env-example
├── docker-compose.yaml                   # Complete orchestration
├── Dockerfile                            # Multi-project Docker build
├── nest-cli.json                         # Monorepo configuration
├── package.json
└── tsconfig.json
```

---

## 🛠 Tech Stack

- **Framework:** [NestJS 11](https://nestjs.com/) (Express, Microservices, CQRS, Throttler, Config, JWT, Swagger)
- **Language:** [TypeScript 5.7](https://www.typescriptlang.org/)
- **Database & ORM:** [PostgreSQL 18](https://www.postgresql.org/) & [Prisma ORM 7](https://www.prisma.io/)
- **Cache & Key-Value Store:** [Redis 8](https://redis.io/) (via `ioredis`)
- **Message Broker:** [RabbitMQ 4](https://www.rabbitmq.com/) (via `amqplib` & `amqp-connection-manager`)
- **Validation & Schema:** [Zod](https://zod.dev/), [class-validator](https://github.com/typestack/class-validator), [class-transformer](https://github.com/typestack/class-transformer), [Joi](https://joi.dev/)
- **Security:** [Helmet](https://helmetjs.github.io/), Node.js `crypto` (HMAC-SHA256), JSON Web Tokens (`@nestjs/jwt`)
- **Testing:** [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest), `ts-jest`
- **Containers:** [Docker](https://www.docker.com/) & Docker Compose

---

## 🚀 API Reference

All gateway routes are prefixed with `/api/v1/auth`. Interactive Swagger docs are available at `http://localhost:3000/docs`.

### 1. Register User
Creates a new user account.

- **URL:** `POST /api/v1/auth`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "id": "c1f7b880-9289-4e58-bb12-9c98bc011234"
    }
    ```
  - `400 Bad Request`: Validation error.
  - `409 Conflict`: User already exists.
  - `503 Service Unavailable`: Dependent service unavailable.

---

### 2. Request OTP
Initiates an OTP login challenge. Generates a 6-digit code, stores an HMAC hash in Redis (300s TTL), and dispatches an email event.

- **URL:** `POST /api/v1/auth/request-otp`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "challengeId": "a827419e-4b68-468a-b855-2d4e38e68cfb"
    }
    ```
  - `400 Bad Request`: Validation error.
  - `404 Not Found`: User does not exist.

---

### 3. Verify OTP
Verifies the submitted OTP against the challenge ID. Returns JWT Access and Refresh tokens upon successful verification.

- **URL:** `POST /api/v1/auth/verify-otp`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "challengeId": "a827419e-4b68-468a-b855-2d4e38e68cfb",
    "code": "123456"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
    ```
  - `400 Bad Request`: Invalid OTP code or exceeded maximum attempts (5 attempts).
  - `404 Not Found`: Challenge expired or user not found.

---

### 4. Get Current User Profile
Protected route that retrieves the authenticated user's profile.

- **URL:** `GET /api/v1/auth/me`
- **Auth Required:** Yes (`Bearer <accessToken>`)
- **Headers:** `Authorization: Bearer <accessToken>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "id": "c1f7b880-9289-4e58-bb12-9c98bc011234",
      "email": "user@example.com"
    }
    ```
  - `401 Unauthorized`: Missing, expired, or malformed token.
  - `404 Not Found`: User not found.

---

## ⚙️ Environment Variables

Create `.env` files in respective directories based on the provided `.env-example` files:

### `auth-db/.env`
```env
POSTGRES_DB=auth
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### `auth-service/.env`
```env
PORT=3001
RABBITMQ_URL=amqp://rabbitmq:5672
DATABASE_URL=postgresql://postgres:postgres@auth_db:5432/auth?schema=public
OTP_SECRET=your-super-secure-otp-hmac-secret-key
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secure-jwt-secret-key
```

### `gateway-service/.env`
```env
PORT=3000
RABBITMQ_URL=amqp://rabbitmq:5672
JWT_SECRET=your-super-secure-jwt-secret-key
```

### `email-service/.env`
```env
PORT=3002
RABBITMQ_URL=amqp://rabbitmq:5672
```

---

## 🚦 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v20+ or v24 recommended)
- [npm](https://www.npmjs.com/)

---

### Running with Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd nest_otp_backend
   ```

2. **Configure Environment Files:**
   ```bash
   cp auth-db/.env-example auth-db/.env
   cp auth-service/.env-example auth-service/.env
   cp gateway-service/.env-example gateway-service/.env
   cp email-service/.env-example email-service/.env
   ```
   *(Fill in secrets such as `JWT_SECRET` and `OTP_SECRET` in `.env` files)*

3. **Start all services and infrastructure:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - **Gateway API & Swagger Docs:** [http://localhost:3000/docs](http://localhost:3000/docs)
   - **RabbitMQ Management Dashboard:** [http://localhost:15672](http://localhost:15672) (default credentials: `guest` / `guest`)
   - **PostgreSQL Database:** `localhost:5432`
   - **Redis Store:** `localhost:6379`

---

### Local Development Setup

To run services directly on your host machine:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Infrastructure (PostgreSQL, Redis, RabbitMQ):**
   ```bash
   docker-compose up auth_db redis rabbitmq -d
   ```

3. **Generate Prisma Client & Run Migrations:**
   ```bash
   npm run prisma:auth:generate
   npm run prisma:auth:migrate
   ```

4. **Start Microservices in Development Mode:**
   ```bash
   # Terminal 1: Auth Microservice
   npx nest start auth-service --watch

   # Terminal 2: Email Microservice
   npx nest start email-service --watch

   # Terminal 3: Gateway Service
   npx nest start gateway-service --watch
   ```

---

## 🗄 Database Management

Prisma CLI scripts configured in `package.json`:

```bash
# Generate Prisma Client for Auth Service
npm run prisma:auth:generate

# Run schema migrations in development mode
npm run prisma:auth:migrate

# Launch Prisma Studio web GUI
npm run prisma:auth:studio

# Validate Prisma schema file
npm run prisma:auth:validate
```

---

## 🧪 Testing & Quality

```bash
# Run unit & integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test code coverage report
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run ESLint with automatic fixes
npm run lint

# Format code with Prettier
npm run format
```

---

## 🔒 Security Features

1. **Passwordless Authentication:** No passwords stored, eliminating credential stuffing vulnerabilities.
2. **Cryptographic OTP Hashing:** OTP codes are hashed with HMAC-SHA256 using a combination of `challengeId`, the OTP `code`, and a secret key `OTP_SECRET`.
3. **Attempt Limiting & Rate Throttling:**
   - Challenge verification is limited to a maximum of **5 attempts** per challenge before invalidation.
   - Gateway rate limiting protects API routes from abuse (100 requests per 60 seconds).
4. **Short Time-to-Live (TTL):** OTP challenges automatically expire in **300 seconds (5 minutes)** in Redis.
5. **Revocable Refresh Tokens:** Refresh token identifiers are tracked in Redis, enabling immediate token invalidation on logout or security breach.
6. **HTTP Security Headers:** Integrated [Helmet](https://helmetjs.github.io/) middleware protects against common web vulnerabilities.
7. **Type-Safe Validation:** Full DTO validation on input (`class-validator` / `ValidationPipe`) and output validation (`Zod`).

---

## 📄 License

This project is licensed under the [UNLICENSED](LICENSE) license.