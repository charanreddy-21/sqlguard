# Render deployment

Deploy the frontend and API as separate free Render services from the repository.

## FastAPI Web Service

- Root directory: repository root (`.`)
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `PYTHON_VERSION=3.13.3`
  - `SQLGUARD_CORS_ORIGINS=https://<your-static-site>.onrender.com`
  - `SQLGUARD_DB_PATH=/opt/render/project/src/data/sqlguard.sqlite3` (optional; this is the existing default location)

The model artifact must be present at `models/sqli_v3_baseline.joblib` in the deployed source. The current file is allowlisted by `.gitignore` for inclusion.

## React Static Site

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Build environment variable: `VITE_API_BASE_URL=https://<your-api-service>.onrender.com`

Set the frontend origin in the API's `SQLGUARD_CORS_ORIGINS` value. The Vite `/api` proxy remains the local development default when `VITE_API_BASE_URL` is unset; its target is `http://127.0.0.1:8000`.

SQLite history is stored on the backend filesystem and is ephemeral on Render's free Web Service. History may be lost on a restart, deploy, or service spin-down. The free backend can sleep after inactivity, so the first request after idle may take longer while it wakes.

## Local checks

From the repository root, run backend tests with `./.venv/bin/python -m unittest discover -s tests`. From `frontend`, run `npm run lint` and `npm run build`.
