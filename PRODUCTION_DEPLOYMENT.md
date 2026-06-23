# Production Deployment Guide

This guide is for the **production maintainer** (someone with access to the
production Google Cloud project that serves `symbioticthinking.ai` and
`dojo.symbioticthinking.ai`). It explains how to deploy the project to
production and how to connect the **local** admin dashboard to the production
backend.

> The admin dashboard is intentionally **not** deployed publicly. It runs
> locally on the maintainer's machine and talks to the production backend over
> HTTPS, authenticating with an admin key.

---

## 1. Architecture

```
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ Dojo Frontend (Cloud Run)     │  HTTPS  │ Dojo Backend (Cloud Run)      │
│ symbiotic-thinking-dojo       │ ──────▶ │ dojo-backend                  │
│ symbioticthinking.ai          │         │                               │
│ dojo.symbioticthinking.ai     │         │                               │
└──────────────────────────────┘         └───────────────┬──────────────┘
                                                          │ Cloud SQL socket
                                                          ▼
                                              ┌──────────────────────────┐
                                              │ Cloud SQL (PostgreSQL)    │
                                              │ instance: dojo-db         │
                                              │ database: cti_keys        │
                                              └──────────────────────────┘

┌──────────────────────────────┐         ┌──────────────────────────────┐
│ Admin Dashboard (LOCAL only)  │  HTTPS  │ Dojo Backend (Cloud Run)      │
│ localhost:3000 / :3001        │ ──────▶ │ dojo-backend                  │
│ X-Admin-Key header            │         │ /api/admin/*                  │
└──────────────────────────────┘         └──────────────────────────────┘
```

| Component        | Cloud Run service          | Notes                                  |
| ---------------- | -------------------------- | -------------------------------------- |
| Frontend         | `symbiotic-thinking-dojo`  | Serves the public domains              |
| Backend          | `dojo-backend`             | Public API + admin API                 |
| Database         | Cloud SQL `dojo-db`        | PostgreSQL 15, database `cti_keys`      |
| Admin dashboard  | (none — local)             | Connects to `dojo-backend` via API key |

---

## 2. Prerequisites (one-time)

```bash
# Authenticate and select the production project
gcloud auth login
gcloud config set project <PROD_PROJECT_ID>      # e.g. cti-backend-prod

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com
```

Replace `<PROD_PROJECT_ID>` with the production project ID everywhere in this
guide.

---

## 3. CI/CD — how deploys happen

Deployments are automated via GitHub Actions on push to `main`:

| Workflow                                   | Trigger                              | Deploys           |
| ------------------------------------------ | ------------------------------------ | ----------------- |
| `.github/workflows/deploy.yml`             | push to `main` (excludes `backend/`) | Frontend          |
| `.github/workflows/deploy-backend.yml`     | push to `main` touching `backend/**` | Backend           |

### Required GitHub configuration

Set these in the repository **Settings → Secrets and variables → Actions**.

**Secrets:**

| Secret            | Description                                              |
| ----------------- | ------------------------------------------------------- |
| `GCP_PROJECT_ID`  | Production GCP project ID                                |
| `GCP_SA_KEY`      | JSON key of a service account with deploy permissions   |

**Variables (optional — defaults exist):**

| Variable                      | Used by    | Default                              |
| ----------------------------- | ---------- | ------------------------------------ |
| `NEXT_PUBLIC_CTI_BACKEND_URL` | Frontend   | empty (set to production backend URL)|
| `NEXT_PUBLIC_STATS_API_URL`   | Frontend   | `https://dojo-stats-api.netlify.app` |
| `NEXT_PUBLIC_COMMONS_ENABLED` | Frontend   | `false`                              |
| `COMMONS_PROVIDER`            | Frontend   | `gemini`                             |
| `COMMONS_MODEL`               | Frontend   | `gemini-2.5-flash`                   |
| `CORS_ORIGINS`                | Backend    | see below                            |

The service account in `GCP_SA_KEY` needs at least:
`roles/run.admin`, `roles/cloudsql.client`, `roles/secretmanager.secretAccessor`,
`roles/storage.admin` (for GCR), and `roles/iam.serviceAccountUser`.

---

## 4. First-time production setup

> Skip this section if the production database and secrets already exist.
> As of this writing the production Cloud SQL instance `dojo-db` does **not**
> exist (only `dojo-db-staging` does), so this section is required before the
> backend can serve traffic.

### 4.1 Create the Cloud SQL instance, database, and user

```bash
gcloud sql instances create dojo-db \
  --tier=db-f1-micro \
  --region=us-central1 \
  --database-version=POSTGRES_15

gcloud sql databases create cti_keys --instance=dojo-db

# Use a strong, randomly generated password.
# Use hex (not base64) so the password is URL-safe — base64 can contain
# '/', '+', or '=' which break the postgresql:// connection string below.
DB_PASSWORD=$(openssl rand -hex 24)
gcloud sql users create dojo_user --instance=dojo-db --password="$DB_PASSWORD"
echo "Save this DB password securely: $DB_PASSWORD"
```

### 4.2 Create secrets

```bash
# Anthropic API key
echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-

# Database URL (Cloud SQL unix socket form)
echo -n "postgresql://dojo_user:${DB_PASSWORD}@/cti_keys?host=/cloudsql/<PROD_PROJECT_ID>:us-central1:dojo-db" \
  | gcloud secrets create database-url --data-file=-

# Commons provider key (referenced by the frontend deploy; create even if unused)
echo -n "<COMMONS_API_KEY_OR_PLACEHOLDER>" | gcloud secrets create commons-api-key --data-file=-
```

### 4.3 Grant the runtime service account access to secrets

```bash
PROJECT_NUMBER=$(gcloud projects describe <PROD_PROJECT_ID> --format='value(projectNumber)')

gcloud projects add-iam-policy-binding <PROD_PROJECT_ID> \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4.4 Run database migrations (creates schema + seeds an admin key)

Migrations use Alembic (see `backend/MIGRATIONS.md` for full detail). Run them
through the Cloud SQL Auth Proxy so you can reach the production database from
your machine.

```bash
# Terminal A — start the proxy
brew install cloud-sql-proxy   # if needed
cloud-sql-proxy --port 5432 <PROD_PROJECT_ID>:us-central1:dojo-db

# Terminal B — run migrations
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Provide a strong admin key so it is reproducible (recommended for prod)
export INITIAL_ADMIN_KEY=$(openssl rand -hex 32)
echo "Save this admin key securely: $INITIAL_ADMIN_KEY"

export DATABASE_URL="postgresql://dojo_user:${DB_PASSWORD}@127.0.0.1:5432/cti_keys"
alembic upgrade head
```

This creates the `cti_keys`, `admin_settings`, `admin_keys`, and
`provider_keys` tables and inserts the initial admin key. **Save the admin
key** — it is required to log into the admin dashboard.

> If you do **not** set `INITIAL_ADMIN_KEY`, the migration generates one and
> prints it to the console. Save it.

---

## 5. Deploy

### 5.1 Automated (recommended)

Push to `main`:

- Changes under `backend/**` → backend redeploys via `deploy-backend.yml`.
- Any other change → frontend redeploys via `deploy.yml`.

You can also trigger either workflow manually from the GitHub Actions tab
(`workflow_dispatch`).

### 5.2 Backend environment (set by `deploy-backend.yml`)

The backend deploy attaches:

- Cloud SQL instance `<PROD_PROJECT_ID>:us-central1:dojo-db`
- Secrets `ANTHROPIC_API_KEY=anthropic-api-key:latest`,
  `DATABASE_URL=database-url:latest`
- Env vars `CORS_ORIGINS=...`, `DATABASE_TYPE=postgres`

**CORS origins** default (override with the `CORS_ORIGINS` repo variable):

```
https://symbioticthinking.ai,
https://dojo.symbioticthinking.ai,
http://localhost:3001,
http://127.0.0.1:3001
```

The `localhost:3001` entries allow the **local** admin dashboard to call the
production backend. The dashboard's `npm run dev` is pinned to port **3001**
(see `admin-dashboard/package.json`), so it matches this default out of the box
— no extra CORS configuration is needed.

### 5.3 Frontend backend URL

Set the repo variable `NEXT_PUBLIC_CTI_BACKEND_URL` to the production backend
URL (e.g. `https://dojo-backend-<hash>-uc.a.run.app`) so the frontend talks to
the right backend. It is baked in at build time, so the frontend must be
redeployed after changing it.

### 5.4 Custom domains

Map `symbioticthinking.ai` and `dojo.symbioticthinking.ai` to the
`symbiotic-thinking-dojo` Cloud Run service via **Cloud Run → Manage Custom
Domains**, or verify the existing mapping:

```bash
gcloud run domain-mappings list --region=us-central1
```

---

## 6. Connect the LOCAL admin dashboard to production

The dashboard is run locally by the maintainer; it is never deployed.

```bash
cd admin-dashboard
npm install

# Point at the production backend
printf 'NEXT_PUBLIC_API_URL=<PROD_BACKEND_URL>\n' > .env.local

npm run dev
```

Then:

1. Open `http://localhost:3001` (the dev server is pinned to port 3001).
2. When prompted, paste the **admin key** from step 4.4.
3. The key is stored in `localStorage` and sent as the `X-Admin-Key` header on
   every admin API request.

> **CORS requirement:** the dashboard runs on port `3001`, which is included in
> the backend's default `CORS_ORIGINS`. If you change the port, add the matching
> `http://localhost:<port>` origin to the `CORS_ORIGINS` repo variable. See
> section 5.2.

### Verify connectivity

```bash
# Preflight should return access-control-allow-origin for your localhost origin
curl -s -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET" \
  -i <PROD_BACKEND_URL>/api/admin/provider-keys | head

# Authenticated request should return JSON, not 401/500
curl -s -H "X-Admin-Key: <ADMIN_KEY>" \
  <PROD_BACKEND_URL>/api/admin/keys
```

---

## 7. Verification checklist

- [ ] `gcloud sql instances describe dojo-db` shows `RUNNABLE`.
- [ ] `gcloud secrets list` shows `anthropic-api-key`, `database-url`, `commons-api-key`.
- [ ] Backend health: `curl <PROD_BACKEND_URL>/api/budget -H "X-CTI-Key: <valid-key>"` returns `200`.
- [ ] Frontend loads at `https://symbioticthinking.ai` and chat works.
- [ ] Admin dashboard (local) lists CTI keys without CORS or 500 errors.

---

## 8. Operational notes

### Models

Model identifiers live in `backend/config.py` and can be overridden with the
`SONNET_MODEL` / `HAIKU_MODEL` env vars. Anthropic deprecates model IDs over
time; if you see `404 not_found_error: model: ...`, list valid models and
update the config/env:

```bash
KEY=$(gcloud secrets versions access latest --secret=anthropic-api-key)
curl -s https://api.anthropic.com/v1/models \
  -H "x-api-key: $KEY" -H "anthropic-version: 2023-06-01" \
  | python3 -c "import sys,json;[print(m['id']) for m in json.load(sys.stdin)['data']]"
```

### Scaling for program weeks

```bash
gcloud run services update dojo-backend --min-instances=1 --region=us-central1
# Reset afterwards
gcloud run services update dojo-backend --min-instances=0 --region=us-central1
```

### Logs

```bash
gcloud run services logs read dojo-backend --region=us-central1 --limit=50
```

### Rotating the admin key

Create a new admin key from the dashboard (it calls `POST /api/admin/keys/admin`)
or insert one via SQL, then deactivate the old one. Never commit admin keys.

---

## 9. Security notes

- The backend is public (`--allow-unauthenticated`); access is gated by
  `X-CTI-Key` (end users) and `X-Admin-Key` (admin endpoints).
- The admin dashboard ships **no** server-side auth layer; keep it local. Do
  not deploy it publicly without adding authentication.
- Store the DB password and admin key in a password manager / Secret Manager,
  never in git. `.env*` files are gitignored.
