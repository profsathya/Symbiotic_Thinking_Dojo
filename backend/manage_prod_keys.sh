#!/bin/bash
# Run any manage_keys.py subcommand against the production Postgres database.
# Usage: ./manage_prod_keys.sh <subcommand> [args...]
#
# Examples:
#   ./manage_prod_keys.sh list
#   ./manage_prod_keys.sh usage --email student@example.edu
#   ./manage_prod_keys.sh add-budget --key <uuid> --tokens 1000000
#   ./manage_prod_keys.sh deactivate --key <uuid>
#   ./manage_prod_keys.sh export-usage --csv-file cohort-usage.csv
#
# This script automatically starts Cloud SQL Auth Proxy and cleans up when done.

set -e

INSTANCE_CONNECTION_NAME="symbiotic-thinking-dojo:us-central1:dojo-db"
PROXY_PORT=5432

cleanup() {
    if [ -n "$PROXY_PID" ]; then
        echo "Stopping Cloud SQL Proxy..."
        kill $PROXY_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

if [ $# -eq 0 ]; then
    echo "Usage: ./manage_prod_keys.sh <subcommand> [args...]"
    echo ""
    echo "Forwards any manage_keys.py subcommand to the production database."
    echo "Available subcommands: create, bulk-create, list, usage, deactivate,"
    echo "                      reactivate, add-budget, export-usage"
    echo ""
    echo "Examples:"
    echo "  ./manage_prod_keys.sh list"
    echo "  ./manage_prod_keys.sh usage --email student@example.edu"
    echo "  ./manage_prod_keys.sh add-budget --key <uuid> --tokens 1000000"
    echo ""
    echo "Run a subcommand with --help for its specific arguments:"
    echo "  ./manage_prod_keys.sh add-budget --help"
    exit 1
fi

if ! command -v cloud-sql-proxy &> /dev/null; then
    echo "Error: cloud-sql-proxy not found"
    echo "Install it with: brew install cloud-sql-proxy"
    exit 1
fi

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

LOCAL_URL=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^@]+)@/([^?]+)\?host=.*|postgresql://\1@127.0.0.1:'"$PROXY_PORT"'/\2|')

if [ "$LOCAL_URL" = "$DATABASE_URL" ]; then
    echo "Warning: Could not parse DATABASE_URL, attempting to use as-is with localhost substitution"
    LOCAL_URL=$(echo "$DATABASE_URL" | sed -E 's|host=/cloudsql/[^&]+|host=127.0.0.1|g')
fi

echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy "$INSTANCE_CONNECTION_NAME" --port=$PROXY_PORT &
PROXY_PID=$!

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

echo "Running: manage_keys.py $*"
echo ""
DATABASE_TYPE=postgres DATABASE_URL="$LOCAL_URL" python3 manage_keys.py "$@"
