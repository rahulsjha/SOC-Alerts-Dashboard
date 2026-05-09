# SOC Alerts Dashboard

Full-stack web app for SOC alert triage built with React, Express, SQLite, and cookie-based JWT auth.

## Quick Start

### Backend
```bash
cd backend
npm install
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Access
- App: http://localhost:3000
- Login: analyst@company.com / Alert123!

## API

All protected routes live under `/api`.

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Alerts
- `GET /api/alerts`
- `GET /api/alerts/:id`
- `PATCH /api/alerts/:id`
- `GET /api/alerts/stats/dashboard`

### Query Params for `GET /api/alerts`
- `page`, `limit`
- `severity`, `status`, `category`
- `q` for text search
- `sortBy`, `sortOrder`
- `startDate`, `endDate`

## Features

- Dashboard with severity, category, status, and 14-day trend breakdowns
- Click-through aggregations that open filtered alert lists
- Filterable, sortable, paginated alert list
- Detail view with editable status, severity, assignee, dismiss actions, and raw event JSON
- Cookie-backed auth with protected routes and logout

## Data

`backend/scripts/seedData.js` generates about 1000 mock alerts with a long tail of low/info severity, a small number of critical alerts, and timestamps distributed across recent weeks.

## Deployment Notes

- Backend env: `PORT`, `FRONTEND_URL`, `JWT_SECRET`
- Frontend env: `VITE_API_URL` if the backend is hosted separately
