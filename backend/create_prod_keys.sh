#!/bin/bash
# Create CTI keys in the production postgres database
# Usage: ./create_prod_keys.sh students.csv

set -e

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

echo "Fetching database URL from Secret Manager..."
DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo "Error: Could not fetch DATABASE_URL from Secret Manager"
    echo "Make sure you're authenticated: gcloud auth login"
    exit 1
fi

echo "Creating keys in production database..."
DATABASE_TYPE=postgres DATABASE_URL="$DATABASE_URL" python3 manage_keys.py bulk-create --csv-file "$CSV_FILE" --output "$OUTPUT_FILE"

echo ""
echo "Keys created! Output saved to: $OUTPUT_FILE"
