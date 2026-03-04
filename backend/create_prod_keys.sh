#!/bin/bash
# Create CTI keys in the production postgres database
# Usage: ./create_prod_keys.sh students.csv [output.csv]
#
# This script automatically starts Cloud SQL Auth Proxy and cleans up when done.

set -e

INSTANCE_CONNECTION_NAME="symbiotic-thinking-dojo:us-central1:dojo-db"
PROXY_PORT=5432

# Cleanup function to kill proxy on exit
cleanup() {
    if [ -n "$PROXY_PID" ]; then
        echo "Stopping Cloud SQL Proxy..."
        kill $PROXY_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

if [ -z "$1" ]; then
    echo "Usage: ./create_prod_keys.sh <students.csv> [output.csv]"
    echo ""
    echo "CSV format: email,name"
    exit 1
fi

CSV_FILE="$1"
OUTPUT_FILE="${2:-keys_output.csv}"

if [ ! -f "$CSV_FILE" ]; then
    echo "Error: File not found: $CSV_FILE"
    exit 1
fi

# Check for cloud-sql-proxy
if ! command -v cloud-sql-proxy &> /dev/null; then
    echo "Error: cloud-sql-proxy not found"
    echo "Install it with: brew install cloud-sql-proxy"
    exit 1
fi

# Check if port is already in use
if lsof -i :$PROXY_PORT &> /dev/null; then
    echo "Error: Port $PROXY_PORT is already in use"
    echo "If another proxy is running, kill it first or use that connection"
    exit 1
fi

echo "Fetching database URL from Secret Manager..."
DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo "Error: Could not fetch DATABASE_URL from Secret Manager"
    echo "Make sure you're authenticated: gcloud auth login"
    exit 1
fi

# Parse the DATABASE_URL to extract credentials and database name
# Expected format: postgresql://user:password@/dbname?host=/cloudsql/...
# Transform to: postgresql://user:password@127.0.0.1:5432/dbname

# Extract user:password and dbname using sed
LOCAL_URL=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^@]+)@/([^?]+)\?host=.*|postgresql://\1@127.0.0.1:'"$PROXY_PORT"'/\2|')

if [ "$LOCAL_URL" = "$DATABASE_URL" ]; then
    echo "Warning: Could not parse DATABASE_URL, attempting to use as-is with localhost substitution"
    # Fallback: just replace the host part
    LOCAL_URL=$(echo "$DATABASE_URL" | sed -E 's|host=/cloudsql/[^&]+|host=127.0.0.1|g')
fi

echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy "$INSTANCE_CONNECTION_NAME" --port=$PROXY_PORT &
PROXY_PID=$!

# Wait for proxy to be ready (check if port is listening)
echo "Waiting for proxy to be ready..."
for i in {1..30}; do
    if lsof -i :$PROXY_PORT &> /dev/null; then
        echo "Proxy is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Proxy failed to start"
        exit 1
    fi
    sleep 1
done

echo "Creating keys in production database..."
DATABASE_TYPE=postgres DATABASE_URL="$LOCAL_URL" python3 manage_keys.py bulk-create --csv-file "$CSV_FILE" --output "$OUTPUT_FILE"

echo ""
echo "Keys created! Output saved to: $OUTPUT_FILE"
