# Backend Integration Notes

This file documents minimal integration steps and required environment variables for running the backend alongside the frontend.

Required environment variables (copy `.env.example` -> `.env` and set values):

- `MONGODB_URI` — MongoDB connection string (default: `mongodb://localhost:27017/nariudyami`).
- `PORT` — Port for backend server (default: `5000`).
- `FRONTEND_URL` — Frontend origin to allow CORS (default: `http://localhost:8080`).
- `JWT_SECRET` — Strong secret for signing JWTs. **Must be changed in production**.

Frontend configuration:

- The frontend uses `VITE_API_URL` to locate the backend API. Default the frontend expects `http://localhost:5000/api`.
- To override, set `VITE_API_URL` in frontend environment (e.g., `.env.local` in the frontend):

```
VITE_API_URL=http://localhost:5000/api
```

Quick run (development):

```powershell
# Backend
Set-Location -LiteralPath 'backend'
npm install
npm run dev

# Frontend (in a separate terminal)
Set-Location -LiteralPath 'frontend'
npm install --legacy-peer-deps
npm run dev
```

Smoke tests (quick health checks):

```powershell
Set-Location -LiteralPath 'backend'
node ./scripts/smokeTest.mjs
```

Notes:
- The backend will warn if `JWT_SECRET` is using the default placeholder in development; in `production` it will fail fast to force you to set a secure secret.
- No changes are made to frontend code by these notes.

Docker / Production

Start services locally using Docker Compose (recommended for staging and CI):

```powershell
docker compose up --build
```

Remember to replace `JWT_SECRET` with a secure random value before deploying.
