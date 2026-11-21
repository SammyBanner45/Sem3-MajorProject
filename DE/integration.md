# EcoSync Backend Database Integration Evidence

This document provides concrete, verifiable evidence of how the Node.js/Express backend connects to and executes operations against PostgreSQL via Prisma ORM (`@prisma/client` and `@prisma/adapter-pg`).

---

## 1. Database Connection & Client Architecture

### 1.1 Connection Setup with Strict SSL & Supabase Root CA
Prisma 7 uses the `@prisma/adapter-pg` driver adapter. Node-postgres replaces explicit SSL config if SSL URL parameters exist, so `src/lib/prisma.js` strips them and applies strict SSL verification against Supabase's production CA.

**File:** `backend/src/lib/prisma.js`  
**Lines:** 6–42
```javascript
function getPostgresConfig(connectionString) {
  const url = new URL(connectionString);
  // node-postgres replaces its explicit `ssl` config when SSL parameters are
  // present in the connection string. Remove those parameters so the bundled
  // Supabase CA and strict certificate verification are always applied.
  for (const parameter of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
    url.searchParams.delete(parameter);
  }

  return {
    connectionString: url.toString(),
    ssl: {
      ca: fs.readFileSync(path.resolve(__dirname, '../generated/supabase-prod-ca-2021.crt'), 'utf8'),
      rejectUnauthorized: true,
    },
    max: 1,
  };
}

function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL must be set before creating Prisma Client');
  }

  if (!prismaPromise) {
    prismaPromise = Promise.all([
      import('../generated/prisma/client.mts'),
      import('@prisma/adapter-pg'),
    ]).then(([{ PrismaClient }, { PrismaPg }]) => {
      const adapter = new PrismaPg(getPostgresConfig(connectionString));
      return new PrismaClient({ adapter });
    }).catch((error) => {
      prismaPromise = undefined;
      throw error;
    });
  }

  return prismaPromise;
}
```

---

## 2. CREATE Operations

### 2.1 User Signup (Atomic Transaction across `users` and `profiles`)
**File:** `backend/src/services/authService.js`  
**Lines:** 88–96
```javascript
    created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { id, email, passwordHash, role: 'USER' },
      });
      const profile = await tx.profile.create({
        data: { id, displayName },
      });
      return { user, profile };
    });
```
- **Corresponding SQL:**
  ```sql
  BEGIN;
  INSERT INTO "users" ("id", "email", "passwordHash", "role") VALUES ($1, $2, $3, 'USER');
  INSERT INTO "profiles" ("id", "displayName") VALUES ($1, $4);
  COMMIT;
  ```

### 2.2 Task Proof Submission
**File:** `backend/src/services/submissions.service.js`  
**Lines:** 236–252
```javascript
    const submission = await prisma.submission.create({
      data: {
        userId,
        taskId,
        photoUrl,
        status: 'pending'
      },
      include: {
        task: {
          select: {
            title: true,
            type: true,
            points: true
          }
        }
      }
    });
```
- **Corresponding SQL:**
  ```sql
  INSERT INTO "submissions" ("id", "userId", "taskId", "photoUrl", "status", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), $1, $2, $3, 'pending', now(), now())
  RETURNING *;
  ```

### 2.3 CO2 Travel Log Creation
**File:** `backend/src/controllers/co2.controller.js`  
**Lines:** 56–60
```javascript
    const log = await prisma.co2Log.create({ data: {
      userId: req.user.id, type: 'travel', status: 'logged', co2Kg: savings.co2Kg, savedKg: savings.savedKg, pointsEarned: award.pointsEarned, chosenVehicle: result.vehicle, distanceKm: result.distanceKm,
      details: { origin: result.origin, destination: result.destination, vehicle: result.vehicle, chosenVehicle: result.vehicle, baselineKg: savings.baselineKg, approximate: result.approximate },
      loggedAt: new Date()
    } });
```
- **Corresponding SQL:**
  ```sql
  INSERT INTO "co2_logs" ("id", "userId", "type", "status", "co2Kg", "savedKg", "pointsEarned", "chosenVehicle", "distanceKm", "details", "loggedAt", "createdAt")
  VALUES (gen_random_uuid(), $1, 'travel', 'logged', $2, $3, $4, $5, $6, $7::jsonb, now(), now())
  RETURNING *;
  ```

---

## 3. READ Operations

### 3.1 Monthly Leaderboard Fetch
**File:** `backend/src/services/leaderboard.service.js`  
**Lines:** 48–60
```javascript
  const submissions = await prisma.submission.findMany({
    where: {
      status: 'approved',
      // Approved legacy rows with null reviewedAt are intentionally excluded:
      // their approval month cannot be established reliably.
      reviewedAt: { gte: range.startAt, lt: range.endAt },
    },
    select: {
      userId: true,
      status: true,
      task: { select: { points: true } },
      profile: { select: { displayName: true } },
    },
  });
```
- **Corresponding SQL:**
  ```sql
  SELECT s."userId", s."status", t."points", p."displayName"
  FROM "submissions" s
  JOIN "tasks" t ON t."id" = s."taskId"
  JOIN "profiles" p ON p."id" = s."userId"
  WHERE s."status" = 'approved'
    AND s."reviewedAt" >= $1 AND s."reviewedAt" < $2;
  ```

### 3.2 Wallet Point Data Read (Parallel Batch Read)
**File:** `backend/src/services/points.service.js`  
**Lines:** 14–22
```javascript
async function readPointData(userId, client) {
  const [submissions, logs, redemptions] = await Promise.all([
    client.submission.findMany({ where: { userId, status: 'approved' }, include: { task: true }, orderBy: { createdAt: 'desc' } }),
    client.co2Log.findMany({ where: { userId, status: 'logged' }, orderBy: { createdAt: 'desc' } }),
    client.redemption.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  ]);
  return { submissions, logs, redemptions };
}
```

---

## 4. UPDATE Operations (Transactions & Concurrency Controls)

### 4.1 Admin Approval with Rewards (`SERIALIZABLE` + Retry on `P2034` / `P2002`)
**File:** `backend/src/controllers/admin.controller.js`  
**Lines:** 14–43
```javascript
async function approveWithRewards(submissionId, reviewedBy, reviewedAt) {
  for (let attempt = 0; attempt < SERIALIZATION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.findUnique({ where: { id: submissionId } });
        if (!submission) throw new ReviewConflict(404, 'Submission not found');
        if (submission.status !== 'pending') {
          throw new ReviewConflict(409, `Cannot update submission with status '${submission.status}'. Only pending submissions can be reviewed.`);
        }

        const updated = await tx.submission.update({
          where: { id: submissionId },
          data: { status: 'approved', reviewedAt, reviewedBy, rejectionReason: null },
          include: {
            task: { select: { id: true, title: true, points: true, type: true } },
            profile: { select: { id: true, displayName: true, email: true } },
          },
        });

        await awardHistoricalMilestonesInTransaction(tx, submission.userId);
        return updated;
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error instanceof ReviewConflict) throw error;
      if (error?.code !== 'P2034' && error?.code !== 'P2002') throw error;
      if (attempt === SERIALIZATION_RETRIES - 1) throw error;
    }
  }
  throw new Error('Could not approve submission after serialization retries.');
}
```
- **Corresponding SQL:**
  ```sql
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  UPDATE "submissions"
  SET "status" = 'approved', "reviewedAt" = $1, "reviewedBy" = $2, "rejectionReason" = NULL, "updatedAt" = now()
  WHERE "id" = $3 AND "status" = 'pending';
  -- Followed by milestone coupon insertion in tx if eligible
  ```

### 4.2 Reward Redemption (`SERIALIZABLE` + Atomic Conditional Stock Decrement)
**File:** `backend/src/services/rewards.service.js`  
**Lines:** 25–39
```javascript
async function redeemReward(userId, rewardId, client) {
  return client.$transaction(async (tx) => {
    const reward = await tx.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) throw new RewardConflict('Reward is not available.');
    const summary = await getPointsSummary(userId, tx);
    if (summary.balance < reward.cost) throw new RewardConflict(`You need ${(reward.cost - summary.balance).toFixed(2)} more points.`);
    const { start, end } = kolkataMonthBounds();
    const previous = await tx.redemption.count({ where: { userId, rewardId, createdAt: { gte: start, lt: end } } });
    if (previous) throw new RewardConflict('This offer has already been redeemed this month.');
    const stockUpdate = await tx.reward.updateMany({ where: { id: rewardId, isActive: true, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
    if (!stockUpdate.count) throw new RewardConflict('This reward is out of stock.');
    const redemption = await tx.redemption.create({ data: { userId, rewardId, cost: reward.cost, code: makeCode(), status: 'active', expiresAt: new Date(Date.now() + reward.validDays * 24 * 60 * 60 * 1000) }, include: { reward: true } });
    return redemption;
  }, { isolationLevel: 'Serializable' });
}
```
- **Corresponding SQL:**
  ```sql
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  -- Decrement stock conditionally:
  UPDATE "Reward"
  SET "stock" = "stock" - 1
  WHERE "id" = $1 AND "isActive" = true AND "stock" > 0;
  -- Insert redemption:
  INSERT INTO "Redemption" ("id", "userId", "rewardId", "cost", "code", "status", "expiresAt", "createdAt")
  VALUES (gen_random_uuid(), $2, $1, $3, $4, 'active', $5, now());
  ```

---

## 5. DELETE Operations & Foreign Key Cascades

### 5.1 Removing a User App Shortcut
**File:** `backend/src/controllers/apps.controller.js`  
**Lines:** 31–36
```javascript
async function deleteApp(req, res, next) {
  try {
    if (!uuidPattern.test(req.params.id || '')) return res.status(400).json({ error: 'App id must be a UUID' });
    const result = await prisma.userApp.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    if (!result.count) return res.status(404).json({ error: 'App not found' });
    return res.status(204).send();
  } catch (error) { return next(error); }
}
```
- **Corresponding SQL:**
  ```sql
  DELETE FROM "user_apps" WHERE "id" = $1 AND "userId" = $2;
  ```

### 5.2 Account Deletion with Database Foreign Key Cascade (`ON DELETE CASCADE`)
**File:** `backend/src/services/profileService.js`  
**Lines:** 39–46
```javascript
async function deleteMyAccount(prisma, userId) {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    if (error.code === 'P2025') throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
    throw error;
  }
}
```
- **Database Cascade Execution:**
  When executing `DELETE FROM "users" WHERE "id" = $1;`, PostgreSQL automatically cascades deletions through foreign key definitions in `schema.prisma`:
  - `profiles` (`profiles_id_fkey`: `ON DELETE CASCADE`)
  - `submissions` (`submissions_userId_fkey`: `ON DELETE CASCADE`)
  - `user_apps` (`user_apps_userId_fkey`: `ON DELETE CASCADE`)
  - `co2_logs` (`co2_logs_userId_fkey`: `ON DELETE CASCADE`)
  - `Redemption` (`Redemption_userId_fkey`: `ON DELETE CASCADE`)
  - `user_coupons` (`user_coupons_userId_fkey`: `ON DELETE CASCADE`)

---

## 6. Division of Responsibility: Database vs. Application Code

| Rule / Requirement | Enforced By | Implementation Mechanism |
|---|---|---|
| Primary Key Uniqueness | **DATABASE** | `PRIMARY KEY ("id")` |
| Unique Emails & Redemption Codes | **DATABASE** | `UNIQUE INDEX` on `users.email`, `user_coupons.code`, `Redemption.code` |
| Foreign Key Referential Integrity | **DATABASE** | `REFERENCES ... ON DELETE CASCADE / SET NULL` |
| Enum Value Validation | **DATABASE** | PostgreSQL `ENUM` types (`Role`, `TaskType`, `SubmissionStatus`, etc.) |
| Column Nullability & Defaults | **DATABASE** | `NOT NULL`, `DEFAULT now()`, `DEFAULT 'pending'` |
| Negative Stock / Value Prevention | **APP** | `WHERE stock > 0` conditional update (Missing SQL `CHECK` constraint) |
| Daily 5-Points CO2 Cap | **APP** | `co2Rules.js:awardWithinDailyCap()` calculation before insert |
| Daily 10 Logs Limit | **APP** | `co2Rules.js:canAddCategoryLog()` count check |
| 1 Proof per Task per Day Cap | **APP** | `submissions.service.js:createSubmission()` `findFirst()` check |
| 24h Challenge Expiration Window | **APP** | `submissions.service.js:isSameKolkataDate()` |
| File Size & MIME Whitelist | **APP** | Multer middleware limits (5 MB, JPEG/PNG/WebP) |
| Monthly Reward Redemption Limit | **APP** | `rewards.service.js:redeemReward()` `count()` check |
