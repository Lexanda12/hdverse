# CLAUDE.md — HD Verse MVP
## AI Agent Operating Instructions
**Version:** 1.0 | **Classification:** Internal | **June 2026**
**Project:** HD Verse — Africa's Creative IP Infrastructure
**Sprint Duration:** 2–3 weeks
**Agent Authority:** Execute within scope. Escalate scope changes to CTO (Eniola) only.

---

## 0. Read This First

You are building the HD Verse MVP — a pre-distribution IP ownership and protection platform for Nigerian music producers. Every decision you make must serve one objective:

> **Get a Nigerian music producer from file upload to downloadable ownership certificate, with payment processed, in under 3 minutes.**

This is a revenue-first build. The certificate IS the product. The detection alert IS the subscription trigger. Everything else is infrastructure that supports those two moments.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| Product | HD Verse |
| Tagline | Africa's Creative IP Infrastructure |
| Domain | myhdverse.com |
| Email | hello@myhdverse.com |
| Primary persona | Nigerian music producer / micro-label owner |
| Core workflow | Upload beat → Certificate → Share |
| Revenue model | Pay-per-certificate ($2–$5) → Subscription ($19/$50/month) |
| Sprint success | 5–20 paying creators, 1 repeat upload, 1 detection test passing |

---

## 2. Tech Stack — Non-Negotiable

### Backend
```
Runtime:      Node.js (v20 LTS)
Framework:    Express.js
Architecture: Modular monolith — NO microservices in MVP
Database:     PostgreSQL (primary)
Cache/Queue:  Redis (BullMQ for job queues)
ORM:          Prisma
Auth:         JWT (access token 15min) + Refresh token (7 days)
              Stored in httpOnly cookies — never localStorage
```

### Frontend
```
Framework:    React.js (Vite, NOT Create React App)
Language:     TypeScript (strict mode)
Styling:      Tailwind CSS + CSS custom properties (design tokens)
Components:   shadcn/ui as base — heavily customized to HD Verse design
State:        Zustand (global) + React Query (server state)
Routing:      React Router v6
```

### Infrastructure & Services
```
File Storage:     AWS S3 (us-east-1)
Email:            AWS SES (primary) / SendGrid (fallback)
Timestamping:     FreeTSA (RFC 3161)
Fingerprinting:   ACRCloud
KYC:              Smile Identity (OTP, Tier 1)
Payments:         Flutterwave
PDF Generation:   Puppeteer (Node.js server-side)
QR Codes:         qrcode npm package (server-side)
Hosting (API):    Railway
Hosting (Web):    Vercel
CI/CD:            GitHub Actions
```

### Environment
```
node >= 20.0.0
npm >= 10.0.0
PostgreSQL >= 15
Redis >= 7
```

---

## 3. Repository Structure

```
hdverse/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   │   ├── ui/         # shadcn base components (customized)
│   │   │   │   ├── layout/     # Sidebar, Nav, Shell
│   │   │   │   └── features/   # Feature-specific components
│   │   │   ├── pages/          # Route-level page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── lib/            # API client, utilities
│   │   │   ├── types/          # TypeScript types
│   │   │   └── styles/         # Global CSS, design tokens
│   │   ├── public/
│   │   └── index.html
│   │
│   └── api/                    # Node.js / Express backend
│       ├── src/
│       │   ├── modules/        # Feature modules (modular monolith)
│       │   │   ├── auth/
│       │   │   ├── works/
│       │   │   ├── certificates/
│       │   │   ├── detection/
│       │   │   ├── payments/
│       │   │   └── notifications/
│       │   ├── shared/         # Shared utilities, middleware, types
│       │   │   ├── middleware/
│       │   │   ├── utils/
│       │   │   └── types/
│       │   ├── jobs/           # BullMQ job processors
│       │   ├── lib/            # Third-party integrations
│       │   │   ├── s3.ts
│       │   │   ├── acrcloud.ts
│       │   │   ├── freetsa.ts
│       │   │   ├── flutterwave.ts
│       │   │   ├── smile-identity.ts
│       │   │   └── pdf.ts
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   └── app.ts
│       └── package.json
│
├── packages/
│   └── shared-types/           # Shared TypeScript types (web + api)
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── CLAUDE.md                   # This file
├── DESIGN.md                   # Design system specification
├── PRD.md                      # Product requirements document
└── docker-compose.yml          # Local dev (postgres + redis)
```

---

## 4. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String        @id @default(cuid())
  email           String        @unique
  passwordHash    String
  fullName        String
  phone           String        @unique
  phoneVerified   Boolean       @default(false)
  kycStatus       KycStatus     @default(PENDING)
  kycTier         Int           @default(0)
  subscriptionTier SubscriptionTier @default(FREE)
  subscriptionEndsAt DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  works           Work[]
  payments        Payment[]
  refreshTokens   RefreshToken[]

  @@index([email])
  @@index([phone])
}

model Work {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])

  title           String
  artistName      String
  genre           String?
  yearCreated     Int?
  coCreators      String?

  // File
  s3Key           String        @unique
  s3Bucket        String
  fileName        String
  fileSizeBytes   BigInt
  mimeType        String
  fileHash        String        @unique  // SHA-256

  // Ownership proof
  isrc            String        @unique
  timestampToken  String?       // RFC 3161 token (base64)
  timestampedAt   DateTime?
  certificateS3Key String?

  // Detection
  acrcloudId      String?       @unique
  fingerprintStatus FingerprintStatus @default(PENDING)
  fingerprintedAt DateTime?

  status          WorkStatus    @default(PROCESSING)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  certificate     Certificate?
  detectionAlerts DetectionAlert[]
  payments        Payment[]

  @@index([userId])
  @@index([fileHash])
  @@index([isrc])
  @@index([acrcloudId])
}

model Certificate {
  id              String        @id @default(cuid())
  workId          String        @unique
  work            Work          @relation(fields: [workId], references: [id])

  certificateNumber String      @unique  // HDV-2026-XXXXXX
  s3Key           String        @unique
  verificationUrl String        @unique
  issuedAt        DateTime      @default(now())

  @@index([certificateNumber])
  @@index([verificationUrl])
}

model DetectionAlert {
  id              String        @id @default(cuid())
  workId          String
  work            Work          @relation(fields: [workId], references: [id])

  platform        String
  detectedAt      DateTime
  matchConfidence String        // "High" | "Medium" | "Low"
  sourceUrl       String?
  rawResponse     Json

  notifiedAt      DateTime?
  status          AlertStatus   @default(NEW)
  createdAt       DateTime      @default(now())

  @@index([workId])
  @@index([status])
}

model Payment {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  workId          String?
  work            Work?         @relation(fields: [workId], references: [id])

  flutterwaveRef  String        @unique
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("USD")
  type            PaymentType
  status          PaymentStatus @default(PENDING)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
  @@index([flutterwaveRef])
  @@index([status])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}

// Enums
enum KycStatus {
  PENDING
  VERIFIED
  FAILED
}

enum SubscriptionTier {
  FREE
  BASIC
  PRO
}

enum WorkStatus {
  PROCESSING
  ACTIVE
  FAILED
}

enum FingerprintStatus {
  PENDING
  REGISTERED
  FAILED
}

enum AlertStatus {
  NEW
  NOTIFIED
  REVIEWED
}

enum PaymentType {
  CERTIFICATE
  SUBSCRIPTION_BASIC
  SUBSCRIPTION_PRO
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

---

## 5. API Route Map

```
AUTH
POST   /api/auth/register           Register user (name, email, password, phone)
POST   /api/auth/verify-otp         Verify Smile Identity OTP
POST   /api/auth/login              Login → access + refresh tokens
POST   /api/auth/refresh            Refresh access token
POST   /api/auth/logout             Invalidate refresh token

WORKS
POST   /api/works/upload            Presigned S3 URL + create work record
POST   /api/works/:id/confirm       Confirm upload complete → trigger pipeline
GET    /api/works                   List user's works (paginated)
GET    /api/works/:id               Get single work + status

CERTIFICATES
GET    /api/certificates/:workId    Get certificate for a work
GET    /api/certificates/:id/download  Download certificate PDF (signed S3 URL)
GET    /api/verify/:verificationId  Public — verify certificate (no auth)

DETECTION
GET    /api/detection/alerts        List detection alerts for user
GET    /api/detection/alerts/:id    Single alert detail
POST   /api/detection/webhook       ACRCloud webhook receiver

PAYMENTS
POST   /api/payments/initiate       Create Flutterwave payment link
POST   /api/payments/webhook        Flutterwave webhook (verify + process)
GET    /api/payments/history        User payment history

USERS
GET    /api/users/me                Get current user profile
PATCH  /api/users/me                Update profile
```

---

## 6. Environment Variables

```bash
# .env (never commit — use .env.example as template)

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=                         # min 64 chars, random
JWT_REFRESH_SECRET=                 # min 64 chars, random, different from above

# Database
DATABASE_URL=postgresql://hdverse:password@localhost:5432/hdverse_dev
REDIS_URL=redis://localhost:6379

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=hdverse-works-dev
AWS_SES_FROM_EMAIL=hello@myhdverse.com

# ACRCloud
ACRCLOUD_HOST=
ACRCLOUD_ACCESS_KEY=
ACRCLOUD_ACCESS_SECRET=
ACRCLOUD_BUCKET_NAME=

# FreeTSA (RFC 3161)
FREETSA_URL=https://freetsa.org/tsr

# Smile Identity
SMILE_IDENTITY_API_KEY=
SMILE_IDENTITY_PARTNER_ID=
SMILE_IDENTITY_ENVIRONMENT=sandbox  # → production for live

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_WEBHOOK_SECRET=

# SendGrid (fallback email)
SENDGRID_API_KEY=

# Certificate
CERTIFICATE_BASE_URL=https://myhdverse.com/verify
```

---

## 7. Processing Pipeline

When a creator uploads a work, the following sequence executes:

```
UPLOAD PIPELINE (triggered on POST /api/works/:id/confirm)

Step 1: File validation
        → Check MIME type, file size, hash uniqueness
        → Reject if duplicate hash (same file already registered)

Step 2: SHA-256 hash generation
        → Hash the S3 object server-side
        → Store in works.fileHash

Step 3: RFC 3161 Timestamping
        → Send hash to FreeTSA
        → Receive signed timestamp token
        → Store base64 token in works.timestampToken
        → Store works.timestampedAt

Step 4: ISRC Assignment
        → Generate ISRC: [CC]-[HDV]-[YY]-[NNNNN]
        → CC = NG (Nigeria)
        → HDV = registrant code
        → YY = 2-digit year
        → NNNNN = zero-padded sequence number
        → Store in works.isrc

Step 5: ACRCloud Fingerprinting
        → Submit audio file to ACRCloud bucket
        → Store returned fingerprint ID
        → Update works.fingerprintStatus = REGISTERED
        → Queue: schedule first detection check (24h)

Step 6: Certificate PDF Generation
        → Render HTML certificate template (Puppeteer)
        → Upload PDF to S3 (certificates/ prefix)
        → Generate verification UUID
        → Create Certificate record
        → Update works.status = ACTIVE

Step 7: Payment trigger
        → If payment not yet completed → initiate Flutterwave ($2)
        → If payment already completed → skip
        → Certificate PDF only released after payment confirmed

Step 8: Notification
        → Send certificate delivery email (AWS SES)
        → Email contains: download link (signed S3 URL, 7 days)
        → Dashboard updates in real-time via polling (no websockets in MVP)
```

---

## 8. Security Requirements

```
AUTHENTICATION
✅ Passwords hashed with bcrypt (rounds: 12)
✅ JWT stored in httpOnly, Secure, SameSite=Strict cookies
✅ Refresh token rotation on every use
✅ Rate limiting: 5 requests/minute on auth endpoints (Redis)
✅ OTP: 6 digits, 10-minute expiry, single use

FILE UPLOADS
✅ Presigned S3 URLs for direct upload (never stream through API)
✅ File type validation server-side (magic bytes, not just extension)
✅ Max file size: 500MB enforced at S3 policy level
✅ S3 bucket: private, no public access
✅ Certificate PDFs: served via signed URLs (7-day expiry)

PAYMENTS
✅ Flutterwave webhook signature verification on every webhook
✅ Idempotency: check payment reference before processing
✅ Never store card data — Flutterwave handles PCI compliance

API SECURITY
✅ Helmet.js on all Express routes
✅ CORS: whitelist FRONTEND_URL only
✅ Input validation: Zod on all request bodies
✅ SQL injection: prevented by Prisma ORM parameterization
✅ All errors return generic messages to client (no stack traces in production)

DATA
✅ Works stored encrypted at rest (AWS S3 SSE-S3)
✅ Database: SSL required in production
✅ PII (name, phone, email): never logged
✅ SHA-256 hashes: publicly safe, store without restriction
```

---

## 9. Job Queue Architecture

```
Queue: certificate-pipeline (BullMQ → Redis)
  Jobs:
    - generate-hash
    - timestamp-work
    - fingerprint-work
    - generate-certificate
    - send-certificate-email

Queue: detection (BullMQ → Redis)
  Jobs:
    - check-fingerprint (scheduled, every 24h per work)
    - process-match (triggered by ACRCloud webhook)
    - send-alert-email

Queue: payments (BullMQ → Redis)
  Jobs:
    - process-webhook
    - release-certificate (after payment confirmed)

Retry policy:  3 attempts, exponential backoff (1s, 5s, 30s)
Dead letter:   Failed jobs → dead letter queue → Slack alert (post-MVP)
```

---

## 10. Automation Trigger at Creator #50

```
CURRENT (Manual detection review — Week 1 to creator #50):
  ACRCloud webhook → DetectionAlert created → Manual review 
  → Admin confirms → Email sent to creator

AUTOMATED (Post creator #50):
  ACRCloud webhook → DetectionAlert created → Confidence check
  → If High confidence → Auto-send alert email immediately
  → If Medium/Low → Queue for manual review
  → Admin dashboard shows queue

Architecture note: the DetectionAlert model and webhook 
receiver are built for automation from Day 1.
The "manual review" step is a feature flag, not a code change.
```

---

## 11. Code Standards

```typescript
// MANDATORY patterns

// 1. All async route handlers wrapped in error catcher
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 2. All external service calls have try/catch + fallback logging
// 3. All request bodies validated with Zod before touching business logic
// 4. No any types — use unknown and narrow
// 5. All database queries go through service layer — no Prisma in route handlers
// 6. Feature modules: routes → controller → service → repository pattern
// 7. Environment variables accessed only through validated config object
//    (never process.env.X directly in business logic)

// FORBIDDEN
// ❌ console.log in production code (use structured logger: pino)
// ❌ any type
// ❌ Synchronous file operations (fs.readFileSync etc.)
// ❌ Raw SQL strings
// ❌ Storing secrets in code or .env committed to git
// ❌ Returning stack traces to client
```

---

## 12. What Is In Scope (MVP Sprint)

```
✅ User registration + email/password auth
✅ Smile Identity OTP verification (KYC Tier 1)
✅ File upload to AWS S3 (presigned URLs)
✅ SHA-256 hash generation
✅ RFC 3161 timestamping (FreeTSA)
✅ ISRC assignment (NG-HDV-YY-NNNNN format)
✅ Certificate PDF generation (Puppeteer)
✅ Certificate download
✅ ACRCloud fingerprint registration
✅ Detection alert on match (email + dashboard)
✅ Flutterwave payment (pay-per-certificate)
✅ Basic dashboard: works, certificates, alerts
✅ Certificate delivery email (SES)
✅ Detection alert email (SES)
✅ Public certificate verification page
✅ Subscription tier UI (Basic/Pro shown as "Coming Soon")
```

## 13. What Is Out of Scope (Do Not Build)

```
❌ Mobile app
❌ YouTube / TikTok API monitoring
❌ Automated DMCA takedowns
❌ Revelator distribution integration
❌ Split sheets
❌ Wallet / creator payouts
❌ CMO submission workflows (MCSN etc.)
❌ Enterprise API / API keys
❌ Licensing marketplace
❌ Bulk upload tooling
❌ Admin dashboard (beyond alert review queue)
❌ Light mode
❌ Social login (Google, Apple)
❌ Two-factor authentication
❌ Websockets / real-time updates (polling only in MVP)
```

---

## 14. Definition of Done — Per Feature

A feature is DONE when:

```
✅ Functional: the happy path works end-to-end
✅ Error states: all error cases return appropriate messages
✅ Validated: Zod schema on all inputs
✅ Typed: no TypeScript errors (strict mode)
✅ Secure: auth middleware applied where required
✅ Tested: at least one integration test covering the happy path
✅ Logged: key events logged via pino (not console.log)
✅ Documented: JSDoc on all exported service functions
```

---

## 15. Sprint Completion Criteria

```
The sprint is COMPLETE when ALL of the following are true:

□ A new user can register and verify their phone via OTP
□ A verified user can upload an audio file
□ The pipeline runs: hash → timestamp → ISRC → fingerprint → certificate
□ The certificate PDF is downloadable and matches the DESIGN.md spec
□ Payment via Flutterwave processes successfully
□ Certificate is only released after payment confirmed
□ At least one detection test case passes (match detected + alert sent)
□ Creator receives certificate email and detection alert email
□ Dashboard shows works, status, and alerts correctly
□ Public verification page resolves a valid certificate ID
□ At least 1 real payment from a real user processed
□ Zero critical security issues (no exposed secrets, no auth bypasses)
```

---

*CLAUDE.md v1.0 — HD Verse MVP*
*CTO: Eniola | CEO: Metong Minwon*
*myhdverse.com | hello@myhdverse.com*
*Confidential — Internal Use Only*