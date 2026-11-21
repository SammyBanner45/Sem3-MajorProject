# EcoSync Database Query Execution Outputs

This document records the exact, authentic execution output of each query defined in `queries.sql`, run directly against the PostgreSQL scratch database initialized from `schema.sql` and populated with `sample-data.sql`.

- **Database Engine:** PostgreSQL 18.x
- **Isolation / Safety:** Executed on isolated scratch instance `ecosync_de_scratch`.
- **Secret Hygiene:** All credential hashes are sample testing placeholders; production credentials and secrets are excluded.

---

## Q1: INSERT: User submits a new photo proof for a task

### Business Need
When a user captures an eco-activity photo via mobile/web, a new pending submission record is inserted with initial status 'pending'.

### SQL Executed
```sql
-- Query 1: INSERT a new pending photo submission
INSERT INTO "submissions" (
    "id", "userId", "taskId", "photoUrl", "status", "createdAt", "updatedAt"
) VALUES (
    '22222222-0000-4000-8000-000000000007',
    '00000000-0000-4000-8000-000000000003',
    '11111111-0000-4000-8000-000000000002',
    'uploads/sub7.jpg',
    'pending',
    '2026-11-20 20:00:00+05:30',
    '2026-11-20 20:00:00+05:30'
);

-- Verification SELECT
SELECT "id", "userId", "taskId", "photoUrl", "status", "createdAt"
FROM "submissions"
WHERE "id" = '22222222-0000-4000-8000-000000000007';
```

### Real Output
```text
INSERT 0 1
                  id                  |                userId                |                taskId                |     photoUrl     | status  |      createdAt      
--------------------------------------+--------------------------------------+--------------------------------------+------------------+---------+---------------------
 22222222-0000-4000-8000-000000000007 | 00000000-0000-4000-8000-000000000003 | 11111111-0000-4000-8000-000000000002 | uploads/sub7.jpg | pending | 2026-11-20 20:00:00
(1 row)
```

---

## Q2: UPDATE: Admin approves a pending submission with reviewer metadata

### Business Need
Admin reviews the pending queue. Approving sets status = 'approved', records reviewedAt timestamp and admin UUID.

### SQL Executed
```sql
-- Query 2: UPDATE approve a pending submission
UPDATE "submissions"
SET "status" = 'approved',
    "reviewedAt" = '2026-11-20 21:00:00+05:30',
    "reviewedBy" = '00000000-0000-4000-8000-000000000001',
    "rejectionReason" = NULL,
    "updatedAt" = '2026-11-20 21:00:00+05:30'
WHERE "id" = '22222222-0000-4000-8000-000000000005'
  AND "status" = 'pending';

-- Verification SELECT
SELECT "id", "status", "reviewedAt", "reviewedBy", "rejectionReason"
FROM "submissions"
WHERE "id" = '22222222-0000-4000-8000-000000000005';
```

### Real Output
```text
UPDATE 1
                  id                  |  status  |     reviewedAt      |              reviewedBy              | rejectionReason 
--------------------------------------+----------+---------------------+--------------------------------------+-----------------
 22222222-0000-4000-8000-000000000005 | approved | 2026-11-20 21:00:00 | 00000000-0000-4000-8000-000000000001 | 
(1 row)
```

---

## Q3: UPDATE: Conditional stock decrement during reward redemption

### Business Need
Prevents overselling when redeeming a limited-inventory reward by atomically decrementing stock only if stock > 0.

### SQL Executed
```sql
-- Query 3: UPDATE conditional atomic stock decrement
UPDATE "Reward"
SET "stock" = "stock" - 1
WHERE "id" = '77777777-0000-4000-8000-000000000003'
  AND "isActive" = true
  AND "stock" > 0;

-- Verification SELECT
SELECT "id", "brand", "title", "cost", "stock", "isActive"
FROM "Reward"
WHERE "id" = '77777777-0000-4000-8000-000000000003';
```

### Real Output
```text
UPDATE 1
                  id                  |    brand     |  title   | cost | stock | isActive 
--------------------------------------+--------------+----------+------+-------+----------
 77777777-0000-4000-8000-000000000003 | Eco Tote Co. | Jute bag |   30 |     4 | t
(1 row)
```

---

## Q4: DELETE: Remove a configured shortcut app from user launcher

### Business Need
User customizes their launcher and unlinks an external eco-app shortcut.

### SQL Executed
```sql
-- Query 4: DELETE an unlinked user app
DELETE FROM "user_apps"
WHERE "id" = '33333333-0000-4000-8000-000000000001'
  AND "userId" = '00000000-0000-4000-8000-000000000002';

-- Verification SELECT
SELECT count(*) AS remaining_count
FROM "user_apps"
WHERE "id" = '33333333-0000-4000-8000-000000000001';
```

### Real Output
```text
DELETE 1
 remaining_count 
-----------------
               0
(1 row)
```

---

## Q5: SELECT with filter + ORDER BY: Admin pending moderation queue

### Business Need
Fetch all submissions waiting for review, sorted oldest first (FIFO moderation queue).

### SQL Executed
```sql
-- Query 5: SELECT admin pending queue sorted oldest first
SELECT
    s."id" AS submission_id,
    s."userId",
    s."taskId",
    s."photoUrl",
    s."createdAt"
FROM "submissions" s
WHERE s."status" = 'pending'
ORDER BY s."createdAt" ASC;
```

### Real Output
```text
submission_id             |                userId                |                taskId                |     photoUrl     |      createdAt      
--------------------------------------+--------------------------------------+--------------------------------------+------------------+---------------------
 22222222-0000-4000-8000-000000000007 | 00000000-0000-4000-8000-000000000003 | 11111111-0000-4000-8000-000000000002 | uploads/sub7.jpg | 2026-11-20 20:00:00
(1 row)
```

---

## Q6: AGGREGATE: Total approved task points earned per user

### Business Need
Compute lifetime task completion score per participant across all approved task submissions.

### SQL Executed
```sql
-- Query 6: AGGREGATE task points per user
SELECT
    p."id" AS "userId",
    p."displayName",
    count(s."id") AS approved_tasks_count,
    coalesce(sum(t."points"), 0) AS total_task_points
FROM "profiles" p
JOIN "submissions" s ON s."userId" = p."id"
JOIN "tasks" t ON t."id" = s."taskId"
WHERE s."status" = 'approved'
GROUP BY p."id", p."displayName"
ORDER BY total_task_points DESC;
```

### Real Output
```text
userId                |   displayName   | approved_tasks_count | total_task_points 
--------------------------------------+-----------------+----------------------+-------------------
 00000000-0000-4000-8000-000000000002 | Sample User One |                    3 |                85
 00000000-0000-4000-8000-000000000003 | Sample User Two |                    2 |                70
(2 rows)
```

---

## Q7: GROUP BY + HAVING: Highly active users with more than N CO2 logs

### Business Need
Filter participants with frequent activity logs (e.g. > 1 log) for engagement badges or auditing.

### SQL Executed
```sql
-- Query 7: GROUP BY with HAVING filter on CO2 log volume
SELECT
    c."userId",
    p."displayName",
    count(c."id") AS total_logs,
    round(sum(c."co2Kg")::numeric, 2) AS total_emitted_kg,
    round(sum(c."savedKg")::numeric, 2) AS total_saved_kg
FROM "co2_logs" c
JOIN "profiles" p ON p."id" = c."userId"
WHERE c."status" = 'logged'
GROUP BY c."userId", p."displayName"
HAVING count(c."id") >= 2
ORDER BY total_logs DESC;
```

### Real Output
```text
userId                |   displayName   | total_logs | total_emitted_kg | total_saved_kg 
--------------------------------------+-----------------+------------+------------------+----------------
 00000000-0000-4000-8000-000000000002 | Sample User One |          3 |             2.40 |           1.90
(1 row)
```

---

## Q8: JOINs: Multi-table join of submissions, tasks, and reviewer profiles

### Business Need
Detailed submission audit showing applicant, task specifications, and review outcome with reviewer identity.

### SQL Executed
```sql
-- Query 8: Multi-table JOIN (submissions + tasks + applicant profile + reviewer profile)
SELECT
    s."id" AS submission_id,
    p."displayName" AS applicant,
    t."title" AS task_title,
    t."type" AS task_type,
    t."points" AS potential_points,
    s."status",
    r."displayName" AS reviewed_by_name,
    s."reviewedAt"
FROM "submissions" s
JOIN "profiles" p ON p."id" = s."userId"
JOIN "tasks" t ON t."id" = s."taskId"
LEFT JOIN "profiles" r ON r."id" = s."reviewedBy"
ORDER BY s."createdAt" DESC;
```

### Real Output
```text
submission_id             |     applicant     |         task_title          | task_type | potential_points |  status  | reviewed_by_name |     reviewedAt      
--------------------------------------+-------------------+-----------------------------+-----------+------------------+----------+------------------+---------------------
 22222222-0000-4000-8000-000000000007 | Sample User Two   | Public Transit Ride         | activity  |               15 | pending  |                  | 
 22222222-0000-4000-8000-000000000005 | Sample User Two   | Zero Single-Use Plastic Day | challenge |               50 | approved | EcoSync Admin    | 2026-11-20 21:00:00
 22222222-0000-4000-8000-000000000004 | Sample User One   | Zero Single-Use Plastic Day | challenge |               50 | approved | EcoSync Admin    | 2026-11-20 16:45:00
 22222222-0000-4000-8000-000000000003 | Sample User Two   | Bicycle Commute             | activity  |               20 | approved | EcoSync Admin    | 2026-11-19 14:00:00
 22222222-0000-4000-8000-000000000002 | Sample User One   | Public Transit Ride         | activity  |               15 | approved | EcoSync Admin    | 2026-11-18 11:15:00
 22222222-0000-4000-8000-000000000006 | Sample User Three | Proper Garbage Disposal     | activity  |               10 | rejected | EcoSync Admin    | 2026-11-15 13:00:00
 22222222-0000-4000-8000-000000000001 | Sample User One   | Bicycle Commute             | activity  |               20 | approved | EcoSync Admin    | 2026-11-14 10:30:00
(7 rows)
```

---

## Q9: SUBQUERY / NOT EXISTS: Users with no approved submissions

### Business Need
Target inactive users who have registered but have zero approved proof submissions for re-engagement nudges.

### SQL Executed
```sql
-- Query 9: NOT EXISTS subquery finding users without approved submissions
SELECT
    p."id" AS "userId",
    p."displayName",
    u."email",
    p."createdAt"
FROM "profiles" p
JOIN "users" u ON u."id" = p."id"
WHERE NOT EXISTS (
    SELECT 1
    FROM "submissions" s
    WHERE s."userId" = p."id"
      AND s."status" = 'approved'
)
ORDER BY p."createdAt" ASC;
```

### Real Output
```text
userId                |    displayName    |          email          |      createdAt      
--------------------------------------+-------------------+-------------------------+---------------------
 00000000-0000-4000-8000-000000000001 | EcoSync Admin     | admin@ecosync.example   | 2026-11-01 00:00:00
 00000000-0000-4000-8000-000000000004 | Sample User Three | sample3@ecosync.example | 2026-11-03 00:00:00
(2 rows)
```

---

## Q10: WINDOW FUNCTION: RANK() for Monthly Leaderboard (Asia/Kolkata)

### Business Need
Rank participants for November 2026 based on approved submission points reviewed within Asia/Kolkata month bounds.

### SQL Executed
```sql
-- Query 10: Window function RANK() for Monthly Leaderboard (Asia/Kolkata bounds)
WITH monthly_scores AS (
    SELECT
        p."id" AS "userId",
        p."displayName",
        coalesce(sum(t."points"), 0) AS monthly_points
    FROM "profiles" p
    JOIN "submissions" s ON s."userId" = p."id"
    JOIN "tasks" t ON t."id" = s."taskId"
    WHERE s."status" = 'approved'
      AND s."reviewedAt" >= '2026-10-31 18:30:00+00' -- 2026-11-01 00:00:00 IST
      AND s."reviewedAt" <  '2026-11-30 18:30:00+00' -- 2026-12-01 00:00:00 IST
    GROUP BY p."id", p."displayName"
)
SELECT
    RANK() OVER (ORDER BY monthly_points DESC, "displayName" ASC) AS rank,
    "displayName",
    monthly_points
FROM monthly_scores
ORDER BY rank ASC;
```

### Real Output
```text
rank |   displayName   | monthly_points 
------+-----------------+----------------
    1 | Sample User One |             85
    2 | Sample User Two |             70
(2 rows)
```

---

## Q11: JSONB QUERY: Querying vehicle mode and trip details from co2_logs.details

### Business Need
Analyze transport mode breakdown and origin-destination routes stored inside the semi-structured JSONB details column.

### SQL Executed
```sql
-- Query 11: JSONB extraction from co2_logs.details
SELECT
    c."id" AS log_id,
    c."userId",
    c."details"->>'vehicle' AS chosen_vehicle,
    c."details"->>'origin' AS origin,
    c."details"->>'destination' AS destination,
    (c."details"->>'baselineKg')::float AS baseline_kg,
    c."co2Kg" AS actual_kg,
    c."savedKg" AS saved_kg
FROM "co2_logs" c
WHERE c."type" = 'travel'
  AND c."details" ? 'vehicle'
ORDER BY c."createdAt" DESC;
```

### Real Output
```text
log_id                |                userId                | chosen_vehicle |    origin    | destination | baseline_kg | actual_kg | saved_kg 
--------------------------------------+--------------------------------------+----------------+--------------+-------------+-------------+-----------+----------
 44444444-0000-4000-8000-000000000004 | 00000000-0000-4000-8000-000000000003 | bicycle        | Hostel       | City Center |         2.1 |         0 |      2.1
 44444444-0000-4000-8000-000000000001 | 00000000-0000-4000-8000-000000000002 | bus            | College Gate | Salt Lake   |        1.65 |      0.45 |      1.2
(2 rows)
```

---

## Q12: CTE: Compute user wallet balance (Earned - Spent) across 3 tables

### Business Need
SQL equivalent of backend points.service.js: computes net balance = (Task Points + CO2 Points) - Redemption Costs.

### SQL Executed
```sql
-- Query 12: CTE computing total user balance from submissions, co2_logs, and Redemptions
WITH task_pts AS (
    SELECT
        s."userId",
        coalesce(sum(t."points"), 0) AS pts
    FROM "submissions" s
    JOIN "tasks" t ON t."id" = s."taskId"
    WHERE s."status" = 'approved'
    GROUP BY s."userId"
),
co2_pts AS (
    SELECT
        c."userId",
        coalesce(sum(c."pointsEarned"), 0) AS pts
    FROM "co2_logs" c
    WHERE c."status" = 'logged'
    GROUP BY c."userId"
),
spent_pts AS (
    SELECT
        r."userId",
        coalesce(sum(r."cost"), 0) AS pts
    FROM "Redemption" r
    GROUP BY r."userId"
)
SELECT
    p."id" AS "userId",
    p."displayName",
    coalesce(tp.pts, 0) AS task_points,
    coalesce(cp.pts, 0) AS co2_points,
    (coalesce(tp.pts, 0) + coalesce(cp.pts, 0)) AS total_earned,
    coalesce(sp.pts, 0) AS total_spent,
    ((coalesce(tp.pts, 0) + coalesce(cp.pts, 0)) - coalesce(sp.pts, 0)) AS current_balance
FROM "profiles" p
LEFT JOIN task_pts tp ON tp."userId" = p."id"
LEFT JOIN co2_pts cp ON cp."userId" = p."id"
LEFT JOIN spent_pts sp ON sp."userId" = p."id"
ORDER BY current_balance DESC;
```

### Real Output
```text
userId                |    displayName    | task_points |     co2_points     | total_earned | total_spent |  current_balance   
--------------------------------------+-------------------+-------------+--------------------+--------------+-------------+--------------------
 00000000-0000-4000-8000-000000000003 | Sample User Two   |          70 |                4.2 |         74.2 |           0 |               74.2
 00000000-0000-4000-8000-000000000002 | Sample User One   |          85 | 3.0999999999999996 |         88.1 |          30 | 58.099999999999994
 00000000-0000-4000-8000-000000000001 | EcoSync Admin     |           0 |                  0 |            0 |           0 |                  0
 00000000-0000-4000-8000-000000000004 | Sample User Three |           0 |                  0 |            0 |           0 |                  0
(4 rows)
```

---

## Q13: LEFT JOIN: Catalog redemption popularity and total revenue spent per reward

### Business Need
Marketplace analytics showing how many times each catalog reward has been redeemed and total points consumed.

### SQL Executed
```sql
-- Query 13: Per-reward redemption popularity with LEFT JOIN
SELECT
    rw."id" AS reward_id,
    rw."brand",
    rw."title",
    rw."kind",
    rw."cost",
    rw."stock" AS current_stock,
    count(rd."id") AS total_redemptions,
    coalesce(sum(rd."cost"), 0) AS total_points_consumed
FROM "Reward" rw
LEFT JOIN "Redemption" rd ON rd."rewardId" = rw."id"
GROUP BY rw."id", rw."brand", rw."title", rw."kind", rw."cost", rw."stock"
ORDER BY total_redemptions DESC, total_points_consumed DESC;
```

### Real Output
```text
reward_id               |    brand     |     title      |   kind   | cost | current_stock | total_redemptions | total_points_consumed 
--------------------------------------+--------------+----------------+----------+------+---------------+-------------------+-----------------------
 77777777-0000-4000-8000-000000000002 | Reel Cinema  | ₹100 off       | voucher  |   20 |            14 |                 1 |                    20
 77777777-0000-4000-8000-000000000001 | Campus Cafe  | ₹50 off        | voucher  |   10 |            19 |                 1 |                    10
 77777777-0000-4000-8000-000000000003 | Eco Tote Co. | Jute bag       | physical |   30 |             4 |                 0 |                     0
 77777777-0000-4000-8000-000000000004 | Green Roots  | Sponsor a tree | donation |   50 |            10 |                 0 |                     0
(4 rows)
```

---

## Constraint Rejection Demonstrations (Database Integrity Enforcement)

### Constraint Rejection: Duplicate User Email (Unique Key Violation)

```sql
INSERT INTO "users" ("id", "email", "passwordHash", "role")
VALUES ('00000000-0000-4000-8000-000000000099', 'sample1@ecosync.example', 'hash123', 'USER');
```

#### Real Database Error Message
```text
ERROR:  duplicate key value violates unique constraint "users_email_key"
DETAIL:  Key (email)=(sample1@ecosync.example) already exists.
```

---

### Constraint Rejection: Foreign Key Violation (Submission with non-existent userId)

```sql
INSERT INTO "submissions" ("id", "userId", "taskId", "photoUrl", "status", "createdAt", "updatedAt")
VALUES (
    '22222222-0000-4000-8000-000000000099',
    '99999999-9999-4999-8999-999999999999',
    '11111111-0000-4000-8000-000000000001',
    'uploads/orphan.jpg',
    'pending',
    now(),
    now()
);
```

#### Real Database Error Message
```text
ERROR:  insert or update on table "submissions" violates foreign key constraint "submissions_userId_fkey"
DETAIL:  Key (userId)=(99999999-9999-4999-8999-999999999999) is not present in table "profiles".
```

---
