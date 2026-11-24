# 🌿 EcoSync — Activities & Photo Proof Module Integration Guide
**Author:** Yug Dhamecha (Member 2)  
**Branch:** `feature/activities-proof`  
**Scope:** Activities, Daily Challenges, Camera Proof, Admin Review, Task/Submission Endpoints

---

## 1. Frontend Route Components to Register

The following route components are exported from their respective feature folders:

| Route | Component | Source Export | Description |
|---|---|---|---|
| `/activities` | `<Activities />` | `src/features/activities/index.js` (default) | Repeatable habits list, today's status badges, top daily challenge card, "Do it" action. |
| `/challenges` | `<Challenges />` | `src/features/challenges/index.js` (default) | Dedicated daily challenge hero card, bonus points badge, rules, "Do Challenge" action. |
| `/proof` | `<Proof />` | `src/features/proof/index.js` (default) | Rear camera live preview, canvas frame downscaler (1280px, 0.8 JPEG), bottom sheet submission, MySubmissions history. |
| `/admin/review` | `<AdminReviewPage />` | `src/features/proof/index.js` (`AdminReviewPage`) | Phone-friendly admin review queue, photo viewer, 1-tap Approve, Reject bottom sheet with required reason. |

### Registration in `src/App.jsx`:
```jsx
import Activities from './features/activities';
import Challenges from './features/challenges';
import Proof, { AdminReviewPage } from './features/proof';

// Inside <Routes>:
<Route path="/activities" element={<Activities />} />
<Route path="/challenges" element={<Challenges />} />
<Route path="/proof" element={<Proof />} />
<Route path="/admin/review" element={<AdminReviewPage />} />
```

---

## 2. Backend Router Mounts

Member 2 provides three express routers mounted in `backend/src/index.js`:

```javascript
const tasksRouter = require('./routes/tasks.routes');
const submissionsRouter = require('./routes/submissions.routes');
const adminRouter = require('./routes/admin.routes');

// Mounted routes:
app.use('/api/tasks', tasksRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/admin', adminRouter);
```

---

## 3. Where to Swap Development Auth Stubs

Until Member 1's JWT authentication and session handling are finalized, Member 2 uses clearly isolated development stubs:

1. **User Authentication Stub**:
   - **Location:** `backend/src/middleware/devAuthYug.js`
   - **Routes Using It:** `backend/src/routes/submissions.routes.js`
   - **Behavior:** Checks for `x-dev-user-id` header in development (`NODE_ENV !== 'production'`) and populates `req.user = { id: userId }`. Returns `403` in production.
   - **Swap:** Replace `devAuthYug` with Member 1's `requireAuth` middleware.

2. **Admin Authentication Stub**:
   - **Location:** `backend/src/middleware/requireAdmin.js`
   - **Routes Using It:** `backend/src/routes/admin.routes.js`
   - **Behavior:** Checks for `x-dev-role === 'admin'` and `x-dev-user-id`. Inactive in production.
   - **Swap:** Replace with Member 1's official `requireAdmin` middleware.

3. **Frontend API Headers**:
   - **Location:** `frontend/src/features/activities/api.js` & `frontend/src/features/proof/AdminReviewPage.jsx`
   - **Behavior:** Reads `dev_user_id` / `dev_role` from `localStorage` if present. Once user logs in via JWT, `src/lib/api.js` automatically attaches `Authorization: Bearer <token>`.

---

## 4. Endpoints Reference

### Public / User Endpoints
- **`GET /api/tasks?type=activity|challenge`**
  - Returns array of task records (enriched with icons).
- **`GET /api/tasks/daily-challenge`**
  - Returns today's scheduled challenge based on the current date in **`Asia/Kolkata` (UTC+05:30)**. Returns `404` if none scheduled.
- **`POST /api/submissions`**
  - Multipart form data: `taskId` (string/UUID) and `photo` (file, JPEG/PNG/WebP, max 5 MB).
  - Business rules:
    - Task must exist (`404`).
    - Challenge can only be submitted on its scheduled `challengeDate` (`400`).
    - Maximum 1 non-rejected submission (`pending` or `approved`) per task per day per user (`409 Conflict`).
    - Rollback cleanup: Uploaded file is deleted immediately if validation or DB write fails.
  - Stored with initial status `'pending'`.
- **`GET /api/submissions/mine`**
  - Returns authenticated user's submission history with task title, points, status, and submission date.
- **`GET /api/submissions/:id/photo`**
  - Securely streams photo bytes. Access restricted to submission owner or users with `role: 'admin'`.
  - Notice: `backend/src/uploads` is strictly private and **never** exposed as a static folder.

### Admin Endpoints
- **`GET /api/admin/submissions?status=pending`**
  - Returns queue of pending submissions sorted **oldest first** (`createdAt: 'asc'`), including task title, points, user displayName, createdAt, and photo URL.
- **`PATCH /api/admin/submissions/:id`**
  - Body: `{ action: 'approve' | 'reject', reason?: string }`
  - Rejection strictly requires a non-empty `reason`.
  - Only pending submissions can be reviewed (`409 Conflict` if already reviewed).
  - Updates `status`, `reviewedAt = new Date()`, `reviewedBy = req.user.id`, and `rejectionReason`.

---

## 5. Database Schema & Fields Relied On

Member 2 strictly relies on the following Prisma models from `backend/prisma/schema.prisma`:

### Model: `Task` (table: `tasks`)
```prisma
model Task {
  id            String       @id @default(uuid()) @db.Uuid
  title         String
  description   String?
  type          TaskType     // 'activity' | 'challenge'
  points        Int
  challengeDate DateTime?    // Scheduled date for daily challenges
  createdAt     DateTime     @default(now())

  submissions   Submission[]

  @@map("tasks")
}
```

### Model: `Submission` (table: `submissions`)
```prisma
model Submission {
  id              String           @id @default(uuid()) @db.Uuid
  userId          String           @db.Uuid
  taskId          String           @db.Uuid
  photoUrl        String           // Random UUID path under backend/src/uploads/
  status          SubmissionStatus @default(pending) // 'pending' | 'approved' | 'rejected'
  reviewedAt      DateTime?
  reviewedBy      String?          @db.Uuid
  rejectionReason String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  profile         Profile          @relation(fields: [userId], references: [id], onDelete: Cascade)
  task            Task             @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([taskId])
  @@map("submissions")
}
```

### Model: `Profile` (table: `profiles`)
- `id` (UUID, PK)
- `displayName` (String, used in admin review queue)
- `role` (Role enum: `'user'` | `'admin'`)

---

## 6. Strict Separation of Concerns (Rule #3 Compliance)

- **Approval Isolation:** The admin approval endpoint (`PATCH /api/admin/submissions/:id`) **only** updates the `status`, `reviewedAt`, `reviewedBy`, and `rejectionReason` fields on the `submission` row.
- **Zero Cross-Module Writes:** Member 2's code **never** writes to user points, streaks, leaderboards, or coupons tables.
- **Downstream Consumer Contract:** Member 1 calculates current streaks, points, and coupon unlocks by reading approved records from the `submissions` table:
  ```sql
  SELECT * FROM submissions WHERE "userId" = :userId AND status = 'approved';
  ```

---

## 7. Seeding Scripts Provided

- **`backend/prisma/seed.tasks.js`**: Seeds 10 core activities and 30 consecutive calendar days of daily challenges mapped to Asia/Kolkata timezone.
- **`backend/prisma/seed.submissions.js`**: Seeds sample user and admin profiles, dummy upload photos, and submissions across all three statuses (`pending`, `approved`, `rejected`) for end-to-end testing.
