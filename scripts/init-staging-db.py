#!/usr/bin/env python3
"""
Initialize staging database with tables and admin key.
Run this after Cloud SQL instance is created.
"""

import psycopg2
import psycopg2.extras
import uuid
import os
import sys

def get_database_url():
    """Get database URL from environment or construct from components."""
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        return db_url
    
    # If not set, construct from individual components
    project = os.environ.get("GCP_PROJECT", "cti-backend-prod")
    region = os.environ.get("GCP_REGION", "us-central1")
    instance = os.environ.get("DB_INSTANCE", "dojo-db-staging")
    db_name = os.environ.get("DB_NAME", "dojo")
    db_user = os.environ.get("DB_USER", "postgres")
    db_password = os.environ.get("DB_PASSWORD")
    
    if not db_password:
        print("Error: DB_PASSWORD environment variable required")
        sys.exit(1)
    
    return f"postgresql://{db_user}:{db_password}@/{db_name}?host=/cloudsql/{project}:{region}:{instance}"

def init_database():
    """Initialize database with tables and admin key."""
    db_url = get_database_url()
    
    print(f"Connecting to database...")
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        # Create tables
        print("Creating tables...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cti_keys (
            id TEXT PRIMARY KEY,
            student_email TEXT NOT NULL,
            student_name TEXT,
            total_budget_tokens INTEGER NOT NULL DEFAULT 5000000,
            used_tokens_input INTEGER NOT NULL DEFAULT 0,
            used_tokens_output INTEGER NOT NULL DEFAULT 0,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            last_used_at TIMESTAMP,
            notes TEXT,
            openai_key TEXT,
            anthropic_key TEXT,
            google_key TEXT,
            github_key TEXT
        );
        
        CREATE TABLE IF NOT EXISTS admin_keys (
            id TEXT PRIMARY KEY,
            key_value TEXT NOT NULL,
            label TEXT,
            notes TEXT,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS admin_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS provider_keys (
            id TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            key_value TEXT NOT NULL,
            label TEXT,
            notes TEXT,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP
        );
        """)
        conn.commit()
        print("✅ Tables created")
        
        # Create admin key
        print("Creating admin key...")
        admin_key_id = str(uuid.uuid4())
        admin_key_value = f"staging-admin-{uuid.uuid4().hex[:16]}"
        
        cursor.execute("""
        INSERT INTO admin_keys (id, key_value, label, active, created_at)
        VALUES (%s, %s, %s, TRUE, CURRENT_TIMESTAMP)
        """, (admin_key_id, admin_key_value, "Staging Admin Key"))
        conn.commit()
        
        print("✅ Admin key created")
        print("=" * 50)
        print("STAGING ADMIN KEY:")
        print(admin_key_value)
        print("=" * 50)
        
        # Verify
        cursor.execute("SELECT COUNT(*) as count FROM admin_keys")
        count = cursor.fetchone()['count']
        print(f"✅ Total admin keys: {count}")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    init_database()
