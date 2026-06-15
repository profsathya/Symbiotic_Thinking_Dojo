# Terraform Infrastructure as Code

This directory contains Terraform configurations for managing the staging environment infrastructure.

## Staging Environment

The staging environment is defined in `terraform/staging/` and includes:

- **Cloud SQL PostgreSQL instance** (db-f1-micro tier)
- **Database** with automatic password generation
- **Cloud Run service** for the backend
- **Automatic database initialization** with tables and admin key

## Prerequisites

1. **Terraform installed** locally or use GitHub Actions
2. **Google Cloud credentials** configured
3. **Anthropic API key** set as GitHub secret

## Local Usage

### Initialize Terraform
```bash
cd terraform/staging
terraform init
```

### Plan changes
```bash
terraform plan -var="anthropic_api_key=your-api-key"
```

### Apply changes
```bash
terraform apply -var="anthropic_api_key=your-api-key" -auto-approve
```

### Destroy infrastructure
```bash
terraform destroy -var="anthropic_api_key=your-api-key" -auto-approve
```

## GitHub Actions Automation

The staging environment is automatically deployed when:

1. Changes are pushed to the `staging` branch
2. Changes are made to `terraform/staging/**` files
3. Workflow is manually triggered via `workflow_dispatch`

### Required GitHub Secrets

- `GCP_SA_KEY`: Google Cloud service account key
- `ANTHROPIC_API_KEY`: Anthropic API key

## Infrastructure Components

### Cloud SQL
- Instance: `dojo-db-staging`
- Database: `dojo`
- Version: PostgreSQL 15
- Tier: db-f1-micro
- Storage: 10GB with auto-increase

### Cloud Run
- Service: `dojo-backend-staging`
- Region: us-central1
- Scaling: 0-2 instances
- Memory: 512Mi

### Database Initialization
The Terraform configuration automatically:
- Creates all required tables (cti_keys, admin_keys, admin_settings, provider_keys)
- Generates a random admin key
- Outputs the admin key for testing

## Outputs

After deployment, Terraform outputs:
- `service_url`: Cloud Run service URL
- `database_connection_name`: Cloud SQL connection string
- `database_password`: Auto-generated database password

## State Management

Terraform state is stored locally. For production, consider using:
- Terraform Cloud
- Google Cloud Storage backend
- Remote state locking

## Security

- Database passwords are auto-generated and stored in Terraform state
- Anthropic API key is passed as a sensitive variable
- Cloud Run service is publicly accessible (for testing)
- Consider adding IAM restrictions for production
