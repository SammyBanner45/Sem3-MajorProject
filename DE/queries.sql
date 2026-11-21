-- ============================================================================
-- Q1: INSERT: User submits a new photo proof for a task
-- Business Need: When a user captures an eco-activity photo via mobile/web, a new pending submission record is inserted with initial status 'pending'.
-- Expected Result Shape: INSERT 0 1 followed by 1 row showing the newly submitted record with status 'pending'.
-- ============================================================================
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

-- ============================================================================
-- Q2: UPDATE: Admin approves a pending submission with reviewer metadata
-- Business Need: Admin reviews the pending queue. Approving sets status = 'approved', records reviewedAt timestamp and admin UUID.
-- Expected Result Shape: UPDATE 1 followed by 1 row showing status 'approved' and non-null reviewedAt/reviewedBy.
-- ============================================================================
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

-- ============================================================================
-- Q3: UPDATE: Conditional stock decrement during reward redemption
-- Business Need: Prevents overselling when redeeming a limited-inventory reward by atomically decrementing stock only if stock > 0.
-- Expected Result Shape: UPDATE 1 followed by 1 row showing decremented stock (e.g. from 5 to 4).
-- ============================================================================
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

-- ============================================================================
-- Q4: DELETE: Remove a configured shortcut app from user launcher
-- Business Need: User customizes their launcher and unlinks an external eco-app shortcut.
-- Expected Result Shape: DELETE 1 followed by 0 rows matching deleted app ID.
-- ============================================================================
-- Query 4: DELETE an unlinked user app
DELETE FROM "user_apps"
WHERE "id" = '33333333-0000-4000-8000-000000000001'
  AND "userId" = '00000000-0000-4000-8000-000000000002';

-- Verification SELECT
SELECT count(*) AS remaining_count
FROM "user_apps"
WHERE "id" = '33333333-0000-4000-8000-000000000001';

-- ============================================================================
-- Q5: SELECT with filter + ORDER BY: Admin pending moderation queue
-- Business Need: Fetch all submissions waiting for review, sorted oldest first (FIFO moderation queue).
-- Expected Result Shape: Tabular list of pending submissions sorted ascending by createdAt.
-- ============================================================================
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

-- ============================================================================
-- Q6: AGGREGATE: Total approved task points earned per user
-- Business Need: Compute lifetime task completion score per participant across all approved task submissions.
-- Expected Result Shape: Columns (userId, displayName, approved_tasks_count, total_task_points) grouped by user.
-- ============================================================================
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

-- ============================================================================
-- Q7: GROUP BY + HAVING: Highly active users with more than N CO2 logs
-- Business Need: Filter participants with frequent activity logs (e.g. > 1 log) for engagement badges or auditing.
-- Expected Result Shape: Users with logged CO2 count exceeding threshold, total emissions, and total savings.
-- ============================================================================
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

-- ============================================================================
-- Q8: JOINs: Multi-table join of submissions, tasks, and reviewer profiles
-- Business Need: Detailed submission audit showing applicant, task specifications, and review outcome with reviewer identity.
-- Expected Result Shape: Full audit table joining submissions, applicant profile, task, and reviewer profile.
-- ============================================================================
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

-- ============================================================================
-- Q9: SUBQUERY / NOT EXISTS: Users with no approved submissions
-- Business Need: Target inactive users who have registered but have zero approved proof submissions for re-engagement nudges.
-- Expected Result Shape: List of user profiles with email and displayName who have never completed an approved task.
-- ============================================================================
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

-- ============================================================================
-- Q10: WINDOW FUNCTION: RANK() for Monthly Leaderboard (Asia/Kolkata)
-- Business Need: Rank participants for November 2026 based on approved submission points reviewed within Asia/Kolkata month bounds.
-- Expected Result Shape: Columns (rank, displayName, monthly_points) sorted by rank ascending.
-- ============================================================================
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

-- ============================================================================
-- Q11: JSONB QUERY: Querying vehicle mode and trip details from co2_logs.details
-- Business Need: Analyze transport mode breakdown and origin-destination routes stored inside the semi-structured JSONB details column.
-- Expected Result Shape: Extracts vehicle, origin, destination, and baseline emissions from JSONB payload.
-- ============================================================================
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

-- ============================================================================
-- Q12: CTE: Compute user wallet balance (Earned - Spent) across 3 tables
-- Business Need: SQL equivalent of backend points.service.js: computes net balance = (Task Points + CO2 Points) - Redemption Costs.
-- Expected Result Shape: Columns (userId, displayName, task_points, co2_points, total_earned, total_spent, current_balance).
-- ============================================================================
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

-- ============================================================================
-- Q13: LEFT JOIN: Catalog redemption popularity and total revenue spent per reward
-- Business Need: Marketplace analytics showing how many times each catalog reward has been redeemed and total points consumed.
-- Expected Result Shape: Columns (rewardId, brand, title, kind, cost, current_stock, total_redemptions, total_points_consumed).
-- ============================================================================
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
