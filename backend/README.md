# CTI Backend Proxy

Backend service for the Symbiotic Thinking Dojo's CTI (Critical Thinking Initiative) program. Routes AI requests through a managed server with per-student token budgets.

## Architecture

- **FastAPI** Python service deployed on Google Cloud Run
- **SQLite** or **PostgreSQL** for key/usage storage
- **Anthropic SDK** for Claude API calls
- Routes `reasoning` requests to Claude Sonnet, `extraction` to Claude Haiku

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start the server
uvicorn main:app --reload --port 8000

# Create a test key
python manage_keys.py create --email test@example.com --name "Test User"
```

## Key Management

```bash
# Create a single key
python manage_keys.py create --email student@uni.edu --name "Jane Doe" --budget 5000000 --expires 2026-09-01

# Bulk create from CSV (columns: email, name)
python manage_keys.py bulk-create --csv-file students.csv --budget 5000000 --expires 2026-09-01 --output keys.csv

# List all keys
python manage_keys.py list --active-only

# Check individual usage
python manage_keys.py usage --email student@uni.edu

# Export usage report
python manage_keys.py export-usage --csv-file usage_report.csv

# Manage keys
python manage_keys.py deactivate --key <key-id>
python manage_keys.py reactivate --key <key-id>
python manage_keys.py add-budget --key <key-id> --tokens 1000000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/chat` | POST | Chat completion (requires `X-CTI-Key` header) |
| `/api/budget` | GET | Check remaining budget (requires `X-CTI-Key` header) |

## Deployment to Cloud Run

### First-time setup

```bash
# Enable required APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com

# Store the Anthropic API key as a secret
echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Deploy

```bash
cd backend
./deploy.sh
```

After deployment, set the service URL in the dojo frontend:

```
NEXT_PUBLIC_CTI_BACKEND_URL=https://dojo-backend-XXXXX-uc.a.run.app
```

### During program weeks

Set minimum instances to 1 to avoid cold starts:

```bash
gcloud run services update dojo-backend --min-instances=1 --region=us-central1
```

After the program, set back to 0:

```bash
gcloud run services update dojo-backend --min-instances=0 --region=us-central1
```

## Database Options

### SQLite (default, recommended for pilot)

Set `DATABASE_TYPE=sqlite` and `DATABASE_PATH=/data/cti_keys.db`. For Cloud Run persistence, mount a Cloud Storage bucket:

```bash
# Create a bucket
gsutil mb gs://YOUR_PROJECT-dojo-data

# Mount during deployment (add to deploy.sh gcloud run deploy command):
--add-volume=name=data,type=cloud-storage,bucket=YOUR_PROJECT-dojo-data \
--add-volume-mount=volume=data,mount-path=/data
```

### PostgreSQL (for larger scale)

Set `DATABASE_TYPE=postgres` and `DATABASE_URL=postgresql://user:pass@host:5432/dojo`.

The code handles both backends transparently behind a config flag.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (required) | Anthropic API key |
| `SONNET_MODEL` | `claude-sonnet-4-20250514` | Model for reasoning requests |
| `HAIKU_MODEL` | `claude-haiku-4-5-20241022` | Model for extraction requests |
| `DATABASE_TYPE` | `sqlite` | `sqlite` or `postgres` |
| `DATABASE_PATH` | `./cti_keys.db` | SQLite file path |
| `DATABASE_URL` | | PostgreSQL connection string |
| `CORS_ORIGINS` | `https://symbioticthinking.ai,http://localhost:3000` | Allowed CORS origins |
| `RATE_LIMIT_REQUESTS` | `10` | Requests per window per key |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate limit window |
