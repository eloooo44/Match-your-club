# Match your Club

Fullstack app with a Next.js frontend and an Express/Prisma backend.

## Local setup

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

The frontend runs on `http://localhost:3001` and expects the backend at `NEXT_PUBLIC_API_BASE`.

## Hosting

GitHub is the right place for the repository, but GitHub Pages only hosts static frontend files. This project also needs a running backend and database.

Current deployment:

- Frontend: `https://match-your-club-frontend.vercel.app`
- Backend: `https://match-your-club.onrender.com`

Recommended setup:

- Host the repository on GitHub.
- Deploy `frontend/` on Vercel or Netlify and set `NEXT_PUBLIC_API_BASE` to your backend URL. If unset in production, the frontend falls back to `https://match-your-club.onrender.com`.
- Deploy `backend/` on Render, Railway, Fly.io, or a VPS.
- Use a hosted PostgreSQL database and set `DATABASE_URL` plus `JWT_SECRET` in the backend host.
- Set `CORS_ORIGIN` on the backend host to exactly `https://match-your-club-frontend.vercel.app`.
- Use the Vercel production domain or a custom domain for users. Vercel deployment preview URLs change on every deployment.
