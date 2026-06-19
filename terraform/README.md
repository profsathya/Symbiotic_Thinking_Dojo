# Terraform Infrastructure as Code

Infrastructure for the staging environment, split into two independent tiers
(separate Terraform states in the same GCS backend bucket).

## Layout

```
terraform/
  bootstrap/   # state prefix: "bootstrap"  — create once, DO NOT destroy
  staging/     # state prefix: "staging"    — rebuildable app tier
```

### Bootstrap tier (`terraform/bootstrap/`)
Foundational resources the rest of the system depends on. Destroying these would
break CI/CD and require rotating credentials, so they are kept separate and
protected (`prevent_destroy` on the service account).

- Enabled Google Cloud APIs (`run`, `sqladmin`, `secretmanager`, `artifactregistry`, `iam`)
- `github-actions-staging` service account + its project IAM roles
  (Cloud Run, Cloud SQL, Secret Manager admin, Artifact Registry, IAM admin)
- `actAs` binding on the compute runtime service account
- `objectAdmin` on the Terraform state bucket (so CI `terraform init` works)

> The service account **key** is intentionally **not** managed by Terraform
> (it is stored in the `GCP_SA_KEY` GitHub secret). Rotate it manually if needed.

### App tier (`terraform/staging/`)
Everything that is safe to destroy and rebuild:

- Cloud SQL instance (`dojo-db-staging`), database (`dojo`), user (`postgres`)
- Anthropic API key secret (`anthropic-api-key-staging`) + version + access binding
- Cloud Run service (`dojo-backend-staging`) — env vars, secret, Cloud SQL link,
  scaling, and public access. **The container image is owned by the deploy
  workflow** and ignored by Terraform (`lifecycle.ignore_changes`).

## Prerequisites

1. Terraform installed locally
2. `gcloud auth application-default login` (run as a project owner/editor)
3. Sensitive variable values (see `staging/terraform.tfvars.example`)

## Backend / state

State is stored in GCS bucket `cti-backend-prod-terraform-state`:
- bootstrap → prefix `bootstrap`
- staging   → prefix `staging`

The bucket itself is a bootstrap dependency and is **not** managed by Terraform
(chicken-and-egg). Create it once by hand if recreating the project.

## First-time setup (from scratch)

Run these once to stand up the whole environment in a fresh project. Steps are
ordered by dependency. Replace `PROJECT_ID` / `REGION` if not using the defaults
(`cti-backend-prod` / `us-central1`).

### 0. Tooling & auth
```bash
# Required CLIs: terraform, gcloud, gh (GitHub CLI)
gcloud auth login
gcloud auth application-default login   # credentials Terraform uses
gcloud config set project cti-backend-prod
gh auth status                          # must be logged in with 'repo' scope
```

### 1. Create the Terraform state bucket (once, not managed by Terraform)
```bash
gcloud storage buckets create gs://cti-backend-prod-terraform-state \
  --project=cti-backend-prod --location=us-central1 --uniform-bucket-level-access
gcloud storage buckets update gs://cti-backend-prod-terraform-state --versioning
```

### 2. Apply the bootstrap tier (SA, IAM roles, APIs)
```bash
cd terraform/bootstrap
terraform init
terraform apply        # enables APIs + creates github-actions-staging SA + roles
```

### 3. Create the CI service-account key and set GitHub secrets
The SA **key** is intentionally not managed by Terraform. Create it and load all
repo secrets (replace the repo with your fork/origin):
```bash
REPO=hisergiorojas/Symbiotic_Thinking_Dojo
SA=github-actions-staging@cti-backend-prod.iam.gserviceaccount.com

# Service account key (JSON) -> GCP_SA_KEY
gcloud iam service-accounts keys create /tmp/sa-key.json --iam-account="$SA"
gh secret set GCP_SA_KEY      --repo "$REPO" < /tmp/sa-key.json
rm -f /tmp/sa-key.json

# Project id
printf '%s' "cti-backend-prod" | gh secret set GCP_PROJECT_ID --repo "$REPO"

# Cloud SQL postgres password (choose a strong value; reuse it in step 4)
printf '%s' "YOUR_DB_PASSWORD" | gh secret set STAGING_DB_PASSWORD --repo "$REPO"

# Anthropic API key (the value Terraform stores in Secret Manager)
printf '%s' "YOUR_ANTHROPIC_KEY" | gh secret set STAGING_ANTHROPIC_API_KEY --repo "$REPO"
```

> If the secret already exists in Secret Manager, mirror its exact value:
> `val=$(gcloud secrets versions access latest --secret=anthropic-api-key-staging); printf '%s' "$val" | gh secret set STAGING_ANTHROPIC_API_KEY --repo "$REPO"`

### 4. Apply the app tier (Cloud SQL, secret, Cloud Run service)
```bash
cd ../staging
terraform init
export TF_VAR_db_password='YOUR_DB_PASSWORD'          # same as step 3
export TF_VAR_anthropic_api_key='YOUR_ANTHROPIC_KEY'  # same as step 3
terraform apply        # Cloud SQL takes ~5-10 min to provision
```

### 5. Initialize the database (empty after creation)
The application tables are created automatically the first time the backend
boots (`database.init_db()` runs in the Cloud Run `startup` handler), so after
Step 6 the schema exists. The one thing you must bootstrap by hand is the
**initial admin key** — there is no CLI command or API endpoint to create the
first one (the admin API requires an existing admin key to authenticate).

See "Database initialization" below for the exact commands.

### 6. Deploy the backend image
The Cloud Run service exists but Terraform doesn't manage the image. Push a
backend change to `staging`, or trigger the workflow:
```bash
gh workflow run "Deploy Backend to Cloud Run (Staging)" --ref staging \
  --repo hisergiorojas/Symbiotic_Thinking_Dojo
```

> **Two-remote gotcha:** this repo typically has both `origin`
> (`hisergiorojas/Symbiotic_Thinking_Dojo` — your fork, which has the `staging`
> branch and the GitHub secrets) and `upstream` (`profsathya/...`, which does
> **not** have a `staging` branch). `gh` may default to `upstream` and fail with
> `HTTP 422: No ref found for: staging`. Always pass `--repo`, or set the
> default once with:
> ```bash
> gh repo set-default hisergiorojas/Symbiotic_Thinking_Dojo
> ```

After this, ongoing changes flow through Git: pushes to `staging` touching
`terraform/staging/**` apply infra, and pushes touching `backend/**` redeploy the
image.

Verify the deploy is live:
```bash
cd terraform/staging
curl -s "$(terraform output -raw service_url)/health"   # -> {"status":"ok"}
```

## App-tier usage (rebuildable)

```bash
cd terraform/staging
terraform init

# Provide secrets via env vars (preferred) ...
export TF_VAR_db_password='...'
export TF_VAR_anthropic_api_key='...'
# ... or copy terraform.tfvars.example -> terraform.tfvars and fill it in.

terraform plan
terraform apply
```

### Destroy & rebuild the app tier

```bash
cd terraform/staging
export TF_VAR_db_password='...'
export TF_VAR_anthropic_api_key='...'

terraform destroy        # removes Cloud SQL, secret, Cloud Run service
terraform apply          # recreates them

# Then redeploy the container image (Terraform ignores the image):
gh workflow run "Deploy Backend to Cloud Run (Staging)" --ref staging \
  --repo hisergiorojas/Symbiotic_Thinking_Dojo
# or push a change under backend/** on the staging branch.
```

**Warning:** Destroy deletes the Cloud SQL instance and all its data. After a
rebuild the database is empty and must be re-initialized (see below).

> The bootstrap tier is never touched by the commands above.

## Bootstrap usage (rare)

```bash
cd terraform/bootstrap
terraform init
terraform plan     # should report "No changes"
```

Only apply here when changing CI IAM roles or enabled APIs.

## Database initialization (after a rebuild)

The four tables (`cti_keys`, `admin_keys`, `admin_settings`, `provider_keys`)
are created automatically by the backend on startup, and also by any
`manage_keys.py` invocation. The **initial admin key must be inserted directly**
into the `admin_keys` table — there is no CLI/API to create the first one.

### Connecting to the staging database

`gcloud sql connect` requires the bundled Cloud SQL Proxy v2 component. When
`gcloud` is installed via the Homebrew **cask**, its component manager is
disabled, so `gcloud components install cloud-sql-proxy` will NOT work. Install
the standalone proxy instead and run it yourself:

```bash
brew install cloud-sql-proxy

# Start the proxy on a local port (any free port; example uses 9470).
# The DATABASE_URL below must point at this SAME port.
cloud-sql-proxy cti-backend-prod:us-central1:dojo-db-staging --port 9470
```

### Create the tables + initial admin key (one shot)

In a second terminal, from `backend/` using its venv (for `psycopg2`):

```bash
cd backend
source venv/bin/activate

ADMIN_KEY=$(openssl rand -hex 32)

DATABASE_TYPE=postgres \
DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@127.0.0.1:9470/dojo" \
./venv/bin/python3 -c "
import uuid, os, database
database.init_db()                       # creates all 4 tables
key = os.environ['ADMIN_KEY']
database.create_admin_key(str(uuid.uuid4()), key, label='initial-admin')
print('SAVE THIS ADMIN KEY:', key)
" ADMIN_KEY="$ADMIN_KEY"
```

**Save the printed admin key immediately** — it is only shown once and is not
recoverable in plaintext. Send it as the `X-Admin-Key` header to authenticate
to the admin API.

> Tip: confirm the port the proxy is actually listening on with
> `lsof -i -P | grep cloud-sql-proxy` and make sure `DATABASE_URL` matches it.
> A `connection refused` error almost always means the port doesn't match.

### Create a CTI key (needed to actually use the app)

Student requests authenticate with a CTI key (`X-CTI-Key` header) that must
exist in the `cti_keys` table. With the proxy running, mint one from `backend/`:

```bash
cd backend
source venv/bin/activate

DATABASE_TYPE=postgres \
DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@127.0.0.1:9470/dojo" \
python manage_keys.py create --email student@example.edu --name "Test Student"
```

This prints the new key UUID. `manage_keys.py` also supports `list`, `usage`,
`bulk-create`, `add-budget`, `deactivate`, etc. (admin keys are separate — see
the one-shot snippet above; there is no `manage_keys.py` command for them).

## Staging frontend (point the UI at the staging backend)

The frontend reads `NEXT_PUBLIC_CTI_BACKEND_URL` (baked in at build time) to
decide which CTI backend the browser talks to. To run a **separate** staging
frontend that points at the staging backend, deploy it as its own Cloud Run
service with Cloud Build.

> **Two `cloudbuild.yaml` files exist.** The repo root one builds the
> **frontend** (has `_SERVICE_NAME` / `_NEXT_PUBLIC_CTI_BACKEND_URL`
> substitutions). `backend/cloudbuild.yaml` builds the **backend** and has no
> such substitutions. Running the command below from `backend/` causes
> `INVALID_ARGUMENT: key "_SERVICE_NAME" ... not matched in the template`.
> **Always run frontend deploys from the repo root.**

### Prerequisites (one-time per project)

```bash
# 1. Cloud Build API must be enabled.
gcloud services enable cloudbuild.googleapis.com --project=cti-backend-prod

# 2. cloudbuild.yaml always mounts a commons-api-key secret. If you don't use
#    The Commons partner platform, a placeholder satisfies the build:
printf 'unused-placeholder' | gcloud secrets create commons-api-key --data-file=-
```

### 1. Deploy the staging frontend (from the repo ROOT)

```bash
cd /path/to/Symbiotic_Thinking_Dojo   # repo root, NOT backend/

STAGING_BACKEND=$(cd terraform/staging && terraform output -raw service_url)

gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=symbiotic-thinking-dojo-staging,_NEXT_PUBLIC_CTI_BACKEND_URL=$STAGING_BACKEND
```

### 2. Make the frontend publicly reachable

Cloud Build's `--allow-unauthenticated` flag silently fails if the Cloud Build
service account lacks `run.services.setIamPolicy`. Symptom: the page returns
`Error: Forbidden — Your client does not have permission to get URL /`. Grant
public invoke directly (only needed once per service):

```bash
gcloud run services add-iam-policy-binding symbiotic-thinking-dojo-staging \
  --region=us-central1 --member=allUsers --role=roles/run.invoker
```

### 3. Get the frontend URL

```bash
gcloud run services describe symbiotic-thinking-dojo-staging \
  --region=us-central1 --format='value(status.url)'
```

### 4. Allow the frontend origin in the backend CORS (LAST step)

The CTI flow is **browser → backend**, so the backend must allow the frontend's
origin. Append the URL from step 3 to `CORS_ORIGINS` in
`terraform/staging/main.tf` (the `google_cloud_run_v2_service.backend` env
block), then apply. Pull the existing Anthropic key from Secret Manager so the
apply doesn't rotate the secret:

```bash
cd terraform/staging
export TF_VAR_db_password='<DB_PASSWORD>'
export TF_VAR_anthropic_api_key="$(gcloud secrets versions access latest --secret=anthropic-api-key-staging --project=cti-backend-prod)"
terraform apply
```

### 5. Verify

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  https://symbiotic-thinking-dojo-staging-utgnvp7qma-uc.a.run.app/   # -> 200
```

Then open the frontend, select the **CTI** provider, and send a message. To
authenticate a request you need a CTI key in the staging `cti_keys` table — mint
one with `manage_keys.py` (via the proxy) or the admin API using your admin key.

## GitHub Actions

- `.github/workflows/terraform-staging.yml` — applies the **app tier** on pushes
  to `staging` touching `terraform/staging/**`.
- `.github/workflows/deploy-backend-staging.yml` — builds/pushes the image and
  does an **image-only** `gcloud run deploy` (all other service config is
  Terraform-owned).

### Required GitHub secrets
- `GCP_SA_KEY` — `github-actions-staging` service account key (JSON)
- `GCP_PROJECT_ID` — `cti-backend-prod`
- `STAGING_DB_PASSWORD` — Cloud SQL `postgres` user password
- `STAGING_ANTHROPIC_API_KEY` — Anthropic API key (for `TF_VAR_anthropic_api_key`)

## Outputs (app tier)

Run `terraform output` **from the `terraform/staging` directory** — each tier
has its own state, so running it from the repo root or `backend/` reports
`Warning: No outputs found`.

```bash
cd terraform/staging
terraform output                      # all outputs
terraform output -raw service_url     # single value, unquoted
```

- `database_connection_name` — e.g. `cti-backend-prod:us-central1:dojo-db-staging`
- `database_instance_name` — Cloud SQL instance name
- `service_url` — Cloud Run service URL

## Console links

- Cloud SQL: https://console.cloud.google.com/sql/instances?project=cti-backend-prod
- Cloud Run: https://console.cloud.google.com/run?project=cti-backend-prod
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=cti-backend-prod
