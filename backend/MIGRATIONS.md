# Database Migrations with Alembic

This project uses Alembic for database schema management across staging and production environments.

## Setup

Alembic is already configured. The migration files are in the `alembic/` directory.

## Running Migrations

### Local Development

```bash
# Activate virtual environment
source venv/bin/activate

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@localhost/dbname"

# Run migrations
alembic upgrade head

# To rollback
alembic downgrade -1
```

### Staging Environment

```bash
# Set DATABASE_URL for staging
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/dojo"

# Run migrations
alembic upgrade head
```

### Production Environment

```bash
# Set DATABASE_URL for production
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/dojo"

# Run migrations
alembic upgrade head
```

## Admin Key Migration

The initial schema migration includes an automated admin key insertion. This is handled by the `insert_initial_admin_key` migration.

### Setting the Admin Key

**Option 1: Provide via environment variable (recommended for production)**
```bash
# Generate a secure admin key
export INITIAL_ADMIN_KEY=$(openssl rand -hex 32)

# Run migrations
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/dojo"
alembic upgrade head
```

**Option 2: Let migration auto-generate (for development)**
```bash
# Don't set INITIAL_ADMIN_KEY - migration will generate one
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/dojo"
alembic upgrade head

# The generated key will be printed to console - save it securely!
```

### Best Practices

- **Production:** Always provide `INITIAL_ADMIN_KEY` via environment variable or secret manager
- **Staging:** Use environment variable for reproducibility
- **Development:** Auto-generation is acceptable, but save the key
- **Security:** Never commit admin keys to version control
- **Storage:** Store admin keys in Secret Manager (GCP) or equivalent

### CI/CD Integration

```yaml
# Example GitHub Actions
- name: Run migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    INITIAL_ADMIN_KEY: ${{ secrets.INITIAL_ADMIN_KEY }}
  run: |
    source venv/bin/activate
    alembic upgrade head
```

## Creating New Migrations

```bash
# Create a new migration
alembic revision -m "description of changes"

# Edit the generated migration file in alembic/versions/
# Add your upgrade() and downgrade() logic

# Apply the migration
alembic upgrade head
```

## Checking Migration Status

```bash
# View current migration version
alembic current

# View migration history
alembic history

# View pending migrations
alembic heads
```

## Database URLs

The DATABASE_URL should be in the format:
```
postgresql://username:password@host:port/database
```

For Cloud SQL with proxy:
```
postgresql://username:password@localhost:9470/database
```

## CI/CD Integration

Migrations should be run as part of your deployment pipeline:
1. Deploy backend code
2. Run `alembic upgrade head` to apply any pending migrations
3. Start the application

## Important Notes

- Always test migrations on staging before production
- Never modify migration files that have already been applied
- Use `alembic downgrade` to rollback if needed
- Keep migration IDs in the order they were created
- For data migrations (like admin key insertion), use environment variables for sensitive values
