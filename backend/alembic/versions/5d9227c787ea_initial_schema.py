"""initial schema

Revision ID: 5d9227c787ea
Revises: 
Create Date: 2026-06-19 12:43:42.045538

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d9227c787ea'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
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
            label TEXT,
            openai_key TEXT,
            anthropic_key TEXT,
            google_key TEXT,
            github_key TEXT
        );

        CREATE TABLE IF NOT EXISTS admin_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_keys (
            id TEXT PRIMARY KEY,
            key_value TEXT NOT NULL UNIQUE,
            label TEXT,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS provider_keys (
            id TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            key_value TEXT NOT NULL,
            label TEXT,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP,
            notes TEXT
        );
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS provider_keys;
        DROP TABLE IF EXISTS admin_keys;
        DROP TABLE IF EXISTS admin_settings;
        DROP TABLE IF EXISTS cti_keys;
    """)
