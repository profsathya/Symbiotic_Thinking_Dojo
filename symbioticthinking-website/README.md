# Symbiotic Thinking Website

Marketing website for the Symbiotic Thinking Dojo — an AI-powered learning environment that builds human capability.

**Live site:** [symbioticthinking.ai](https://symbioticthinking.ai)
**Dojo app:** [dojo.symbioticthinking.ai](https://dojo.symbioticthinking.ai)

## Pages

- **Home** — Value proposition and overview
- **For Learners** — How the Dojo builds superagency and critical thinking
- **For Educators** — Using the Dojo with students, privacy assurance
- **About** — Philosophy, team, and transparency
- **Support** — Feedback, contributions, and funding information

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment to GitHub Pages

### 1. Create GitHub Repository

Create a new repository named `symbioticthinking-website` (or any name).

### 2. Configure for Static Export

Add to `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### 3. Add GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### 4. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"

### 5. Configure Custom Domain

1. In repository Settings → Pages, add custom domain: `symbioticthinking.ai`
2. Create `public/CNAME` file with content: `symbioticthinking.ai`
3. In Squarespace DNS, add:
   - A record: `@` → `185.199.108.153`
   - A record: `@` → `185.199.109.153`
   - A record: `@` → `185.199.110.153`
   - A record: `@` → `185.199.111.153`
   - CNAME record: `www` → `<username>.github.io`

## DNS Configuration for Full Setup

### symbioticthinking.ai → GitHub Pages (this site)

In Squarespace DNS:
```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   <username>.github.io
```

### dojo.symbioticthinking.ai → Google Cloud Run

In Squarespace DNS:
```
CNAME dojo  ghs.googlehosted.com
```

Then in Google Cloud Console:
1. Go to Cloud Run → your service
2. Click "Manage Custom Domains"
3. Add `dojo.symbioticthinking.ai`
4. Verify domain ownership if prompted

## Technology

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages (static export)

## License

MIT
