#!/usr/bin/env python3
"""
Setup script for local test environment.
Initializes the database and creates a test admin key.
"""

import database
import uuid
import os

def setup_test_environment():
    """Initialize database and create test admin key."""
    print("Setting up test environment...")
    
    # Initialize database
    print("1. Initializing database...")
    database.init_db()
    print("   ✓ Database initialized")
    
    # Create test admin key
    print("2. Creating test admin key...")
    key_id = str(uuid.uuid4())
    test_admin_key = "test-admin-key-12345"  # Simple key for testing
    database.create_admin_key(key_id, test_admin_key, label="Test Admin Key")
    print(f"   ✓ Admin key created: {test_admin_key}")
    print(f"   ✓ Key ID: {key_id}")
    
    # Verify the key was created
    print("3. Verifying admin key...")
    admin_keys = database.get_admin_keys()
    print(f"   ✓ Total admin keys: {len(admin_keys)}")
    
    print("\n" + "="*50)
    print("Test environment setup complete!")
    print("="*50)
    print(f"\nUse this admin key for testing:")
    print(f"  X-Admin-Key: {test_admin_key}")
    print(f"\nExample curl command:")
    print(f'  curl -H "X-Admin-Key: {test_admin_key}" http://localhost:8000/api/admin/keys')
    print("="*50)

if __name__ == "__main__":
    setup_test_environment()
