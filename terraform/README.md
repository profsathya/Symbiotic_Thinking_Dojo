# Terraform Infrastructure as Code

This directory contains Terraform configurations for managing the staging environment infrastructure.

## Staging Environment

The staging environment is defined in `terraform/staging/` and includes:

- **Cloud SQL PostgreSQL instance** (db-f1-micro tier)
- **Database** with managed user credentials
- **Infrastructure as Code** for reproducible deployments

**Note:** Cloud Run service is managed separately via GitHub Actions workflow (`.github/workflows/deploy-backend-staging.yml`)

## Prerequisites

1. **Terraform installed** locally
2. **Google Cloud credentials** configured (`gcloud auth application-default login`)
3. **Database password** for existing instance (stored in GitHub secrets)

## Local Usage

### Initialize Terraform
```bash
cd terraform/staging
terraform init
```

### Plan changes
```bash
terraform plan -var="db_password=your-db-password"
```

### Apply changes
```bash
terraform apply -var="db_password=your-db-password" -auto-approve
```

### Destroy infrastructure
```bash
terraform destroy -var="db_password=your-db-password" -auto-approve
```

**Warning:** Destroy will delete the Cloud SQL instance and all data. Use with caution.

## GitHub Actions Automation

The staging infrastructure is managed via GitHub Actions when:
1. Changes are pushed to the `staging` branch
2. Changes are made to `terraform/staging/**` files
3. Workflow is manually triggered via `workflow_dispatch`

### Required GitHub Secrets

- `GCP_SA_KEY`: Google Cloud service account key with appropriate permissions
- `STAGING_DB_PASSWORD`: Database password for existing Cloud SQL instance
- `ANTHROPIC_API_KEY_STAGING`: Anthropic API key for staging environment

## Infrastructure Components

### Cloud SQL
- **Instance:** `dojo-db-staging`
- **Database:** `dojo`
- **Version:** PostgreSQL 15
- **Tier:** db-f1-micro
- **Storage:** 10GB with auto-increase
- **Region:** us-central1
- **Connectivity:** Public IP with authorized networks

### Cloud Run (Separate Management)
- **Service:** `dojo-backend-staging`
- **Region:** us-central1
- **Scaling:** 0-2 instances
- **Memory:** 512Mi
- **Deployment:** Managed via `.github/workflows/deploy-backend-staging.yml`

## Database Initialization

Database initialization is done manually after Terraform creates the infrastructure:

1. **Connect to database:**
```bash
gcloud sql connect dojo-db-staging --user=postgres
```

2. **Create tables:**
```sql
CREATE TABLE IF NOT EXISTS cti_keys (...);
CREATE TABLE IF NOT EXISTS admin_keys (...);
CREATE TABLE IF NOT EXISTS admin_settings (...);
CREATE TABLE IF NOT EXISTS provider_keys (...);
```

3. **Create admin key:**
```sql
INSERT INTO admin_keys (id, key_value, label, active, created_at)
VALUES ('staging-admin-1', 'your-admin-key', 'Staging Admin Key', TRUE, CURRENT_TIMESTAMP);
```

## Outputs

After deployment, Terraform outputs:
- `database_connection_name`: Cloud SQL connection string (e.g., `cti-backend-prod:us-central1:dojo-db-staging`)
- `database_instance_name`: Cloud SQL instance name

## State Management

Terraform state is stored locally in `terraform/staging/terraform.tfstate`. For production, consider using:
- Terraform Cloud
- Google Cloud Storage backend
- Remote state locking

**Important:** Terraform state files are excluded from git via `.gitignore` to prevent committing sensitive data.

## Security

- Database password is passed as a sensitive variable
- Cloud SQL instance uses authorized networks for access control
- Consider adding IAM restrictions for production
- Never commit `terraform.tfstate` files to version control

## Current Staging Admin Key

- **Key:** `staging-admin-key-251ba8a6368be1a624fb86638d8c6cf5`
- **Use this key** for testing staging endpoints via `X-Admin-Key` header

## Google Cloud Console Links

- **Cloud SQL instances:** https://console.cloud.google.com/sql/instances?project=cti-backend-prod
- **Staging database:** https://console.cloud.google.com/sql/instances/dojo-db-staging/overview?project=cti-backend-prod
- **Cloud Run services:** https://console.cloud.google.com/run?project=cti-backend-prod
