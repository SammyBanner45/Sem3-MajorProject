# Apps and CO₂ integration

## Backend mounts

Add these lines in `backend/src/index.js`:

```js
app.use('/api/apps', appsRouter);
app.use('/api/co2', co2Router);
```

## Frontend shell

Register `AppLauncherPage` at `/apps` and `Co2HistoryPage` at `/apps/history`. Add an Apps entry pointing to `/apps` and a CO₂ history entry pointing to `/apps/history` in the shell's route/navigation configuration. The history page and `Co2SummaryCard` are exported from this feature's `index.js`.

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

## Prisma models

- `UserApp`: per-user App Launcher shortcuts.
- `Co2Log`: per-user travel and food estimates/logs.

Both models relate to `Profile` through `userId` with `onDelete: Cascade`, so deleting a profile cascades to its `UserApp` and `Co2Log` rows.
