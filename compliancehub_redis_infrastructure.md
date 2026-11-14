# COMPLIANCEHUB.NG — REDIS INFRASTRUCTURE AUDIT, ARCHITECTURE AND IMPLEMENTATION ACROSS THE FULL HYBRID STACK

## 1. Project Objective

Conduct a comprehensive technical audit of ComplianceHub.ng's existing infrastructure and implement a properly structured Upstash Redis integration across the Go API backend (`compliancehub-backend`) and the Next.js full-stack application (`web_app`).

The objective is not simply to install Redis or haphazardly add caching to a few HTTP endpoints.

The objective is to establish a reliable, scalable, secure, and maintainable Redis infrastructure that supports ComplianceHub.ng's multi-tenant architecture and accelerates its four interconnected product environments (**HubBusiness**, **HubExperts**, **HubAgents**, and **HubEnterprise**), alongside the administrative and staff cockpits, without compromising tenant isolation, statutory auditability, tamper-evident evidence verification, or transactional consistency.

The assignment has three distinct stages:

1. **Audit the existing architecture** and identify where Redis is needed.
2. **Produce a detailed implementation plan** and resolve outstanding architectural decisions.
3. **Implement, integrate, and test Redis** across the approved backend services, middleware, and Next.js edge/serverless routes.

**Important: Begin with the audit. Do not modify production code or alter Neon database schemas before completing the audit and securing approval on the proposed implementation plan.**

---

## 2. Existing Architectural Context

The following information reflects the verified architecture of ComplianceHub.ng:

- **Full-Stack Hybrid Architecture**:
  - **Backend API (`compliancehub-backend`)**: Developed in Go (Go 1.26+), running an HTTP REST server (`cmd/api/main.go`) deployed on Render (`render.yaml`, region Frankfurt / AWS `eu-central-1`).
  - **Frontend & Web Application (`web_app`)**: Developed in Next.js 16.2.9 with React 19, deployed on Vercel, providing four interconnected workspaces plus admin and staff suites.
- **Authoritative Database (Neon Lakebase Postgres)**:
  - Neon Lakebase PostgreSQL is the sole system of record and single source of truth (`DATABASE_URL`).
  - In Go: Connected via `github.com/jackc/pgx/v5/pgxpool` with pooled connection management.
  - In Next.js / Serverless: Connected via `@neondatabase/serverless` with HTTP query pooling.
- **Multi-Tenant Model & Data Ownership**:
  - Relational tenant hierarchy: `organisations` ➔ `tenants` (workspaces) ➔ `tenant_members` ➔ `users`.
  - External practice engagements: `engagements` link external compliance practitioners/agencies (`professional_profiles`) to client tenants with granular module-level permissions (`engagement_permissions`).
  - Tenant separation is enforced via `tenant_id` UUID foreign keys across all core domain tables (`tenant_obligations`, `documents`, `employees`, `vendors`, `aml_cases`, `privacy_processing_activities`, `activity_logs`, `invoices`, `dsar_requests`).
- **External Integration Services**:
  - **Evidence Vault**: Cloudinary SDK (`github.com/cloudinary/cloudinary-go/v2`) for tamper-evident document storage with secure signed URLs, checksum verification, and version tags.
  - **Email Relay**: Brevo SMTP relay for transaction receipts, invitation links, password resets, and regulatory deadline alerts.
  - **Payments**: Paystack API and Webhooks for monthly retainers, subscription plan upgrades, and expert booking deposits.
- **Existing Rate Limiting**:
  - Currently implemented using an in-memory `sync.Mutex` map (`backend/internal/middleware/rate_limit.go`). This in-memory limiter is lost on service restart and cannot coordinate across multiple horizontal instances on Render.
- **Target Redis Infrastructure**:
  - One shared **Upstash Redis** instance providing dual connectivity:
    - **Go Backend**: Connected via Redis TCP protocol using `github.com/redis/go-redis/v9` with client connection pooling.
    - **Next.js Web App / Edge**: Connected via Upstash REST HTTP API using `@upstash/redis` and `@upstash/ratelimit`.
  - Redis acts as a high-speed caching, distributed rate-limiting, session synchronization, and ephemeral operational state layer. It must **never** duplicate or supersede Neon as the permanent database.

---

## 3. Stage One: Comprehensive Infrastructure Audit

Before implementation, inspect all modules, handlers, and routes across both the Go backend and Next.js frontend.

For each system module, document:
- Module name and business responsibility.
- Code location (Go handler/middleware vs. Next.js route/component).
- Backend framework, runtime, and dependencies.
- Existing API endpoints and middleware chains.
- Authentication and authorization mechanisms.
- Tenant identity resolution and permission enforcement.
- Neon database query patterns, joins, and high-frequency queries.
- Existing caching mechanisms, if any.
- Background tasks, cron jobs, and email dispatches.
- External API calls (Cloudinary, Brevo, Paystack).
- Current environment variables and secrets management.
- Existing bottlenecks and recommended Redis use cases.

### 3.1 Audit Tenant Isolation

Tenant isolation is the paramount architectural invariant of ComplianceHub.ng.

Inspect the complete request lifecycle:
1. **User Authentication**: JWT verification in `middleware/auth.go` extracting `Claims` (`UserID`, `Email`, `SystemRole`, `TenantID`).
2. **Tenant Context Resolution**:
   - Internal Users: Membership lookup in `tenant_members` confirming valid role (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`, `COMPLIANCE_LEAD`).
   - External Compliance Consultants: Verification in `engagements` and `engagement_permissions` confirming delegated authority (`can_view`, `can_upload`, `can_approve`, `can_export`) for the active `module_code`.
3. **Authorization & RBAC**: Execution of role checks (`CanManageWorkspace()`, `CanManageWorkforce()`, etc.).
4. **Cache Key Construction**: Key formulation incorporating validated `tenant_id`.
5. **Cache Lookup & Reads**: Atomic fetch ensuring no key collision across tenants.
6. **Neon Database Query Fallback**: Execution of parameterized SQL containing `WHERE tenant_id = $1`.
7. **Cache Population & Writes**: Tenant-scoped key write with explicit TTL.
8. **Cache Invalidation**: Tenant-scoped deletion triggered upon database mutation.
9. **API Response Generation**: Sanitize payload ensuring zero cross-tenant metadata leakage.

**Security Requirements**:
- **Never trust client-supplied headers**: A request containing `X-Tenant-ID` must be validated against the authenticated user's verified tenant memberships in Neon or the cryptographically signed JWT.
- **No cross-tenant cache access**: A tenant's cache key must never resolve to another tenant's obligations, evidence documents, or employee records.
- **Strict server-side enforcement**: Frontend filtering is strictly cosmetic. All access boundaries must be enforced on the backend.

### 3.2 Audit Current Database Usage

Inspect the existing Neon PostgreSQL interactions across all 20+ tables:

| Domain / Table | High-Frequency Operations | Query Characteristics | Redis Opportunity |
|---|---|---|---|
| `regulatory_frameworks`, `obligations` | Master obligation catalog lookups (CAC, FIRS, NDPC, SCUML, PENCOM, ITF/NSITF) | Static, read-heavy, identical across all tenants | **Global Cache (High Value)**: In-memory/Redis TTL 24h |
| `tenants`, `organisations` | Workspace profile, plan tier, settings, and dynamic compliance score | Read on every dashboard load; expensive score aggregation | **Tenant Profile & Health Score Cache**: TTL 30m–1h |
| `tenant_obligations` | Monthly statutory calendar, deadline countdown, overdue penalty estimations | Filtered by month/year and status (`PENDING`, `COMPLETED`) | **Calendar Cache**: TTL 15m; invalidate on status update |
| `engagement_permissions` | Delegated consultant permission check for every request in HubAgents | Repeated joins between `engagements` and `engagement_permissions` | **Permission Matrix Cache**: TTL 15m; immediate invalidation |
| `professional_profiles` | HubExperts marketplace searches, filter by specialisation, rating, fee | Read-heavy public marketplace directory | **Directory Cache**: TTL 30m; invalidate on profile edit |
| `documents`, `document_versions` | Evidence vault listing, verification status, Cloudinary URL resolution | Read on document drawer load; security-critical | **Metadata Cache**: TTL 15m; invalidate on upload/review |
| `blog_posts`, `categories`, `tags` | Public regulatory intelligence news, article detail by slug, view counts | High-traffic public reads; frequent view count increments | **Post Cache & View Buffer**: TTL 2h; atomic counter |
| `in-memory rate limiter` | Login, registration, password reset attempts | Ephemeral, in-memory Go maps; non-distributed | **Distributed Sliding Window Limiter**: Atomic Redis ZSET |

---

## 4. Stage Two: Redis Architecture

### 4.1 Proposed Infrastructure

Implement one shared **Upstash Redis** instance serving the hybrid stack:

```
                        ┌──────────────────────────────────────────────┐
                        │              ComplianceHub.ng                │
                        │           Unified Platform Users             │
                        └──────────────────────┬───────────────────────┘
                                               │
                   ┌───────────────────────────┴───────────────────────────┐
                   ▼                                                       ▼
  ┌──────────────────────────────────┐                   ┌──────────────────────────────────┐
  │         Next.js Web App          │                   │          Go Core API             │
  │        (Vercel Edge/SSR)         │                   │         (Render Web API)         │
  │  - HubBusiness Public & SSR      │                   │  - Auth & Multi-Tenant Engine    │
  │  - HubExperts Directory          │                   │  - Obligations & Calendar        │
  │  - Public Intelligence / Blog    │                   │  - Cloudinary Evidence Vault     │
  │  - Paystack Webhook Receiver     │                   │  - Brevo Email Alert Worker      │
  └────────────────┬─────────────────┘                   └────────────────┬─────────────────┘
                   │                                                      │
                   │ (HTTP / REST)                                        │ (TCP / RESP3)
                   │ @upstash/redis                                       │ go-redis/v9
                   ▼                                                      ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                           Shared Upstash Redis Instance                                 │
  │                                                                                         │
  │   [chub:prod:shared:*]      Global Frameworks, Statutes, Blog Caching, Public Directory │
  │   [chub:prod:auth:*]        Distributed Rate Limiting, Revoked Tokens, Reset Sessions   │
  │   [chub:prod:business:*]    Tenant Compliance Scores, Calendar Views, Evidence Metadata │
  │   [chub:prod:agents:*]      Delegated Practice Permissions, Client Cockpit Caching      │
  │   [chub:prod:lock:*]        Distributed Locks (Document Hashes, Idempotency, Invoicing) │
  └────────────────────────────────────────┬────────────────────────────────────────────────┘
                                           │
                                           │ Fallback & Source of Truth
                                           ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                           Neon Lakebase PostgreSQL                                      │
  │                   Authoritative Multi-Tenant System of Record                           │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Redis Namespaces

Adopt a standardized, deterministic namespace hierarchy across all services:

`chub:{environment}:{subsystem}:{scope}:{resource}:{identifier}`

Where:
- `chub`: Platform identifier (**ComplianceHub.ng**).
- `{environment}`: `dev`, `staging`, or `prod`.
- `{subsystem}`: Product environment (`shared`, `auth`, `business`, `experts`, `agents`, `enterprise`, `admin`, `staff`).
- `{scope}`: `global` for platform-wide assets, or `tenant_{uuid}` for tenant-isolated data.
- `{resource}`: The entity name (`score`, `calendar`, `perms`, `profile`, `ratelimit`, `lock`).
- `{identifier}`: Specific entity UUID, slug, date partition, or client IP.

#### Standard Namespace Examples:

| Namespace Pattern | Sample Key | Description | TTL |
|---|---|---|---|
| `chub:{env}:shared:global:frameworks` | `chub:prod:shared:global:frameworks:all` | Master regulatory frameworks list | 24 Hours |
| `chub:{env}:shared:global:blog:slug:{slug}` | `chub:prod:shared:global:blog:slug:2026-tax-act` | Cached public blog article | 2 Hours |
| `chub:{env}:shared:global:blog:views` | `chub:prod:shared:global:blog:views` | Hash map of uncommitted post view increments | Flushed 5m |
| `chub:{env}:auth:global:ratelimit:{ip}` | `chub:prod:auth:global:ratelimit:102.89.44.12` | Auth endpoint sliding window rate limiter | 1 Minute |
| `chub:{env}:auth:global:blacklist:{jti}` | `chub:prod:auth:global:blacklist:tok_8f93a...` | Revoked JWT token blacklist | Remaining JWT exp |
| `chub:{env}:business:{tenant_id}:score` | `chub:prod:business:t_a1b2:score:current` | Computed compliance readiness score | 1 Hour |
| `chub:{env}:business:{tenant_id}:calendar` | `chub:prod:business:t_a1b2:calendar:2026-11` | Tenant calendar obligations for Nov 2026 | 15 Minutes |
| `chub:{env}:business:{tenant_id}:docs:list` | `chub:prod:business:t_a1b2:docs:list` | Verified evidence documents list | 15 Minutes |
| `chub:{env}:agents:{tenant_id}:perms:{user_id}` | `chub:prod:agents:t_a1b2:perms:u_e4f5` | Delegated consultant permission matrix | 15 Minutes |
| `chub:{env}:experts:global:profile:{id}` | `chub:prod:experts:global:profile:p_c7d8` | Verified expert directory profile | 30 Minutes |
| `chub:{env}:lock:global:idempotency:{key}` | `chub:prod:lock:global:idempotency:pay_91a0` | Paystack webhook processing lock | 24 Hours |

### 4.3 Tenant Isolation Requirements

1. **Server-Side Identity Verification**: Keys with `{tenant_id}` must strictly originate from verified server-side claims (`TenantContext`), never from client query strings or untrusted bodies.
2. **Deterministic Scoping**: Every tenant read, write, and invalidation must explicitly specify the tenant's UUID in the key prefix.
3. **No Wildcard Flushes**: Cross-tenant wildcard deletions (`FLUSHDB` or broad `KEYS *`) are strictly prohibited in production.
4. **Tenant Invalidation Helper**: Cache invalidation must utilize prefix-targeted scanning (e.g., `SCAN` with `chub:prod:business:{tenant_id}:*`) to ensure Tenant A cannot flush Tenant B's cached records.
5. **Zero Credential Exposure**: Redis tokens and connection strings must remain server-side only. Next.js public bundles must never contain `UPSTASH_REDIS_REST_TOKEN`.

### 4.4 Shared Redis Integration Modules

Avoid fragmented, ad-hoc Redis calls by introducing clean, idiomatic integration modules:

#### Go Backend (`backend/internal/cache/redis.go`):
- Connection pool lifecycle management using `go-redis/v9`.
- Health check ping (`Ping(ctx)`).
- Helper methods:
  - `GetTenantKey(subsystem, tenantID, resource, identifier string) string`
  - `GetJSON(ctx, key string, dest interface{}) error`
  - `SetJSON(ctx, key string, val interface{}, ttl time.Duration) error`
  - `DeleteTenantPattern(ctx, tenantID string) error`
  - `AcquireLock(ctx, lockKey string, ttl time.Duration) (bool, error)`

#### Next.js Web App (`web_app/src/lib/redis.ts`):
- Initialized `@upstash/redis` client using `process.env.UPSTASH_REDIS_REST_URL` and `process.env.UPSTASH_REDIS_REST_TOKEN`.
- Edge-compatible typed helper wrappers with resilient error trapping.

---

## 5. Stage Three: Identify and Implement Redis Use Cases

### 5.1 Application and API Caching

#### 1. Master Regulatory Frameworks & Statutory Obligations Catalog
- **Owning Service**: Go Backend & Next.js Public Pages.
- **Source**: Neon `regulatory_frameworks` and `obligations` tables.
- **Pattern**: Cache-aside with 24-hour TTL.
- **Benefit**: Eliminates redundant database roundtrips for CAC, NRS/FIRS, NDPC, and SCUML statutory rules loaded on every onboarding flow and compliance check.
- **Invalidation**: Invalidated by Admin/Staff upon regulatory amendment updates.

#### 2. Tenant Compliance Readiness Score
- **Owning Service**: Go Backend (`handlers/admin.go`, `handlers/onboarding.go`).
- **Source**: Neon aggregation of `tenant_obligations` completed vs. overdue.
- **Pattern**: Cache-aside with 1-hour TTL.
- **Benefit**: The compliance score is displayed on every business dashboard page, navbar pill, and mobile view. Caching eliminates heavy SQL aggregations on routine page navigations.
- **Invalidation**: Instantly evicted when an obligation status is updated or new evidence is verified.

#### 3. Monthly Statutory Obligations Calendar
- **Owning Service**: Go Backend (`handlers/calendar.go`).
- **Source**: Neon `tenant_obligations` joined with `obligations`.
- **Key**: `chub:{env}:business:{tenant_id}:calendar:{year}-{month}`
- **Pattern**: Cache-aside with 15-minute TTL.
- **Benefit**: Provides instantaneous calendar rendering for business operators and compliance leads.

#### 4. HubExperts Verified Marketplace Profiles
- **Owning Service**: Next.js App (`app/experts/page.tsx`, `app/experts/[id]/page.tsx`) & Go API (`handlers/practice.go`).
- **Source**: Neon `professional_profiles` joined with `users`.
- **Pattern**: Cache-aside with 30-minute TTL.
- **Benefit**: High-speed public browsing for businesses searching for accredited DPCOs, tax practitioners, and AML consultants.

#### 5. Public Regulatory Intelligence Blog
- **Owning Service**: Next.js App (`app/blog/page.tsx`, `app/blog/[slug]/page.tsx`) & Go API (`handlers/blog.go`).
- **Source**: Neon `blog_posts`, `blog_categories`, `blog_tags`.
- **Pattern**: Cache-aside with 2-hour TTL.
- **Benefit**: Offloads all public traffic from the primary Neon database during news spikes and email campaign dispatches.

---

### 5.2 Authentication, Permissions, and Delegated Access

#### 1. Delegated Consultant Permission Matrix (HubAgents)
- **Problem**: When a compliance agency manages 20+ client tenants, every API call verifies permissions across `engagements` and `engagement_permissions` (`can_view`, `can_upload`, `can_approve`, `can_export`).
- **Redis Solution**: Cache the consultant's permission map in Redis:
  `chub:{env}:agents:{tenant_id}:perms:{user_id}` (TTL: 15 Minutes).
- **Invalidation**: Evicted immediately if the business revokes access or alters module scopes in HubBusiness settings.

#### 2. Distributed JWT Token Revocation (Blacklist)
- **Problem**: Standard stateless JWT tokens cannot be revoked before expiration if a staff member is offboarded, a password is changed, or a session is terminated.
- **Redis Solution**: Store revoked JWT `jti` identifiers in Redis with a TTL matching the token's remaining expiration time:
  `chub:{env}:auth:global:blacklist:{jti}`.
- **Middleware Check**: If `blacklist:{jti}` exists, reject the request with HTTP 401 Unauthorized.

---

### 5.3 Distributed Rate Limiting

Replace the existing in-memory limiter in `backend/internal/middleware/rate_limit.go` with an Upstash-backed sliding-window rate limiter:

| Endpoint Tier | Target Routes | Rate Limit Policy | Redis Key Pattern |
|---|---|---|---|
| **Tier 1: Auth Endpoints** | `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/forgot-password` | 10 attempts / minute / IP | `chub:{env}:auth:global:ratelimit:auth:{ip}` |
| **Tier 2: Public Inquiries** | `/api/v1/support/tickets`, `/api/v1/chat/message`, Contact forms | 15 requests / minute / IP | `chub:{env}:auth:global:ratelimit:public:{ip}` |
| **Tier 3: Document Uploads** | `/api/v1/documents/upload`, Cloudinary signed requests | 20 uploads / hour / tenant | `chub:{env}:auth:tenant:{tenant_id}:ratelimit:upload` |
| **Tier 4: General API** | Authenticated business/practice endpoints | 120 requests / minute / user | `chub:{env}:auth:user:{user_id}:ratelimit:api` |

**Resilience Requirement**: If Redis is unreachable, the rate limiter must gracefully fall back to local in-memory limiting without dropping user requests.

---

### 5.4 Temporary Operational Data & Distributed Locks

#### 1. Password Reset Tokens & Verification State
- **Storage**: Store short-lived reset tokens with a 15-minute TTL:
  `chub:{env}:auth:global:reset_token:{token}` ➔ `user_id`.
- **Atomic Consumption**: Utilize Redis `GETDEL` so a token can only be consumed exactly once, eliminating replay windows.

#### 2. Paystack Webhook Idempotency Locks
- **Problem**: Webhook retries from payment gateways can produce duplicate invoice settlements or double-crediting.
- **Redis Solution**: Set an idempotency key upon receiving a webhook:
  `SET chub:{env}:lock:global:idempotency:{event_id} "PROCESSING" NX EX 86400`.
- If the key already exists, return HTTP 200 immediately and skip processing.

#### 3. Evidence Document Tamper-Evident Hashing Lock
- Prevent simultaneous duplicate uploads of the exact same statutory document by acquiring a 30-second distributed lock on the document SHA-256 checksum during upload processing.

---

### 5.5 Real-Time Notifications & Operational Counters

#### 1. Blog View Count Buffering
- Rather than issuing an immediate `UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1` on every page visit (which locks Neon database rows), increment an atomic Redis counter:
  `HINCRBY chub:{env}:shared:global:blog:views {post_id} 1`.
- A lightweight scheduled background task in Go flushes buffered increments to Neon every 5 minutes.

#### 2. Support Live Chat Presence & Active Sessions
- Track online presence for support staff and visitors using Redis keys with 60-second TTLs refreshed via WebSocket or SSE heartbeats.

---

### 5.6 Background Jobs & Scheduled Processing

#### 1. Statutory Deadline Alert Dispatcher
- Scheduled daily cron queries upcoming deadlines (7 days, 3 days, 1 day, and due today).
- Pushes notification payloads into a Redis list / stream: `chub:{env}:queue:alerts:email`.
- Go worker consumes alerts, prepares Brevo email templates, and sends reminders without blocking HTTP endpoints.

#### 2. Audit Report & Export Job Queue
- When generating large CSV/PDF compliance handoff packs or employee audit schedules, queue the export task in Redis and notify the user via webhook or in-app notification when ready.

---

## 6. Cache Consistency and Invalidation Strategy

A cache is only valuable if its contents can be completely trusted.

### Core Rules for Invalidation:
1. **Commit First, Invalidate Second**: Cache invalidation must occur **only after** the Neon PostgreSQL transaction has successfully committed. A failed or rolled-back SQL transaction must never trigger cache updates.
2. **Delete Rather Than Mutate**: Prefer deleting (invalidating) keys rather than updating cached payloads in place, preventing race conditions from concurrent updates.
3. **Explicit Invalidation Matrix**:

| Business Event | Mutated Table | Invalidation Action |
|---|---|---|
| Obligation completed / approved | `tenant_obligations` | Delete `chub:{env}:business:{tenant_id}:calendar:*`<br>Delete `chub:{env}:business:{tenant_id}:score:current` |
| New document uploaded or verified | `documents`, `document_versions` | Delete `chub:{env}:business:{tenant_id}:docs:list`<br>Delete `chub:{env}:business:{tenant_id}:score:current` |
| Delegated access granted / revoked | `engagements`, `engagement_permissions` | Delete `chub:{env}:agents:{tenant_id}:perms:{user_id}` |
| Expert profile updated | `professional_profiles` | Delete `chub:{env}:experts:global:profile:{id}` |
| Regulatory statute amended | `regulatory_frameworks`, `obligations` | Delete `chub:{env}:shared:global:frameworks:*` |
| Blog post published / updated | `blog_posts` | Delete `chub:{env}:shared:global:blog:slug:{slug}`<br>Delete `chub:{env}:shared:global:blog:recent` |

4. **Stampede Prevention**: For high-volume keys, apply a random TTL jitter (e.g., ±10%) to prevent simultaneous expiration waves.

---

## 7. Failure Handling and Resilience

**Redis must never become a single point of failure.**

### Fallback Policy:
- **Read Operations (Fail-Open to Neon)**:
  - If Redis fails, times out (>150ms), or returns an error, log the warning and execute the standard SQL query against Neon Lakebase Postgres.
  - Return the valid data to the user without surfacing any HTTP error.
- **Rate Limiting (Fail-Safe with Local Fallback)**:
  - If Redis is unavailable, fall back to the existing in-memory Go limiter (`middleware/rate_limit.go`) to prevent credential stuffing while ensuring legitimate traffic is not blocked.
- **Idempotency Locks (Fail-Safe)**:
  - If Redis locking fails, check Neon for existing transaction records before executing payment mutations.
- **Circuit Breaker**:
  - If consecutive Redis failures exceed 5 within 30 seconds, trip the circuit breaker and bypass Redis lookups for 60 seconds to protect application latency.

---

## 8. Upstash Configuration and Deployment

### 8.1 Required Environment Variables

Configure the following secrets across the deployment environments:

#### Render (`compliancehub-backend`):
```bash
# Redis TCP Connection (Go redis/v9)
REDIS_URL="rediss://default:YOUR_UPSTASH_TOKEN@YOUR_UPSTASH_ENDPOINT:6379"

# Redis Namespace Prefix
REDIS_ENV="prod" # "dev" in local, "prod" in production
```

#### Vercel (`web_app`):
```bash
# Upstash REST API (Edge & Serverless)
UPSTASH_REDIS_REST_URL="https://YOUR_UPSTASH_ENDPOINT.upstash.io"
UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_REST_TOKEN"

# Public Environment Indicator
NEXT_PUBLIC_APP_ENV="production"
```

### 8.2 Security & Protection Rules:
1. **Zero Client Bundling**: `UPSTASH_REDIS_REST_TOKEN` and `REDIS_URL` must never be prefixed with `NEXT_PUBLIC_`.
2. **Encrypted Transport**: All Redis connections must use TLS (`rediss://` for TCP, `https://` for REST).
3. **Restricted Network**: Ensure Redis access is bound to server environments only.

---

## 9. Monitoring and Observability

Implement operational visibility across both runtimes:

1. **Health Check Endpoint (`/api/health`)**:
   - Update `main.go` health check to verify Redis connectivity alongside Neon, Cloudinary, and Brevo:
   ```json
   {
     "status": "ok",
     "database": "Neon Lakebase Postgres (connected)",
     "redis": "Upstash Redis (connected, latency: 12ms)",
     "storage": "Cloudinary Evidence Vault (configured)",
     "email": "Brevo SMTP Relay (active)",
     "region": "frankfurt"
   }
   ```
2. **Structured Logging**:
   - Log cache events with standardized fields: `timestamp`, `event` (`CACHE_HIT`, `CACHE_MISS`, `CACHE_SET`, `CACHE_ERR`), `key`, `duration_ms`.
   - Never log sensitive payload values, user passwords, or tokens.
3. **Key Metrics to Track**:
   - Overall Cache Hit Ratio (Target: >85% for frameworks and public profiles).
   - Redis command execution latency (Target: <20ms for REST, <5ms for TCP).
   - Frequency of Neon fallback queries.
   - Rate limit rejection counts by IP.

---

## 10. Service-by-Service Implementation Matrix

| Module / Area | Audit Findings | Approved Redis Use Cases | Primary Files to Change | Required Tests |
|---|---|---|---|---|
| **Auth & Rate Limiting** | Currently in-memory `sync.Mutex` map in Go | Distributed sliding window rate limiter, JWT blacklist, reset token storage | `backend/internal/middleware/rate_limit.go`<br>`backend/internal/middleware/auth.go`<br>`backend/internal/handlers/auth_tenant.go` | Brute force simulation, token revocation test, Redis outage fallback test |
| **HubBusiness Cockpit** | Compliance score and calendar aggregated on every visit | Cached readiness score, cached monthly calendar, document metadata cache | `backend/internal/handlers/calendar.go`<br>`backend/internal/handlers/documents.go`<br>`backend/internal/handlers/onboarding.go` | Multi-tenant isolation test, obligation completion invalidation test |
| **HubAgents Practice** | Multi-table joins for delegated consultant permissions on every call | Cached consultant permission matrix (`can_view`, `can_upload`, `can_approve`) | `backend/internal/handlers/practice.go`<br>`backend/internal/middleware/auth.go` | Permission revocation test, cross-client isolation test |
| **HubExperts Marketplace** | Repeated database queries for public expert directory and profiles | Cached expert profiles, specialisation search results | `backend/internal/handlers/practice.go`<br>`web_app/src/app/experts/page.tsx` | Cache hit benchmark, profile update invalidation test |
| **Regulatory Catalog** | Static framework data queried repeatedly across onboarding | Global cached regulatory frameworks catalog (CAC, NRS, NDPC, SCUML) | `backend/internal/db/schema.go`<br>`web_app/src/lib/compliance-data.ts` | Framework retrieval test, 24h TTL test |
| **Public Blog / News** | Direct SQL reads on every article view; row locks on view increments | Cached articles, categories, buffered view counts in Redis hash | `backend/internal/handlers/blog.go`<br>`web_app/src/app/blog/[slug]/page.tsx` | View buffer flush test, article edit invalidation test |
| **Payments & Commercial** | Potential duplicate webhook processing from Paystack | Distributed idempotency locks on payment event IDs | `backend/internal/handlers/invoices.go` | Duplicate webhook replay test |

---

## 11. Testing and Acceptance Criteria

Implementation is not complete simply because Redis returns `PONG`. The integration must satisfy all five verification suites:

### 1. Multi-Tenant Isolation Suite
- Create two test tenants (`Tenant A` and `Tenant B`).
- Execute operations in `Tenant A` and verify that `Tenant B` cannot read, overwrite, or invalidate `Tenant A`'s cached score, calendar, or evidence documents.
- Verify that manipulating client headers (`X-Tenant-ID`) cannot bypass server-side tenant key derivation.

### 2. Cache Invalidation & Consistency Suite
- Confirm cache miss on first request ➔ data fetched from Neon ➔ cache populated with correct TTL.
- Confirm cache hit on second request with zero Neon database queries.
- Update an obligation in Neon ➔ verify the corresponding calendar and score cache keys are deleted.
- Verify that subsequent requests fetch fresh data from Neon and repopulate the cache.

### 3. Failure & Resilience Suite
- Simulate Redis unavailability (e.g., invalid connection string or network block).
- Verify all read requests fall back to Neon without returning 500 errors.
- Verify rate limiting gracefully falls back to local in-memory limiting.

### 4. Distributed Rate Limiting Suite
- Dispatch 15 rapid login attempts from a single IP.
- Confirm requests 1–10 succeed or return valid auth responses, and requests 11–15 receive HTTP 429 Too Many Requests with retry headers.

### 5. Performance Benchmark Suite
- Measure endpoint response times before and after Redis caching:
  - Regulatory frameworks endpoint: Target >80% latency reduction.
  - Compliance dashboard summary: Target >60% latency reduction.
  - Expert profile view: Target >75% latency reduction.

---

## 12. Questions the Agent Must Resolve Before Implementation

1. **Phasing**: Should the Go backend TCP integration and Next.js REST integration be rolled out together or staged?
   - *Recommendation*: Phase 1 implements Go backend caching and rate limiting. Phase 2 introduces Next.js edge caching for public blog and directory routes.
2. **Upstash Plan Sizing**: Does the free or standard Upstash tier support expected throughput?
   - *Recommendation*: Start with Upstash Serverless (10,000 commands/day free, auto-scaling to standard pay-as-you-go). Monitor daily command volume during staging.
3. **Session Revocation Strategy**: Should all active JWTs check Redis on every request?
   - *Recommendation*: Check Redis only for blacklisted tokens (`EXISTS blacklist:{jti}`). Since 99.9% of tokens are valid, this avoids querying non-existent session records.

---

## 13. Phased Rollout Strategy

- **Phase 1 — Audit & Architecture Approval**:
  - Review this document against all production repositories, schemas, and configurations.
- **Phase 2 — Infrastructure & Module Provisioning**:
  - Provision Upstash Redis instance; configure `REDIS_URL` on Render and `UPSTASH_REDIS_REST_*` on Vercel.
  - Implement `backend/internal/cache/redis.go` and `web_app/src/lib/redis.ts`.
- **Phase 3 — Core Pilot (Distributed Rate Limiting & Health Check)**:
  - Migrate `middleware/rate_limit.go` to Redis sliding window.
  - Add Redis status to `/api/health`.
- **Phase 4 — High-Value Read Caching**:
  - Implement caching for master frameworks, tenant compliance scores, and calendar views.
- **Phase 5 — Practice Management & Delegated Permissions**:
  - Implement caching for HubAgents engagement permissions and expert profiles.
- **Phase 6 — Validation, Benchmarking & Production Handoff**:
  - Execute tenant isolation tests, benchmark latency improvements, and document runbook.

---

## 14. Non-Negotiable Engineering Principles

1. **Neon Lakebase Postgres is the Sole Source of Truth**: Redis is strictly an optimization, caching, and short-lived coordination layer.
2. **Tenant Isolation is Unconditional**: Every tenant-specific key must be cryptographically or server-side validated and prefixed with the tenant UUID.
3. **Commit Before Invalidation**: No cache invalidation or update shall occur prior to a successful Neon database transaction commit.
4. **Never Expose Redis Secrets**: Client bundles must never contain Redis URLs, tokens, or credentials.
5. **Graceful Degradation**: A Redis outage must never prevent a business from viewing their compliance obligations or submitting statutory filings.
6. **No Unapproved Infrastructure Purchases**: Work within standard serverless tiers without unapproved billing commitments.
7. **Complete Audit Trail**: All compliance-relevant actions continue to be permanently written to the `activity_logs` table in Neon.
