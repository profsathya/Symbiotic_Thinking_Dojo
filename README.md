# Symbiotic Thinking Dojo

An AI-powered practice environment where learners develop cognitive skills to create real value — not just complete tasks. The Dojo trains **judgment** and **superagency** through structured practice with AI as a thinking partner.

## Why This Tool Exists

In an age where AI can generate answers instantly, the real differentiator isn't access to information — it's **what you do with it**. The Symbiotic Thinking Dojo is designed to ensure that AI amplifies human thinking rather than replacing it.

### The Problem We're Solving

Most AI tools optimize for task completion: ask a question, get an answer. But this creates a dangerous pattern where learners:
- Accept AI outputs without critical evaluation
- Skip the productive struggle that builds understanding
- Develop dependency instead of capability
- Lose the metacognitive skills that make them valuable

### Our Approach: Superagency Through Symbiosis

The Dojo flips the script. Instead of AI doing the thinking *for* you, it challenges you to think *better*. Every interaction is designed to:

- **Build judgment** — knowing which problems are worth solving and why
- **Develop metacognition** — awareness of your own thinking process
- **Create human value** — skills that compound and transfer to new situations
- **Maintain agency** — you remain the decision-maker, not the AI

The goal isn't to slow you down — it's to ensure that when you move fast, you're building real capability, not just accumulating outputs.

---

## AI Providers

**The Dojo supports THREE AI providers.** Choose the one that best fits your needs:

| Provider | Model | Free Tier Limits | Best For |
|----------|-------|------------------|----------|
| **Google Gemini** | Gemini 2.5 Flash | ~15 requests/min, ~20 requests/day | Default choice, reliable |
| **Llama (via Groq)** | Llama 3.3 70B | ~30 requests/min, ~14,400 requests/day | Higher daily limits, ultra-fast |
| **CTI Program** | Claude Sonnet | Token budget managed by coordinator | Institutional/classroom use |

### Provider Details

**Google Gemini** (Default)
- Google's Gemini 2.5 Flash model
- Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey)
- Good balance of quality and availability

**Llama (via Groq)**
- Ultra-fast inference using Meta's Llama 3.3 70B model
- Get a free API key at [console.groq.com](https://console.groq.com/keys) *(Note: Groq is NOT Grok from xAI — they are completely different companies)*
- Much higher daily request limits than Gemini
- Best if you hit Gemini's daily quota frequently

**CTI Program** (Institutional Only)
- Available when your institution has deployed the CTI backend service
- Uses Anthropic's Claude Sonnet model
- Token budget allocated and managed by your program coordinator
- Not visible in the UI unless your deployment has CTI enabled

### Privacy by Design

Your API key is stored **only** in your browser's localStorage. Conversations flow **directly** from your browser to your chosen AI provider:
- **Gemini**: Browser → Google's Gemini API
- **Llama**: Browser → Groq's API
- **CTI**: Browser → CTI Backend → Anthropic's Claude API

**We never see your API key or conversations.** See the [Privacy Architecture](#privacy-architecture) section for details.

---

## Features

### Two Modes of Engagement

**1. Practice Dojo** — Structured learning with guided topics, visual components, and progress tracking. Great for learning the Symbiotic Thinking methodology.

**2. Free Mode** — Open-ended conversation with the Sensei and Sparring Partners. Use your own challenges and problems.

### Training Constructs

Choose your engagement level based on stakes and learning goals:

- **Learn**: Safe exploration and skill acquisition (low stakes)
- **Learn + Solve**: Apply learning to defined problems (medium stakes)
- **Learn + Solve + Build**: Create real value for real stakeholders (high stakes)

### Sparring Partners

Five modular challengers that target specific cognitive skills:

| Partner | Role | @ Mention |
|---------|------|-----------|
| **The Framer** | Blocks implementation until the problem is understood | `@framer` |
| **The Auditor** | Enforces 3Cs (Context, Choices, Confirmation) before decisions | `@auditor` |
| **The Connector** | Bridges domains and finds patterns from other fields | `@connector` |
| **The Challenger** | Pressure-tests thinking and plays devil's advocate | `@challenger` |
| **The Reflector** | Guides self-evaluation and generates session summaries | `@reflector` |

**How to invoke**: Toggle partners on in the sidebar (always active) OR @ mention them in a message (single-message activation).

> **Note**: Only these five partners can be @ mentioned. Other features like Ikigai are accessed through Practice Dojo, not @ mentions.

### The Sensei

Your metacognitive coach — guides through questions, not answers. The Sensei helps you stay aware of your thinking process without doing the thinking for you. Active by default when no Sparring Partner is invoked.

### Practice Dojo Topics

Structured learning experiences with phased progression and interactive visual elements:

| Topic | Category | Description |
|-------|----------|-------------|
| **Symbiotic Thinking** | Foundations | Learn the core philosophy and frameworks |
| **Ikigai Discovery** | Foundations | Explore your purpose through guided self-reflection |
| **CST 395 - Software Engineering** | Course | Course overview and key concepts |
| **CST 349 - Algorithms & Data Structures** | Course | Course overview and key concepts |
| **Introductory Programming** | General | Foundational programming concepts |

Practice Dojo features:
- **Three pathways**: Guided (full scaffolding), Quick (condensed), Test (challenge mode)
- **Visual components**: Selection cards, comparison tables, framework diagrams, info boxes
- **Progressive scaffolding**: Support adapts based on your interaction count
- **Session persistence**: Resume interrupted sessions from where you left off
- **Customizable prompts**: Instructors can edit topic prompts via the TopicEditor

### Frameworks

- **UMPIRE Cycle**: Understand → Map → Plan → Implement → Review → Evaluate
- **3Cs Checkpoint**: Context, Choices, Confirmation before every decision
- **DIKW Pyramid**: Track depth from Data → Information → Knowledge → Wisdom
- **Creating-Consuming Balance**: Visual feedback on active vs. passive engagement

### Guided Tour

New users are offered an interactive guided tour that highlights key UI elements and explains the Dojo philosophy. The tour can be restarted anytime from the Help menu.

### Session Management

- **Export**: Save your session as Markdown or JSON for future reference
- **Import**: Restore a previously exported session to continue where you left off

### Anonymous Usage Statistics (Opt-in)

The Dojo collects anonymous, aggregate usage statistics to help improve the platform. This is **completely optional** and **separate from your conversations**.

**What we collect** (if enabled):
- Session counts (not content)
- Message count ranges (e.g., "6-10 messages")
- DIKW level distributions
- Partner and construct usage counts
- Practice Dojo topic usage

**What we never collect:**
- Conversation content
- API keys
- Personal identifiers

View aggregate statistics in the Help menu.

---

## Use Without the App (Portable Dojo)

Don't want to set up an API key or use the web app? You can get the full Dojo experience in any AI chatbot that supports custom instructions:

**Two files are provided:**

1. **[Portable Dojo Guide](docs/Portable-Dojo-Guide.md)** — System prompt to paste into your AI's custom instructions
2. **[Knowledge Base](docs/Symbiotic-Thinking-Knowledge-Base.md)** — Complete reference document to attach as a file

**Compatible platforms**: Claude Projects, ChatGPT (with file uploads), Google Gemini, and other AI assistants that support custom instructions and document attachments.

The Guide includes platform-specific setup instructions for each service.

---

## Privacy Architecture

**This application uses a privacy-first, client-side architecture. Your API key and conversations never pass through our servers.**

### The Privacy Guarantee (Our Servers)

| What | Where It Lives | Our Access |
|------|----------------|------------|
| Your API key | Browser localStorage | **None** |
| Your conversations | Browser memory only | **None** |
| Chat history | Not persisted anywhere | **None** |

We serve the application code. That's it.

### Data Flow by Provider

**Gemini and Llama** — Direct browser-to-API communication:

```
┌─────────────────┐                      ┌─────────────────┐
│                 │   Your API Key &     │  Google/Groq    │
│   Your Browser  │ ──── Messages ─────▶ │   AI Provider   │
│   (Your Device) │                      │                 │
│                 │ ◀──── Response ───── │                 │
└─────────────────┘                      └─────────────────┘
         │
         │  App code only (HTML/JS/CSS)
         │
┌─────────────────┐
│   Our Server    │  ← We only serve static files
│  (No user data) │     No API keys, no messages, no logs
└─────────────────┘
```

**CTI Program** — Routed through backend (for institutional deployments):

```
┌─────────────────┐                      ┌─────────────────┐                      ┌─────────────────┐
│                 │   CTI Key &          │   CTI Backend   │   Claude API         │    Anthropic    │
│   Your Browser  │ ──── Messages ─────▶ │  (Cloud Run)    │ ──── Call ─────────▶ │    Claude API   │
│   (Your Device) │                      │                 │                      │                 │
│                 │ ◀──── Response ───── │  No logging     │ ◀──── Response ───── │                 │
└─────────────────┘                      └─────────────────┘                      └─────────────────┘
```

The CTI backend:
- Validates your CTI key and token budget
- Proxies requests to Anthropic's Claude API
- Tracks token usage for budget management
- **Does NOT log conversation content**

### What Each AI Provider Sees

When you use the Dojo, your conversations are sent to your chosen provider under your API key:

| Provider | What They Receive | Their Privacy Policy |
|----------|-------------------|----------------------|
| **Google Gemini** | Messages + your Gemini API key | [Gemini API Terms](https://ai.google.dev/gemini-api/terms) |
| **Llama (Groq)** | Messages + your Groq API key | [Groq Privacy Policy](https://groq.com/privacy-policy/) |
| **CTI/Claude** | Messages via CTI backend | [Anthropic Privacy Policy](https://www.anthropic.com/privacy) |

**Our privacy guarantee applies only to our infrastructure.** Review your chosen provider's policies if you have concerns about how they handle your data.

> **Important: Conversations are not saved.** When you close or refresh the browser, your conversation is gone. There is no session persistence — each visit starts fresh. If you want to keep a record of your session, use `@reflector` to generate a summary or use the Export button before leaving.

### How to Verify (For Engineers)

We encourage you to audit the code:

| Claim | File to Check | What You'll Find |
|-------|---------------|------------------|
| API key stored locally only | `src/hooks/useApiKey.ts` | Uses `localStorage`, never sent to our server |
| Gemini calls from browser | `src/lib/gemini-client.ts` | Direct `@google/generative-ai` SDK calls |
| Groq calls from browser | `src/lib/providers/groq-client.ts` | Direct fetch to `api.groq.com` |
| CTI routing (no logging) | `src/lib/providers/cti-client.ts` | Proxies to backend with `X-CTI-Key` header |
| Chat state is client-side | `src/hooks/useChat.ts` | React state only, no server persistence |

---

## CTI Key Management

The **CTI backend** (in `backend/`) is a FastAPI service that proxies Anthropic's Claude API for institutional and classroom use. Each student gets a **CTI key** with a fixed token budget that a coordinator creates, distributes, monitors, and tops up — all from a single CLI tool.

This section is for the **coordinator** running a deployment. End users (students) only need to receive a key and paste it into the Dojo's API Key settings — or click a `?key=` link.

### What CTI Keys Are

A CTI key is a UUID stored in the backend database. Each key carries:

- **Identity** — a student email and optional name
- **A token budget** — input + output tokens combined against a single `total_budget_tokens` cap (default: 5,000,000)
- **Activity status** — `active` / `deactivated`, plus an optional expiration date
- **Usage counters** — running totals of input and output tokens, plus `last_used_at`

When a student's browser calls the backend, it sends the UUID in the `X-CTI-Key` header. The backend validates the key, enforces the budget, proxies to Anthropic, and records the token cost.

**Why CTI keys exist:** an institution can pre-allocate Anthropic spend across a cohort, monitor per-student usage, and revoke or top up individual students — without giving anyone direct access to the institutional Anthropic API key.

### Key Lifecycle

```
create  ──▶  distribute  ──▶  student uses  ──▶  monitor  ──▶  top up / deactivate
   │              │                  │                │              │
  CLI       email or ?key=     X-CTI-Key header     CLI list       CLI add-budget
                                                      / usage         / deactivate
```

All five steps are driven by the same CLI: `backend/manage_keys.py`.

### Creating Keys

Three entry points, all of which call into `manage_keys.py`:

**1. Local / SQLite** — direct CLI for development or test deployments

```bash
cd backend
python3 manage_keys.py create \
  --email student@example.edu \
  --name "Student Name" \
  --budget 5000000 \
  --expires 2026-12-31 \
  --notes "Cohort 12 — Spring 2026"
```

**2. Production (single key)** — `backend/create_prod_key.sh`

Wraps `manage_keys.py create` for the Cloud SQL Postgres deployment. The script starts a [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy), pulls `DATABASE_URL` from Secret Manager, runs `manage_keys.py create` against the proxied connection, and tears the proxy down on exit.

```bash
cd backend
./create_prod_key.sh \
  --email student@example.edu \
  --name "Student Name" \
  --budget 5000000 \
  --expires 2026-12-31
```

Prereqs: `gcloud` authenticated, `cloud-sql-proxy` installed (`brew install cloud-sql-proxy` on macOS), and the local port 5432 free. The instance name (`symbiotic-thinking-dojo:us-central1:dojo-db`) is hardcoded in the script — edit it for your own GCP project.

**3. Production (bulk)** — `backend/create_prod_keys.sh`

Same proxy machinery, but for creating many keys at once from a CSV. Wraps `manage_keys.py bulk-create`.

```bash
cd backend
./create_prod_keys.sh students.csv keys_output.csv
```

The input CSV must have a header row with at least an `email` column; `name` is optional. The output CSV contains one row per created key with `email,name,key,budget,expires` — give this file to the coordinator distributing keys to students.

### Managing Keys

Once keys exist, `manage_keys.py` exposes the following commands. All run against whichever database the environment points to (`DATABASE_TYPE=postgres` + `DATABASE_URL` for production, or local SQLite by default).

**To run any subcommand against the production database**, use the generic wrapper:

```bash
cd backend
./manage_prod_keys.sh list
./manage_prod_keys.sh usage --email student@example.edu
./manage_prod_keys.sh usage --key <uuid>
./manage_prod_keys.sh add-budget --key <uuid> --tokens 1000000
./manage_prod_keys.sh deactivate --key <uuid>
```

The wrapper starts the Cloud SQL Auth Proxy, pulls `DATABASE_URL` from Secret Manager, forwards your subcommand and args to `manage_keys.py`, and tears down the proxy on exit. Same machinery as `create_prod_key.sh` and `create_prod_keys.sh`, but for any subcommand.

**To run against your local SQLite database**, call `manage_keys.py` directly without any env vars:

```bash
cd backend
python3 manage_keys.py list
```

Note that the local SQLite file is separate from production — keys created in production are NOT visible here, and vice versa.

| Command | What it does | Required args |
|---------|--------------|---------------|
| `create` | Create a single key | `--email` |
| `bulk-create` | Create keys from a CSV file | `--csv-file` |
| `list` | List keys with usage summary (key id, used/total, active, last used) | — |
| `usage` | Detailed usage for one student or key (input/output tokens, remaining, created, expires) | `--email` *or* `--key` |
| `deactivate` | Mark a key inactive (existing sessions get a 403 on next request) | `--key` |
| `reactivate` | Restore a previously deactivated key | `--key` |
| `add-budget` | Add tokens to a key's total budget (does NOT reset used counters) | `--key`, `--tokens` |
| `export-usage` | Dump every key's usage data to CSV (good for end-of-cohort reporting) | `--csv-file` |

Optional flags for `list`: `--active-only`. For `create` and `bulk-create`: `--budget`, `--expires`, `--notes` (single only), `--output` (bulk only, CSV path).

Run `python3 manage_keys.py --help` or `python3 manage_keys.py <command> --help` for the live argument list.

### How Students Use Their Key

Once a key is distributed, a student has three ways to load it into the Dojo:

1. **Manual paste** — Open API Key settings in the sidebar, select **CTI Program**, paste the UUID, save. The key persists in the browser's `localStorage` only.
2. **`?key=` URL parameter** — A coordinator shares a link like `https://your-dojo-url/?key=<uuid>` (optionally combined with `?topic=<slug>` to land directly in a Practice Dojo activity). The Dojo writes the key into the CTI provider slot, switches the active provider to CTI, strips the URL parameter, and shows a dismissible banner so the student knows a key was saved.
3. **Already saved** — Returning students keep their key in `localStorage` until they clear it.

While the CTI provider is active, the chat header shows a **BudgetIndicator** that polls `GET /api/budget` and displays the student's remaining tokens out of their total. The component is in `src/components/BudgetIndicator.tsx`.

Every request from the browser to the backend carries the key in the `X-CTI-Key` header — never as a URL parameter, query string, or cookie. The backend's `validate_key` dependency rejects requests that are missing, invalid, deactivated, expired, or over budget with the appropriate 401/403 response.

### Where Each Capability Lives

| Capability | File | Notes |
|------------|------|-------|
| CLI for create/list/deactivate/usage/top-up/export | `backend/manage_keys.py` | The single source of truth for key operations |
| Prod single-key wrapper | `backend/create_prod_key.sh` | Cloud SQL proxy + `manage_keys.py create` |
| Prod bulk-key wrapper | `backend/create_prod_keys.sh` | Cloud SQL proxy + `manage_keys.py bulk-create` |
| Prod generic wrapper | `backend/manage_prod_keys.sh` | Cloud SQL proxy + forwards any `manage_keys.py` subcommand |
| Database schema, queries, and `update_usage` | `backend/database.py` | Switches between SQLite and Postgres on `DATABASE_TYPE` |
| Pydantic request/response models | `backend/models.py` | `ChatRequest`, `ChatResponse`, `BudgetResponse`, `ErrorResponse` |
| `X-CTI-Key` validation (auth, budget, expiry) | `backend/auth.py` | `validate_key` FastAPI dependency |
| `GET /api/budget` endpoint | `backend/router_budget.py` | Powers the `BudgetIndicator` UI |
| Chat proxy + token usage recording | `backend/router_chat.py` | Calls Anthropic, then `database.update_usage` |
| Per-key rate limiting | `backend/rate_limiter.py` | In-memory sliding window — see operational notes |
| Browser-side CTI provider | `src/lib/providers/cti-client.ts` | Sends `X-CTI-Key` on every request |
| `?key=` URL handling | `src/app/page.tsx` | Auto-loads the key into the CTI provider slot |
| Budget UI | `src/components/BudgetIndicator.tsx` | Polls `GET /api/budget` |

### Operational Notes

**Where keys are stored**
- **Production:** Cloud SQL for PostgreSQL — instance `dojo-db` in `us-central1`. The `DATABASE_URL` is held in Secret Manager (`database-url`) and injected into the Cloud Run service at deploy time.
- **Local development:** SQLite at `./cti_keys.db`. Set `DATABASE_TYPE=sqlite` (the default) and run `manage_keys.py` directly — no proxy, no GCP auth needed.

**Budget enforcement order**

Every chat request goes through this sequence before Anthropic is called:

1. `validate_key` — key exists, `active=true`, not expired, `used_tokens_input + used_tokens_output < total_budget_tokens`
2. `check_rate_limit` — fewer than `RATE_LIMIT_REQUESTS` calls in the last `RATE_LIMIT_WINDOW_SECONDS` (defaults: 10 requests per 60 seconds)
3. Call Anthropic, stream the response
4. `database.update_usage` — record the actual input + output token counts returned by the Claude API

Step 1 uses the **counters before this turn** — a single request that exceeds the remaining budget mid-response is not refunded, but no further requests will succeed until the budget is topped up.

**Rate limiting is in-memory**

`backend/rate_limiter.py` keeps a per-key sliding window in process memory. When the Cloud Run container scales out or recycles, the window resets. This is acceptable for the abuse-prevention use case it serves (smoothing burst traffic), but it is **not** a hard cross-instance quota. The budget cap is the hard limit — rate limiting is a softer guardrail on top.

**Topping up vs. resetting**

`add-budget` increases `total_budget_tokens` and effectively widens the cap; it does not zero out used counters. To "reset" a student, deactivate the old key with `deactivate` and create a new one — that gives a clean usage history and a fresh budget.

**Distribution tips**

The simplest workflow for a cohort:

1. Prepare `students.csv` with one row per student (`email,name`).
2. Run `./create_prod_keys.sh students.csv cohort-keys.csv`.
3. Mail-merge `cohort-keys.csv` into per-student emails containing a `?key=<uuid>` link.
4. Periodically run `python3 manage_keys.py list` (via the prod proxy) to watch usage; `export-usage` for record-keeping at the end of the cohort.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free API key from Google Gemini or Groq (for Llama)

### Get a Free API Key

**Option 1: Google Gemini** (Default)
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API key"
4. Select "Create API key in new project"
5. Copy the generated key (starts with `AIza...`)

**Option 2: Llama via Groq** (Higher rate limits)
1. Go to [Groq Console](https://console.groq.com/keys) *(Note: Groq is NOT Grok from xAI)*
2. Sign up or sign in with Google/GitHub
3. Click "API Keys" in the sidebar
4. Click "Create API Key"
5. Copy the generated key (starts with `gsk_...`)

### Installation (Local Development)

```bash
# Clone the repository
git clone <repository-url>
cd Symbiotic_Thinking_Dojo

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

No `.env` file needed — you'll enter your API key directly in the app.

### Deployment

The app can be deployed to any static hosting or serverless platform:

```bash
npm run build
```

**Production deployment uses:**
- **Google Cloud Run** — Main frontend application
- **Netlify Functions** — Statistics API (optional)
- **Google Cloud SQL** — CTI key storage (institutional deployments only)

See `cloudbuild.yaml` for frontend deployment and `backend/cloudbuild.yaml` for CTI backend deployment.

**Production maintainers:** See [`PRODUCTION_DEPLOYMENT.md`](./PRODUCTION_DEPLOYMENT.md) for the full guide to deploying to production (`symbioticthinking.ai`, `dojo.symbioticthinking.ai`) and connecting the local admin dashboard to the production backend.

---

## Usage

1. **Enter your API key** — Click the settings icon, select your provider (Gemini or Llama), paste your key
2. **Take the Tour** — New users see a guided tour; restart anytime from Help menu
3. **Choose a Mode**:
   - **Practice Dojo** — Select a topic for structured learning
   - **Free Mode** — Start with your own challenge or question
4. **Select a Construct** — Choose Learn, Learn+Solve, or Learn+Solve+Build
5. **Activate Sparring Partners** — Toggle them on or @ mention in your message
6. **Track Your Progress** — Watch the DIKW pyramid and Creating-Consuming balance
7. **Export Your Session** — Save as Markdown/JSON before closing the browser

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   └── page.tsx            # Main application page
├── components/
│   ├── Chat/               # Chat interface components
│   ├── ApiKeyModal/        # API key and provider selection
│   ├── ConfigPanel/        # System prompt customization
│   ├── HelpPanel/          # Help documentation and stats
│   ├── PracticeDojo/       # Topic selection, editor, visual components
│   ├── Sidebar/            # Construct and partner selectors
│   ├── StatusPanel/        # DIKW, UMPIRE, balance trackers
│   ├── Tour/               # Guided tour overlay
│   └── ExportButton/       # Session export functionality
├── hooks/
│   ├── useChat.ts          # Chat state management
│   ├── useApiKey.ts        # API key and provider storage (localStorage)
│   ├── useDojoConfig.ts    # Dojo configuration state
│   ├── usePracticeDojoState.ts  # Practice Dojo session persistence
│   ├── useTopicConfig.ts   # Topic prompt customizations
│   ├── useTour.ts          # Tour state management
│   └── useStats.ts         # Anonymous statistics (opt-in)
└── lib/
    ├── gemini-client.ts    # Google Gemini API client
    ├── providers/          # Multi-provider abstraction
    │   ├── types.ts        # Provider configs (Gemini, Llama, CTI)
    │   ├── groq-client.ts  # Groq API client
    │   ├── cti-client.ts   # CTI backend proxy client
    │   └── index.ts        # Unified provider interface
    ├── practice-dojo/      # Practice Dojo topics and types
    │   └── topics/         # Individual topic definitions
    ├── mentions.ts         # @ mention parsing (5 partners only)
    ├── export.ts           # Session export/import
    └── prompts/            # System prompts and composer

backend/                    # CTI Backend Service (institutional only)
├── main.py                 # FastAPI application entry point
├── router_chat.py          # Chat proxy endpoint (no logging)
├── router_budget.py        # Budget check endpoint
├── database.py             # Cloud SQL connection
├── auth.py                 # CTI key validation
├── models.py               # Database models
├── manage_keys.py          # Key management CLI
├── Dockerfile              # Container build
└── cloudbuild.yaml         # Cloud Build deployment

stats-api/                  # Anonymous Statistics (Netlify Functions)
└── netlify/functions/
    └── stats.ts            # Statistics endpoint

docs/
├── Portable-Dojo-Guide.md              # System prompt for any AI chatbot
├── Symbiotic-Thinking-Knowledge-Base.md # Complete reference document
└── Practice-Dojo-Learning-Design.md    # Learning design principles
```

---

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI Providers**:
  - Google Gemini 2.5 Flash (via `@google/generative-ai` SDK)
  - Groq Llama 3.3 70B (via OpenAI-compatible REST API)
  - Anthropic Claude Sonnet (via CTI backend proxy)
- **State**: React hooks with localStorage persistence
- **Backend** (optional): FastAPI on Google Cloud Run
- **Database** (optional): PostgreSQL on Google Cloud SQL
- **Statistics** (optional): Netlify Functions with Netlify Blobs

---

## Philosophy

The Symbiotic Thinking Dojo is built on the belief that **AI should make humans more capable, not more dependent**.

Every design decision asks: "Does this help the learner build transferable skills, or does it just get them to an answer faster?"

We optimize for:
- **Judgment over execution** — knowing what to do matters more than doing it fast
- **Questions over answers** — the Sensei guides through inquiry
- **Productive struggle** — some difficulty is necessary for learning
- **Metacognitive awareness** — thinking about your thinking

The goal is learners who can work *with* AI from a position of strength — understanding when to leverage it, when to push back on it, and how to remain the author of their own thinking.

---

## License

MIT

---

## Contributing

Contributions welcome! Please read the code of conduct and contribution guidelines before submitting PRs.

## Acknowledgments

Built on the Symbiotic Thinking framework. Designed to develop human capability in an age of AI abundance.

### Built with Claude Code

This entire project — the Dojo application, the marketing website, and all infrastructure — was developed using [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant, directed by **Prof. Sathya Narayanan** (Professor of Computer Science and Director of the Computing Talent Initiative at California State University, Monterey Bay).

In the spirit of practicing what we preach, we used AI as a thinking partner to build tools that help others do the same.
