# Project Guide

## Overview
- Backend: Express + Prisma (SQLite).
- Frontend: React + Vite + Tailwind.
- Authentication: JWT with roles (CLIENT, PROVIDER, ADMIN).
- Core domain: salon bookings with providers, services, working hours, and appointments.

## Functional Highlights
- Provider directory supports text search, category filtering, service keyword filters, price range, sorting, and paginated results.
- Bookings dashboard filters by status presets, date range, sort order, and pagination.
- Admins can read `/admin/metrics` for live counts of users, providers, total appointments, and appointments created in the last 24 hours.

## Security & Reliability
- `helmet` adds secure HTTP headers and `express-rate-limit` throttles abusive traffic.
- Request logs are stored in `backend/logs/access.log` and domain activities (appointment creation, confirmations, cancellations) in `backend/logs/activity.log`.
- JSON payloads are limited to 1 MB to prevent oversized requests.

## Testing
- Run `cd backend && npm test` to execute the Node test suite (health endpoint + filter helpers).
- Extend tests by adding new `.test.js` files under `backend/tests`.

## Local Development Flow
1. Start backend: `cd backend && npm run dev`.
2. Start frontend: `cd frontend && npm run dev`.
3. Login as an admin (or promote via `backend/scripts/make-admin.mjs`).
4. Use the Providers page to test search + filters, then the Bookings page for pagination and filtering.
5. Review `logs` folder to confirm monitoring data is generated.

