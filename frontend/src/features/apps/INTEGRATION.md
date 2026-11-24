# Apps and CO₂ integration

## Backend mounts

Add these lines in `backend/src/index.js`:

```js
app.use('/api/apps', appsRouter);
app.use('/api/co2', co2Router);
```

## Frontend shell

Register `AppLauncherPage` at `/apps`, `RewardsPage` at `/rewards`, and add the exported `FootprintTab` to Profile's footprint tab. Add Apps, Rewards, and CO₂ history/profile entries to the shell navigation as appropriate. Profile's coupons link should point to `/rewards?tab=coupons`.

The three exported components for Shubham are `TopBarPills`, `MonthBars`, and `FootprintTab` from this feature's `index.js`.

## Authentication swap

`backend/src/routes/apps.routes.js` and `backend/src/routes/co2.routes.js` currently import `../middleware/requireAuth.dev`. Replace that import with the production `requireAuth` middleware when the real auth wiring is ready. The middleware must set `req.user.id`.

## API endpoints

- `GET /api/apps`
- `POST /api/apps`
- `DELETE /api/apps/:id`
- `POST /api/co2/travel/estimate`
- `POST /api/co2/travel`
- `POST /api/co2/food/pending`
- `PATCH /api/co2/food/:id`
- `GET /api/co2/logs?status=pending_log`
- `GET /api/co2/summary`
- `GET /api/points/summary`
- `GET /api/points/history?months=6`
- `GET /api/points/ledger?limit=30`
- `GET /api/rewards`
- `POST /api/rewards/:id/redeem`
- `GET /api/rewards/mine`
- `GET /api/rewards/wallet`
- `PATCH /api/rewards/wallet/:id/use`

## Prisma models

- `UserApp`: per-user App Launcher shortcuts.
- `Co2Log`: per-user travel and food estimates/logs.
- `Reward`: demo marketplace offers.
- `Redemption`: user reward purchases, cascading from `Profile` on user deletion.

Both models relate to `Profile` through `userId` with `onDelete: Cascade`, so deleting a profile cascades to its `UserApp` and `Co2Log` rows.

## Migration handoff

Do not run a migration from this branch. Shubham should add the Phase 1 fields and new `Reward`/`Redemption` blocks from `backend/prisma/schema.prisma`, then generate/apply the shared migration.

The migration must include these `co2_logs` column lines:

```sql
ALTER TABLE "co2_logs" ADD COLUMN "savedKg" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "co2_logs" ADD COLUMN "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "co2_logs" ADD COLUMN "chosenVehicle" TEXT;
```
