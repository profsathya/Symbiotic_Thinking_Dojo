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
- `actAs` binding on the compute runtime service account

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
gh workflow run "Deploy Backend to Cloud Run (Staging)" --ref staging
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

```bash
gcloud sql connect dojo-db-staging --user=postgres
```
Then create the application tables and an initial admin key (admin keys are
stored in the `admin_keys` table; the backend is database-only for admin auth).

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

- `database_connection_name` — e.g. `cti-backend-prod:us-central1:dojo-db-staging`
- `database_instance_name` — Cloud SQL instance name
- `service_url` — Cloud Run service URL

## Console links

- Cloud SQL: https://console.cloud.google.com/sql/instances?project=cti-backend-prod
- Cloud Run: https://console.cloud.google.com/run?project=cti-backend-prod
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=cti-backend-prod
