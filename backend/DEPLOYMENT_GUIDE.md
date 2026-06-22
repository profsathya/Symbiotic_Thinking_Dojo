# CTI Backend Deployment Guide

This guide covers deploying the CTI backend to Google Cloud Run and setting up the admin dashboard to run locally while connecting to the production backend.

## Prerequisites

### 1. Google Cloud Setup
```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# List your projects
gcloud projects list
```

### 2. Set Your Project ID

**Option A: Use an existing project**
```bash
# List available projects
gcloud projects list

# Set your CTI project (example: ferrous-quest-344517)
gcloud config set project ferrous-quest-344517
```

**Option B: Create a new project (recommended to avoid IAM permission issues)**
```bash
# Create a new project
gcloud projects create cti-backend-prod --name="CTI Backend Production"

# Set the new project as active
gcloud config set project cti-backend-prod

# Enable billing (required for Cloud Run and Cloud SQL)
# Visit: https://console.cloud.google.com/billing/linkedaccount
# and link a billing account to the new project
```

**Note:** If you create a new project, replace `ferrous-quest-344517` with your new project ID in all subsequent commands in this guide.



### 3. Docker
```bash
# Start Docker Desktop
open -a Docker
```

### 4. Enable Required APIs (First Time Only)
```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com
```


## Deploy CTI Backend to Production

### Step 1: Create Cloud SQL Instance (First Time Only)

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create dojo-db \
  --tier=db-f1-micro \
  --region=us-central1 \
  --database-version=POSTGRES_15

# Create database
gcloud sql databases create cti_keys --instance=dojo-db

# Create user and password
gcloud sql users create dojo_user --instance=dojo-db --password=YOUR_SECURE_PASSWORD
```

### Step 2: Create Secrets (First Time Only)

```bash
# Create Anthropic API key secret
echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-

# Create database URL secret (replace YOUR_SECURE_PASSWORD and YOUR_PROJECT_ID)
echo -n "postgresql://dojo_user:YOUR_SECURE_PASSWORD@/cti_keys?host=/cloudsql/YOUR_PROJECT_ID:us-central1:dojo-db" | gcloud secrets create database-url --data-file=-
```

**Note:** Replace `YOUR_PROJECT_ID` with your actual project ID (e.g., `ferrous-quest-344517` or `cti-backend-prod`).

### Step 3: Grant IAM Permissions (First Time Only)

The Cloud Run service needs permission to access the secrets:

```bash
# Get the compute service account for your project
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# Grant Secret Manager Secret Accessor role to the compute service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Note:** Replace `YOUR_PROJECT_ID` with your actual project ID. If you get a permission denied error, you'll need someone with admin permissions to run this command.

### Step 4: Deploy Backend

```bash
cd /Users/sergiorojas/Desktop/Symbiotic_Thinking_Dojo/backend
./deploy.sh
```

This will:
- Build Docker image for linux/amd64
- Push to Google Container Registry
- Deploy to Cloud Run in us-central1
- Configure Cloud SQL connection
- Set environment variables and secrets
- Print the service URL

**Save the service URL** - you'll need it for the frontend and admin dashboard.

### Step 5: Update CORS Origins (If Needed)

The deploy script sets default CORS origins including:
- https://symbioticthinking.ai
- https://dojo.symbioticthinking.ai
- https://symbiotic-thinking.netlify.app
- http://localhost:3000, http://127.0.0.1:3000
- http://localhost:3001, http://127.0.0.1:3001

If you deploy to a different domain (e.g., Vercel, custom domain), update the deploy script to add your domain:

```bash
# Edit deploy.sh and update the CORS_ORIGINS line:
--set-env-vars="^@^CORS_ORIGINS=https://your-domain.com,https://symbioticthinking.ai,https://dojo.symbioticthinking.ai,https://symbiotic-thinking.netlify.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001@DATABASE_TYPE=postgres"
```

Then redeploy:
```bash
cd /Users/sergiorojas/Desktop/Symbiotic_Thinking_Dojo/backend
./deploy.sh
```

## Deploy Dojo Frontend to Production

### Option 1: Vercel (Recommended)

```bash
cd /Users/sergiorojas/Desktop/Symbiotic_Thinking_Dojo
npm install
npm run build
```

Then:
1. Push code to GitHub
2. Import to [vercel.com](https://vercel.com)
3. In Vercel project settings, add environment variable:
   - `NEXT_PUBLIC_CTI_BACKEND_URL` = your backend URL from deploy script
4. Deploy

### Option 2: Netlify

```bash
cd /Users/sergiorojas/Desktop/Symbiotic_Thinking_Dojo
npm install
npm run build
```

Then:
1. Go to [netlify.com](https://netlify.com)
2. Connect repository or drag-drop `.next` folder
3. In site settings, add environment variable:
   - `NEXT_PUBLIC_CTI_BACKEND_URL` = your backend URL from deploy script
4. Deploy

## Run Admin Dashboard Locally

### Step 1: Configure Environment

Create `.env.local` in the admin-dashboard directory:

```bash
cd /Users/sergiorojas/Desktop/Symbiotic_Thinking_Dojo/admin-dashboard
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
EOF
```

Replace `https://your-backend-url.run.app` with the actual backend URL from the deploy script.

### Step 2: Start Admin Dashboard

```bash
npm install
npm run dev
```

Open at: http://localhost:3000

## Managing Cloud SQL (If Using PostgreSQL)

### Create Cloud SQL Instance (First Time Only)

```bash
gcloud sql instances create dojo-db \
  --tier=db-f1-micro \
  --region=us-central1 \
  --database-version=POSTGRES_15
```

### Create Database

```bash
gcloud sql databases create cti_keys --instance=dojo-db
```

### Setup Cloud SQL Auth Proxy

```bash
# Install cloud-sql-proxy
brew install cloud-sql-proxy

# Start proxy
cloud-sql-proxy ferrous-quest-344517:us-central1:dojo-db
```

## Scaling Configuration

### Set Minimum Instances During Program Weeks

```bash
gcloud run services update dojo-backend \
  --min-instances=1 \
  --region=us-central1
```

### Reset to Zero Minimum (After Program)

```bash
gcloud run services update dojo-backend \
  --min-instances=0 \
  --region=us-central1
```

## Troubleshooting

### Docker Daemon Not Running
```bash
open -a Docker
```

### Project ID Not Set
```bash
gcloud config set project <your-project-id>
```

### Permission Denied
```bash
gcloud auth login
```

### View Backend Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=dojo-backend" --project=<your-project-id> --limit=20
```

### Container Failed to Start
If the container fails to start with a timeout error:
1. Check if Cloud SQL instance is in RUNNABLE state: `gcloud sql instances describe dojo-db --region=us-central1`
2. Verify secrets exist: `gcloud secrets list`
3. Check database URL secret format

### CORS Errors in Admin Dashboard
If you see CORS errors when using the admin dashboard:
1. Verify CORS origins include your local port: `gcloud run services describe dojo-backend --region=us-central1 --format='value(spec.template.spec.containers[0].env)'`
2. Clear browser cache or try incognito mode
3. Redeploy backend with updated CORS origins if needed

### 500 Internal Server Error on Key Creation
If you get 500 errors when creating CTI keys:
1. Check backend logs for datetime serialization errors
2. The backend includes datetime serialization for PostgreSQL compatibility
3. Redeploy the backend if you encounter this issue

### Delete Deployment
```bash
gcloud run services delete dojo-backend --region=us-central1
```

## Architecture Overview

```
┌─────────────────┐                      ┌─────────────────┐
│   Dojo Frontend │  CTI Backend URL    │   CTI Backend   │
│  (Production)   │ ◀─────────────────── │  (Cloud Run)    │
│  Vercel/Netlify │                      │                 │
└─────────────────┘                      └─────────────────┘
                                                 │
                                                 │ Cloud SQL
                                                 ▼
                                         ┌─────────────────┐
                                         │   PostgreSQL    │
                                         │   Database      │
                                         └─────────────────┘

┌─────────────────┐                      ┌─────────────────┐
│   Admin         │  API Base URL       │   CTI Backend   │
│   Dashboard     │ ◀─────────────────── │  (Cloud Run)    │
│  (Local)        │                      │                 │
│  localhost:3000 │                      │                 │
└─────────────────┘                      └─────────────────┘
```

## Security Notes

- The backend is deployed with `--allow-unauthenticated` for public access
- Authentication is handled via CTI keys in the `X-CTI-Key` header
- Admin dashboard runs locally and connects via API - no auth layer included by default
- Add your own authentication layer if deploying the admin dashboard publicly
