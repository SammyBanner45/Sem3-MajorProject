# EcoSync: College Data Engineering Architecture & Database Report

This directory (`DE/`) contains the complete Data Engineering deliverables for the **EcoSync** sustainability and gamified carbon-tracking web application (Node.js/Express + PostgreSQL + Prisma ORM).

---

## 1. Why PostgreSQL?

### 1.1 Structural & Transactional Requirements
EcoSync was built on **PostgreSQL** due to the fundamentally relational and transactional nature of carbon tracking and gamified rewards:
1. **Strict Relational Data Modeling:** Entities such as Users, Profiles, Tasks, Proof Submissions, CO2 Emission Logs, Coupons, and Store Rewards are tightly bound by referential integrity (foreign keys with `ON DELETE CASCADE` / `ON DELETE SET NULL`).
2. **ACID Transaction Guarantees:** 
   - Reward redemptions (`redeemReward`) must deduct user point balances, check monthly redemption limits, and atomically decrement limited inventory (`stock > 0`) under `SERIALIZABLE` isolation.
   - Admin verification of photo submissions (`approveWithRewards`) must atomically approve task proofs and award milestone coupons without duplicate code issuance.
3. **Semi-Structured Telemetry in JSONB:**
   - While the core schema is relational, carbon logging requires polymorphic payloads across diverse activity verticals (travel origin/destinations, food dietary nudges, grocery basket sizes and packaging materials).
   - PostgreSQL provides first-class support for `JSONB`, allowing EcoSync to store non-atomic metadata (`co2_logs.details`) with GIN-indexable query capabilities while keeping the parent entity strictly relational.

### 1.2 Technology Comparison: PostgreSQL vs. MongoDB
During architectural design, **MongoDB** was evaluated as an alternative document-store database but was rejected for the following key reasons:
- **Financial/Gamification Ledger Integrity:** MongoDB's document model lacks declarative relational foreign key cascades. When deleting a user account (`DELETE /api/profile/me`), cascading deletions across 6 child collections would have to be manually coordinated in application logic, introducing orphaned data risks.
- **Race Conditions in Limited Stock Redemptions:** MongoDB's multi-document transactions carry higher memory and coordinator overhead compared to PostgreSQL's native MVCC and `SERIALIZABLE` transactions.
- **Relational Points & Leaderboard Queries:** Aggregating point balances across disparate activity streams (tasks, travel CO2, food CO2, grocery CO2, store redemptions) naturally fits relational algebra (relational joins, CTEs, and window functions like `RANK()`), which are natively optimized in PostgreSQL.

---

## 2. Nature of Data & Access Patterns

### 2.1 Entity Nature
- **Users & Profiles:** Core authentication identity and gamified profile state (current streak, streak milestones). Low write frequency, very high read frequency.
- **Tasks & Submissions:** Catalog of eco-activities and daily challenges linked to photo proof submissions (JPEG/PNG/WebP). Read-heavy for quest discovery, write-heavy during photo submission and admin review batches.
- **CO2 Logs:** Continuous telemetry tracking user travel distance, transport mode, food items, and grocery shopping. Write-frequent, append-mostly time-series nature.
- **Rewards & Redemptions:** Catalog of vouchers and merchandise redemptions with inventory counters. High read concurrency with strict concurrency controls on write.

### 2.2 Expected Read/Write Patterns
- **Read Heavy:** Home summary dashboard, quest browsing, profile stats, and monthly leaderboards constitute ~85% of queries.
- **Write Bursts:** Commuter peak hours (logging transit CO2) and lunch/dinner windows (logging meal eco-nudges) produce write bursts into `co2_logs`.

### 2.3 System Architecture Overview
```text
┌───────────────────────────────────────────┐
│     Client Applications (React SPA /       │
│     Capacitor Mobile WebView)            │
└─────────────────────┬─────────────────────┘
                      │ HTTP / REST / JSON
                      ▼
┌───────────────────────────────────────────┐
│     Express.js API Application Server     │
│  (Auth, Points, CO2 Rules, Admin Review)   │
└─────────────────────┬─────────────────────┘
                      │ Synchronous Facade / Async ESM
                      ▼
┌───────────────────────────────────────────┐
│     Prisma ORM 7.10.1 (@prisma/adapter-pg)│
│  Strict SSL with Root CA (Supabase cert)  │
└─────────────────────┬─────────────────────┘
                      │ Native PostgreSQL Wire Protocol
                      ▼
┌───────────────────────────────────────────┐
│  PostgreSQL Database (Hosted on Supabase  │
│  with PgBouncer connection pooling)       │
└───────────────────────────────────────────┘
```

---

## 3. Known Limitations and Future Work (Codebase Audit)

Every limitation listed below has been verified directly against the production codebase:

1. **No SQL `CHECK` Constraints:**
   - *Verification:* Audit of all migration SQL files in `backend/prisma/migrations/` confirms zero `CHECK` constraints.
   - *Impact:* Business invariants (e.g. `Reward.stock >= 0`, `Task.points >= 0`, `co2_logs.co2Kg >= 0`) are only protected by application code, leaving the database vulnerable if bypass queries occur.
2. **Missing Database Indexes on Frequent Filters:**
   - `submissions.reviewedAt`: The monthly leaderboard query filters by `reviewedAt >= startOfMonth AND reviewedAt < endOfMonth`, but there is no index on `reviewedAt`. Every leaderboard fetch performs a sequential scan.
   - `submissions.createdAt`: Used in 24-hour daily task proof checks without a secondary index.
   - `co2_logs(userId, status, createdAt)`: Daily cap checks and 3-hour duplicate travel trip checks filter by `userId`, `status`, and `createdAt`, but the schema only has a single-column index on `co2_logs(userId)`.
   - `tasks(type, challengeDate)`: Daily challenge lookups query `where: { type: 'challenge', challengeDate: { gte, lte } }` without an index on `challengeDate`.
3. **Application-Tier Points & Leaderboard Aggregation:**
   - *Verification:* `backend/src/services/points.service.js` and `leaderboard.service.js`.
   - *Impact:* To compute a single user's current point balance, the backend queries *all lifetime* approved submissions, *all lifetime* CO2 logs, and *all lifetime* redemptions, transferring raw rows to Node.js memory to sum them. Similarly, `leaderboard.service.js` fetches all monthly approved submissions with full profile joins and aggregates points using a JavaScript `Map()` instead of SQL `GROUP BY` and `SUM()`.
4. **Non-Transactional CO2 Daily Cap and Duplicate Checks:**
   - *Verification:* `backend/src/controllers/co2.controller.js` (`saveTravel`, `logFood`, `saveGrocery`).
   - *Impact:* The read of today's earned points (`findMany`) and the subsequent log insertion (`create`) are not wrapped in a database transaction or lock. Concurrent requests can race, allowing users to exceed the 5-point daily cap or log duplicate trips.
5. **Redundant Dual-Table Credential Storage (Legacy Duplication):**
   - *Verification:* `backend/prisma/migrations/20261108000000_add_users_and_link_profiles/migration.sql` and `backend/src/services/authService.js`.
   - *Impact:* Both `users` and `profiles` tables retain `email` and `passwordHash` columns. During legacy password rehashing upon login (`authService.js` lines 121–135), the application must execute updates across both tables, risking credential drift if an update fails.

---

## 4. Deliverables Index

The following deliverables are included in this directory:
- [`DE/README.md`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/README.md): System architecture, technology choices, and audited limitations.
- [`DE/er-diagram.md`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/er-diagram.md): Complete Mermaid Entity-Relationship diagram with cardinality markers and junction tables.
- [`DE/normalization.md`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/normalization.md): Normalization analysis (1NF to 3NF), functional dependencies, and intentional denormalizations.
- [`DE/schema.sql`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/schema.sql): Complete plain SQL DDL representing the real production schema.
- [`DE/sample-data.sql`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/sample-data.sql): Populated demo dataset matching real schema and seed scripts.
- [`DE/queries.sql`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/queries.sql): 13 project-specific analytical and transactional SQL queries.
- [`DE/query-outputs.md`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/query-outputs.md): Real, authentic execution outputs captured from running on a local scratch PostgreSQL 18 instance, including constraint rejection demos.
- [`DE/integration.md`](file:///Users/sambuddhabanerjee/Downloads/Projects/Sem3-MajorProject/DE/integration.md): Verbatim backend code evidence mapping CRUD operations and transactions to database tables.
