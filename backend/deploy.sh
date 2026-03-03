#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Deploy the CTI Backend to Google Cloud Run
# ============================================================
#
# First-time setup (run once):
#   1. Enable required APIs:
#      gcloud services enable run.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com
#
#   2. Create the Anthropic API key secret:
#      echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-
#
#   3. Run the Cloud SQL setup script:
#      ./setup-cloudsql.sh
#
# To set minimum instances to 1 during program weeks:
#   gcloud run services update dojo-backend --min-instances=1 --region=us-central1
# ============================================================

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="dojo-backend"
INSTANCE_NAME="dojo-db"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "Building Docker image..."
docker build -t "${IMAGE}:latest" .

echo "Pushing to Container Registry..."
docker push "${IMAGE}:latest"

echo "Deploying to Cloud Run with Cloud SQL..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE}:latest" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --min-instances=0 \
  --max-instances=5 \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}" \
  --set-secrets=ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest \
  --set-env-vars="^@^CORS_ORIGINS=https://symbioticthinking.ai,http://localhost:3000@DATABASE_TYPE=postgres" \
  --execution-environment=gen2

# Print the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --format='value(status.url)')
echo ""
echo "==================================="
echo "Deployed successfully!"
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "Set this in the dojo frontend deployment:"
echo "  NEXT_PUBLIC_CTI_BACKEND_URL=${SERVICE_URL}"
echo "==================================="
