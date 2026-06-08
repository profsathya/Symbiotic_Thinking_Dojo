# CTI Admin Dashboard

A **separate** web-based admin dashboard for managing provider API keys. This is a standalone Next.js application that connects to the CTI backend API.

## Why Separate?

The admin dashboard is deployed separately from the public Dojo application for security:
- Dojo app → Public internet, student-facing
- Admin dashboard → Private/internal, for coordinators only
- Both share the same backend API but have separate frontend deployments

## Features

- **Provider Key Management**: Add, activate, deactivate, and delete API keys for OpenAI, Anthropic, Google, GitHub
- **Key Organization**: Group keys by provider with labels and notes
- **Status Tracking**: View key status (active/inactive) and last used dates
- **No Authentication**: Simplified deployment for internal use (add your own auth layer if needed)

## Setup

### 1. Environment Variables

Create a `.env.local` file in the admin-dashboard directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # or your production backend URL
```

### 2. Install Dependencies

```bash
cd admin-dashboard
npm install
```

### 3. Start the Backend

```bash
cd backend
venv/bin/python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start the Admin Dashboard

```bash
cd admin-dashboard
npm run dev
```

### 5. Access the Dashboard

Navigate to: `http://localhost:3000`

## API Endpoints

The admin dashboard connects to the CTI backend API. Provider key endpoints:

### List Provider Keys
```
GET /api/admin/provider-keys
```

### Create Provider Key
```
POST /api/admin/provider-keys
Body: {
  "provider": "openai|anthropic|google|github",
  "key_value": "sk-...",
  "label": "Optional label",
  "notes": "Optional notes"
}
```

### Activate/Deactivate Provider Key
```
POST /api/admin/provider-keys/{key_id}/activate
POST /api/admin/provider-keys/{key_id}/deactivate
```

### Delete Provider Key
```
DELETE /api/admin/provider-keys/{key_id}
```

## CLI vs Dashboard

The CLI (`manage_keys.py`) is used for:
- CTI key management (student keys, budgets, usage)
- Bulk key creation from CSV files
- Production deployments via shell scripts

The admin dashboard is used for:
- Provider API key management (OpenAI, Anthropic, Google, GitHub)
- Visual organization of provider keys
- Quick activation/deactivation of keys

## Security

The admin dashboard has **no built-in authentication**. For production:

1. **Network-level protection**: Deploy behind a VPN or internal network
2. **Add authentication**: Integrate Auth0, Firebase Auth, or similar
3. **Reverse proxy**: Use Cloud Identity-Aware Proxy (IAP) or similar
4. **CORS**: Ensure backend only accepts requests from your admin dashboard domain

## Production Deployment

### Backend
- Deploy the CTI backend (FastAPI) to Cloud Run or similar
- Ensure provider key endpoints are available
- Configure CORS to allow requests from admin dashboard domain

### Admin Dashboard
```bash
cd admin-dashboard
npm run build
npm start
```

Deploy to:
- Vercel, Netlify, or similar (add auth layer)
- Cloud Run (use IAP for authentication)
- Internal hosting behind VPN

### Example Deployment with Cloud Run + IAP

1. Build and deploy admin dashboard to Cloud Run
2. Enable Cloud Identity-Aware Proxy on the service
3. Configure IAP to only allow your Google Workspace users
4. Set `NEXT_PUBLIC_API_URL` to your backend URL
