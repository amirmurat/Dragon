# Deployment Guide

## Backend (Render)
1. Push the latest branch to GitHub.
2. Create a new Web Service on [Render](https://render.com/) and connect the repository.
3. Build command: `cd backend && npm install && npx prisma migrate deploy`.
4. Start command: `cd backend && npm run start`.
5. Add environment variables:
   - `DATABASE_URL=file:./prisma/dev.db` for SQLite or a remote database connection string.
   - `JWT_SECRET=<random_string>`.
   - `PORT=8080`.
6. Enable automatic deploys so Render rebuilds after each push.
7. Verify the `/api/health` endpoint responds with `status: UP`.

## Frontend (Vercel or Netlify)
1. Connect the same repository.
2. Build command: `cd frontend && npm install && npm run build`.
3. Set `VITE_API_BASE=https://<render-app>.onrender.com`.
4. Expose the build output directory `frontend/dist`.
5. Deploy and confirm the site can log in, search providers, and view bookings.

## Testing Before Deployment
1. Run `cd backend && npm test`.
2. Run `cd backend && npm run dev` plus `cd frontend && npm run dev` for manual smoke tests.
3. Commit only after tests pass to keep the deployment pipeline green.

