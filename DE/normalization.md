# EcoSync Database Normalization Analysis

This document provides a formal database normalization study for **EcoSync**, demonstrating the decomposition from a conceptual flat unnormalized relation (UNF) through First Normal Form (1NF), Second Normal Form (2NF), and Third Normal Form (3NF), followed by an evaluation of intentional denormalizations.

---

## 1. Conceptual Flat Relation (UNF)

Consider an initial conceptual spreadsheet tracking all user actions, proofs, carbon emissions, and rewards:

```text
ECOSYNC_FLAT (
    userId, email, passwordHash, displayName, currentStreak, lastStreakDate,
    taskId, taskTitle, taskType, taskPoints, challengeDate,
    submissionId, photoUrl, submissionStatus, reviewedAt, reviewedBy, rejectionReason,
    userAppId, appName, appCategory, appUrl,
    co2LogId, co2Type, co2Kg, savedKg, pointsEarned, vehicle, distanceKm, tripOrigin, tripDest, foodItems, isVeg,
    couponId, couponTitle, couponDiscount, milestoneDays, userCouponCode, isCouponRedeemed,
    rewardId, rewardBrand, rewardTitle, rewardKind, rewardCost, rewardStock,
    redemptionId, redemptionCode, redemptionCost, redemptionStatus, redemptionExpiresAt
)
```

---

## 2. Normalization Steps

### 2.1 First Normal Form (1NF)
**Requirements:** Eliminate repeating groups, ensure atomic attributes, and establish a primary key.
- In `ECOSYNC_FLAT`, users have repeating sets of submissions, app shortcuts, CO2 logs, and coupon awards.
- Furthermore, trip attributes and dietary attributes vary per log type.
- **1NF Decomposition:** Decompose repeating groups into separate relations where every attribute contains only atomic values and each table possesses a primary key:
  - `USERS_FLAT(userId, email, passwordHash, displayName, currentStreak, lastStreakDate)`
  - `TASKS_FLAT(taskId, taskTitle, taskType, taskPoints, challengeDate)`
  - `SUBMISSIONS_FLAT(submissionId, userId, taskId, photoUrl, status, reviewedAt, reviewedBy, rejectionReason)`
  - `CO2_LOGS_FLAT(co2LogId, userId, co2Type, co2Kg, savedKg, pointsEarned, chosenVehicle, distanceKm, details)`
  - `USER_APPS_FLAT(userAppId, userId, appName, appCategory, appUrl)`
  - `COUPONS_FLAT(couponId, title, discount, milestoneDays, isRecurring)`
  - `USER_COUPONS_FLAT(userCouponId, userId, couponId, milestoneDay, code, isRedeemed)`
  - `REWARDS_FLAT(rewardId, brand, title, kind, cost, stock, validDays, terms)`
  - `REDEMPTIONS_FLAT(redemptionId, userId, rewardId, cost, code, status, expiresAt)`

### 2.2 Second Normal Form (2NF)
**Requirements:** Be in 1NF and ensure **no partial dependencies** (every non-prime attribute must be fully functionally dependent on the entire primary key).
- In our schema, all primary keys are single-column UUID surrogate keys (`id`).
- Since no entity uses composite primary keys, partial key functional dependencies are naturally non-existent:
  - In `submissions`, `photoUrl`, `status`, and `reviewedAt` depend on the whole key `id`, not a subset of a composite key.
  - In `Redemption`, `cost`, `code`, and `expiresAt` depend strictly on `id`.
- Therefore, all decomposed relations satisfy **2NF**.

### 2.3 Third Normal Form (3NF)
**Requirements:** Be in 2NF and ensure **no transitive dependencies** ($X ightarrow Y$ and $Y ightarrow Z$ where $Z$ is a non-prime attribute).
- **Users and Authentication Separation:**
  - Initial 2NF profile relation had both `userId` and credentials (`email`, `passwordHash`) as well as user profile state.
  - Migration `20261108000000_add_users_and_link_profiles` decomposed authentication into `users(id, email, passwordHash, role)` and domain state into `profiles(id, displayName, currentStreak, lastStreakDate)`.
- **Coupon Template vs. Awarded Instance:**
  - A user's awarded streak coupon references a reusable template `coupons(id, title, discount, milestoneDays)`. Storing the discount or description directly inside `user_coupons` would cause transitive dependency `userCouponId -> couponId -> discount`. Decomposing into `coupons` and `user_coupons` achieves 3NF.
- **Reward Catalog vs. Redemption Ledger:**
  - A redeemed voucher references `Reward(id, brand, title, stock)`. Moving brand name and terms into `Reward` prevents transitive dependencies in `Redemption`.

---

## 3. Functional Dependencies in Final Schema

For each table in the final schema, the functional dependencies are:

1. **`users`**
   - `id` $ightarrow$ `email, passwordHash, role`
   - `email` $ightarrow$ `id, passwordHash, role` *(Candidate Key via unique index)*
2. **`profiles`**
   - `id` $ightarrow$ `email, passwordHash, displayName, role, currentStreak, lastStreakDate, createdAt, updatedAt`
3. **`tasks`**
   - `id` $ightarrow$ `title, description, type, points, challengeDate, createdAt`
4. **`submissions`**
   - `id` $ightarrow$ `userId, taskId, photoUrl, status, reviewedAt, reviewedBy, rejectionReason, createdAt, updatedAt`
5. **`coupons`**
   - `id` $ightarrow$ `title, description, discount, milestoneDays, isRecurring, createdAt`
6. **`user_coupons`**
   - `id` $ightarrow$ `userId, couponId, milestoneDay, code, awardedAt, isRedeemed`
   - `code` $ightarrow$ `id, userId, couponId, milestoneDay, awardedAt, isRedeemed` *(Candidate Key)*
7. **`user_apps`**
   - `id` $ightarrow$ `userId, name, category, icon, url, createdAt`
8. **`co2_logs`**
   - `id` $ightarrow$ `userId, type, status, co2Kg, savedKg, pointsEarned, chosenVehicle, distanceKm, details, createdAt, loggedAt`
9. **`Reward`**
   - `id` $ightarrow$ `brand, title, description, kind, cost, stock, validDays, terms, icon, isActive`
10. **`Redemption`**
    - `id` $ightarrow$ `userId, rewardId, cost, code, status, expiresAt, createdAt`
    - `code` $ightarrow$ `id, userId, rewardId, cost, status, expiresAt, createdAt` *(Candidate Key)*

---

## 4. Intentional Denormalizations

While the schema conforms to 3NF, certain fields are intentionally denormalized for performance, audit immutability, and flexibility:

1. **`Redemption.cost` (Historical Price Snapshot):**
   - *Denormalization:* Although `Reward.cost` contains the current point price, `Redemption` stores `cost` at the moment of redemption.
   - *Justification:* If an administrator changes a reward's point cost in the `Reward` catalog, historical user ledger deductions must not alter. Storing `cost` on `Redemption` preserves financial and ledger audit immutability.
2. **`profiles.currentStreak` and `profiles.lastStreakDate` (Cached Derived State):**
   - *Denormalization:* Both streak metrics can be computed dynamically by sorting approved submissions by date in Asia/Kolkata timezone (`streak.service.js`).
   - *Justification:* Reading streak on every page load would require expensive recurring table scans over `submissions`. Caching current streak on `profiles` optimizes read queries.
3. **`co2_logs.savedKg` and `co2_logs.pointsEarned` (Precomputed Write-Time Metrics):**
   - *Denormalization:* Both values are computed by applying algorithm rules (`co2Calculator.js` & `co2Rules.js`) over `distanceKm`, vehicle factors, and daily caps at the instant of insertion.
   - *Justification:* Precomputing prevents re-evaluating dynamic formula rules across historical time-series logs during dashboard reads.
4. **`co2_logs.details` (JSONB Semi-Structured Document):**
   - *Denormalization:* Contains non-atomic attributes (e.g. `{"origin": "College", "destination": "Hostel", "nudges": ["no_plastic"]}`).
   - *Justification:* Avoids sparse relational tables with null columns for differing telemetry types (travel vs food vs grocery).
5. **Legacy Credential Duplication (`users` and `profiles`):**
   - *State of Code:* Both `users` and `profiles` retain `email` and `passwordHash`.
   - *Reason:* Technical debt from migration `20261108000000_add_users_and_link_profiles` to support legacy controllers without breaking runtime code.

---

## 5. Final Normalized Schema Summary

The resulting database contains **10 relations**, strictly enforcing domain entity boundaries with clear ownership between Member 1 (Auth, Profile, Streak, Rewards), Member 2 (Tasks, Submissions), and Member 3 (Apps, CO2 Telemetry). All relationships maintain referential integrity via PostgreSQL foreign keys.
