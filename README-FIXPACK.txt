# Fix-Pack for Zapis Variant A

How to apply (Windows PowerShell):

1) Close running dev servers (backend & frontend).
2) Unzip the archive into your project root `zapis-variant-a` and allow overwrite.
   This zip contains only files that must be updated and will replace them in:
   - backend/prisma/schema.prisma
   - backend/src/routes/*
   - backend/src/index.js
   - backend/prisma/seed.js
   - backend/scripts/add-working-hours.js
   - frontend/vite.config.ts, frontend/tsconfig.json
   - frontend/src/lib/api.ts
   - frontend/src/pages/Bookings.tsx, Dashboard.tsx
   - frontend/src/ui/Layout.tsx
3) Backend:
   cd backend
   npx prisma format
   npm run prisma:generate
   npx prisma migrate dev --name sync
   npm start
4) Frontend:
   cd ../frontend
   npm run dev
5) Test:
   - /register -> create account
   - /providers -> open provider -> book
   - /bookings -> Cancel button visible
   - /dashboard -> create your provider, add service, pick date -> Confirm/Cancel work.
