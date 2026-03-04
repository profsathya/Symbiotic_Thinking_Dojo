#!/bin/bash
# Create a single CTI key in the production postgres database
# Usage: ./create_prod_key.sh --email user@example.com [--name "User Name"]

set -e

echo "Fetching database URL from Secret Manager..."
DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo "Error: Could not fetch DATABASE_URL from Secret Manager"
    echo "Make sure you're authenticated: gcloud auth login"
    exit 1
fi

echo "Creating key in production database..."
DATABASE_TYPE=postgres DATABASE_URL="$DATABASE_URL" python3 manage_keys.py create "$@"
