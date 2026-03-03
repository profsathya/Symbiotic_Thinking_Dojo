#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# One-Time Cloud SQL Setup for CTI Keys Database
# ============================================================
# Run this script ONCE to create the Cloud SQL instance.
# After this, all deployments via cloudbuild.yaml will use it.
# ============================================================

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
INSTANCE_NAME="dojo-db"
DATABASE_NAME="cti_keys"
DB_USER="cti_admin"

echo "=== Cloud SQL Setup for ${PROJECT_ID} ==="
echo ""

# Enable required APIs
echo "1. Enabling required APIs..."
gcloud services enable sqladmin.googleapis.com

# Check if instance already exists
if gcloud sql instances describe "${INSTANCE_NAME}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "2. Cloud SQL instance '${INSTANCE_NAME}' already exists. Skipping creation."
else
    echo "2. Creating Cloud SQL PostgreSQL instance (this takes 5-10 minutes)..."
    gcloud sql instances create "${INSTANCE_NAME}" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="${REGION}" \
        --storage-type=HDD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup \
        --backup-start-time=04:00
    echo "   Instance created."
fi

# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

# Create or update the database user
echo "3. Creating database user '${DB_USER}'..."
if gcloud sql users list --instance="${INSTANCE_NAME}" --format="value(name)" | grep -q "^${DB_USER}$"; then
    gcloud sql users set-password "${DB_USER}" \
        --instance="${INSTANCE_NAME}" \
        --password="${DB_PASSWORD}"
    echo "   User password updated."
else
    gcloud sql users create "${DB_USER}" \
        --instance="${INSTANCE_NAME}" \
        --password="${DB_PASSWORD}"
    echo "   User created."
fi

# Create the database if it doesn't exist
echo "4. Creating database '${DATABASE_NAME}'..."
if gcloud sql databases list --instance="${INSTANCE_NAME}" --format="value(name)" | grep -q "^${DATABASE_NAME}$"; then
    echo "   Database already exists."
else
    gcloud sql databases create "${DATABASE_NAME}" \
        --instance="${INSTANCE_NAME}"
    echo "   Database created."
fi

# Get the connection name
CONNECTION_NAME=$(gcloud sql instances describe "${INSTANCE_NAME}" --format="value(connectionName)")

# Build the DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DATABASE_NAME}?host=/cloudsql/${CONNECTION_NAME}"

# Store DATABASE_URL in Secret Manager
echo "5. Storing DATABASE_URL in Secret Manager..."
if gcloud secrets describe database-url --project="${PROJECT_ID}" &>/dev/null; then
    echo -n "${DATABASE_URL}" | gcloud secrets versions add database-url --data-file=-
    echo "   Secret updated with new version."
else
    echo -n "${DATABASE_URL}" | gcloud secrets create database-url --data-file=-
    echo "   Secret created."
fi

# Get the Cloud Run service account
echo "6. Granting Cloud Run access to secrets..."
SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
    --filter="displayName:Compute Engine default" \
    --format="value(email)" | head -1)

if [ -z "$SERVICE_ACCOUNT" ]; then
    SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
fi

# Grant access to the database secret
gcloud secrets add-iam-policy-binding database-url \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

# Grant Cloud SQL Client role to the service account
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/cloudsql.client" \
    --quiet

echo ""
echo "==================================="
echo "Cloud SQL Setup Complete!"
echo "==================================="
echo ""
echo "Instance:    ${INSTANCE_NAME}"
echo "Database:    ${DATABASE_NAME}"
echo "Connection:  ${CONNECTION_NAME}"
echo ""
echo "The DATABASE_URL has been stored in Secret Manager."
echo "You can now deploy the backend using:"
echo "  cd backend && gcloud builds submit"
echo ""
echo "Or trigger via Cloud Build."
echo "==================================="
