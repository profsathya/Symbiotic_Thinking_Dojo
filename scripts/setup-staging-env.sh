#!/bin/bash
# Complete automated staging environment setup
# This script handles: Cloud SQL instance creation, database setup, GitHub secrets, and deployment

set -e

REPO_OWNER="hisergiorojas"
REPO_NAME="Symbiotic_Thinking_Dojo"
PROJECT_ID="cti-backend-prod"
REGION="us-central1"
INSTANCE_NAME="dojo-db-staging"
DB_NAME="dojo"

echo "🚀 Starting automated staging environment setup..."
echo "================================================"

# Step 1: Create Cloud SQL instance
echo "📦 Step 1: Creating Cloud SQL instance..."
if gcloud sql instances describe $INSTANCE_NAME --region=$REGION &>/dev/null; then
    echo "✅ Cloud SQL instance already exists"
else
    gcloud sql instances create $INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-auto-increase \
        --storage-size=10GB
    echo "✅ Cloud SQL instance created"
fi

# Step 2: Create database
echo "📦 Step 2: Creating database..."
if gcloud sql databases describe $DB_NAME --instance=$INSTANCE_NAME &>/dev/null; then
    echo "✅ Database already exists"
else
    gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME
    echo "✅ Database created"
fi

# Step 3: Set database password
echo "📦 Step 3: Setting database password..."
DB_PASSWORD=$(openssl rand -base64 16)
gcloud sql users set-password postgres --instance=$INSTANCE_NAME --password=$DB_PASSWORD
echo "✅ Database password set"

# Step 4: Add GitHub secrets
echo "📦 Step 4: Adding GitHub secrets..."
CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/dojo?host=/cloudsql/${CONNECTION_NAME}"

gh secret set DATABASE_URL_STAGING -b"${DATABASE_URL}" -R ${REPO_OWNER}/${REPO_NAME}
gh secret set STAGING_DB_PASSWORD -b"${DB_PASSWORD}" -R ${REPO_OWNER}/${REPO_NAME}
echo "✅ GitHub secrets added"

# Step 5: Create and push staging branch
echo "📦 Step 5: Setting up staging branch..."
if git show-ref --verify --quiet refs/heads/staging; then
    echo "✅ Staging branch already exists"
    git checkout staging
else
    git checkout -b staging
fi

# Add staging workflow if not already committed
if ! git diff --cached --quiet; then
    git add .github/workflows/deploy-backend-staging.yml scripts/
    git commit -m "Add staging automation scripts"
fi

git push -u origin staging || echo "✅ Branch already pushed"
echo "✅ Staging branch ready"

echo "================================================"
echo "✅ Staging environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Add ANTHROPIC_API_KEY_STAGING to GitHub secrets"
echo "2. The GitHub Actions workflow will automatically:"
echo "   - Initialize the database with tables"
echo "   - Create an admin key"
echo "   - Deploy the backend to Cloud Run"
echo ""
echo "Database password saved to GitHub secret: STAGING_DB_PASSWORD"
echo "================================================"
