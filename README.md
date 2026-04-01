# CheckoutFix AI

This repo is split into two deployable apps:

- frontend: Vite + React in the repo root
- backend: Express API in `backend/`

Do not deploy the whole repo as a single Vercel project. Deploy the frontend and backend as two separate Vercel projects.

## Local development

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Local URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:5000`
- health check: `http://localhost:5000/api/health`

## Vercel deployment

### Frontend project

Create a Vercel project from the repo root.

Settings:

- Root Directory: `.`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Frontend environment variables:

- `VITE_API_BASE_URL=https://your-backend-project.vercel.app/api`

### Backend project

Create a second Vercel project from the same Git repo.

Settings:

- Root Directory: `backend`
- Framework Preset: `Other`

Backend environment variables:

- `MONGO_URI=...`
- `JWT_SECRET=...`
- `EMAIL_USER=...`
- `EMAIL_PASS=...`
- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://your-frontend-project.vercel.app`

Backend health check after deploy:

- `https://your-backend-project.vercel.app/api/health`

## Important deployment notes

- The frontend production build now requires `VITE_API_BASE_URL`. If it is missing, the build fails intentionally.
- The backend Vercel entrypoint is `backend/api/index.js`.
- The backend allows only origins listed in `CORS_ORIGINS`.

## Limitation

The authentication and CRUD APIs fit Vercel. The scan engine and cron-based jobs are not a good fit for Vercel serverless because they use Playwright and scheduled background work.

Files involved:

- `backend/src/services/scan.service.js`
- `backend/src/jobs/scan.job.js`

If you want reliable scheduled scans in production, move that part to an always-on worker platform such as Railway, Render, or a VPS.
