#!/bin/bash
# Automated script to set up GitHub secrets for staging environment

set -e

REPO_OWNER="hisergiorojas"
REPO_NAME="Symbiotic_Thinking_Dojo"

# Generate random password for database
DB_PASSWORD=$(openssl rand -base64 16)

# Get connection name
CONNECTION_NAME="cti-backend-prod:us-central1:dojo-db-staging"

# Construct database URL
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/dojo?host=/cloudsql/${CONNECTION_NAME}"

echo "Setting up GitHub secrets for staging environment..."

# Add secrets using GitHub CLI
gh secret set DATABASE_URL_STAGING -b"${DATABASE_URL}" -R ${REPO_OWNER}/${REPO_NAME}
gh secret set STAGING_DB_PASSWORD -b"${DB_PASSWORD}" -R ${REPO_OWNER}/${REPO_NAME}

echo "✅ Staging secrets added to GitHub"
echo "Database password: ${DB_PASSWORD}"
echo "Save this password securely for database setup"
