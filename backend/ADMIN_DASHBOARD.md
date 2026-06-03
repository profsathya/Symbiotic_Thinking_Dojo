# CTI Admin Dashboard

A web-based admin dashboard for managing CTI keys, replacing the CLI-based `manage_keys.py` for day-to-day operations.

## Features

- **Key Management**: Create, deactivate, reactivate, and top up CTI keys
- **Usage Monitoring**: View real-time token usage with visual progress bars
- **Statistics**: Overview of total keys, active keys, budget allocation, and usage
- **Search & Filter**: Search by email, name, or key ID; filter by active status
- **Export**: Download usage data as CSV for reporting
- **Bulk Operations**: Create multiple keys at once (via API)

## Setup

### 1. Environment Variables

Add these to your `.env.local` file (or backend environment for production):

```bash
# Backend (for production, set in Cloud Run / Secret Manager)
ADMIN_API_KEY=your-secret-admin-key-here

# Frontend (for Next.js)
NEXT_PUBLIC_API_URL=http://localhost:8000  # or your production backend URL
```

Generate a secure admin key:
```bash
openssl rand -hex 32
```

### 2. Start the Backend

```bash
cd backend
# Using the virtual environment you created
venv/bin/python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start the Frontend

```bash
# From project root
npm run dev
```

### 4. Access the Dashboard

Navigate to: `http://localhost:3000/admin`

Enter your `ADMIN_API_KEY` to log in.

## API Endpoints

All admin endpoints require the `X-Admin-Key` header.

### List Keys
```
GET /api/admin/keys?active_only=false
```

### Get Single Key
```
GET /api/admin/keys/{key_id}
```

### Create Key
```
POST /api/admin/keys
Body: {
  "email": "student@example.edu",
  "name": "Student Name",
  "budget": 5000000,
  "expires": "2026-12-31",
  "notes": "Cohort 12"
}
```

### Bulk Create Keys
```
POST /api/admin/keys/bulk
Body: {
  "students": [
    {"email": "student1@example.edu", "name": "Student 1"},
    {"email": "student2@example.edu", "name": "Student 2"}
  ],
  "budget": 5000000,
  "expires": "2026-12-31"
}
```

### Deactivate Key
```
POST /api/admin/keys/{key_id}/deactivate
```

### Reactivate Key
```
POST /api/admin/keys/{key_id}/reactivate
```

### Add Budget
```
POST /api/admin/keys/{key_id}/add-budget
Body: {"tokens": 1000000}
```

### Get Statistics
```
GET /api/admin/stats
```

### Export Usage
```
GET /api/admin/usage
```

## CLI vs Dashboard

The CLI (`manage_keys.py`) remains available and is still the recommended approach for:
- Bulk key creation from CSV files
- Production deployments via the shell scripts (`create_prod_key.sh`, `create_prod_keys.sh`)
- Automated workflows and scripting

The dashboard is best for:
- Day-to-day monitoring and management
- Quick key creation and top-ups
- Visual usage tracking
- Ad-hoc operations

## Security

- The admin API is protected by the `ADMIN_API_KEY` environment variable
- All admin endpoints require the `X-Admin-Key` header
- In production, store `ADMIN_API_KEY` in Secret Manager (GCP) or equivalent
- The dashboard should be deployed behind authentication (e.g., Cloud Identity-Aware Proxy)

## Production Deployment

### Backend
- Set `ADMIN_API_KEY` in your Cloud Run environment variables or Secret Manager
- Ensure the admin router is included in `main.py`
- Update CORS origins to include your production frontend domain

### Frontend
- Set `NEXT_PUBLIC_API_URL` to your production backend URL
- Deploy the Next.js app to your hosting platform (Vercel, Cloud Run, etc.)
- Consider adding additional authentication (e.g., Auth0, Firebase Auth) to protect the `/admin` route
