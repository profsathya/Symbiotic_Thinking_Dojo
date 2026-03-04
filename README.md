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

## Features

### Training Constructs

Choose your engagement level based on stakes and learning goals:

- **Learn**: Safe exploration and skill acquisition (low stakes)
- **Learn + Solve**: Apply learning to defined problems (medium stakes)
- **Learn + Solve + Build**: Create real value for real stakeholders (high stakes)

### Sparring Partners

Modular challengers that target specific cognitive skills:

| Partner | Role |
|---------|------|
| **The Framer** | Blocks implementation until the problem is understood |
| **The Auditor** | Enforces 3Cs (Context, Choices, Confirmation) before accepting decisions |
| **The Connector** | Bridges domains and finds patterns from other fields |
| **The Challenger** | Pressure-tests thinking and plays devil's advocate |
| **The Reflector** | Guides self-evaluation and generates structured summaries |

Invoke partners via toggles (always active) or @ mentions (single message): `@framer`, `@auditor`, `@connector`, `@challenger`, `@reflector`

### The Sensei

Your metacognitive coach — guides through questions, not answers. The Sensei helps you stay aware of your thinking process without doing the thinking for you.

### Practice Dojo

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
- **Visual components**: Selection cards, comparison tables, framework diagrams
- **Progressive scaffolding**: Support adapts based on your interaction count
- **Session persistence**: Resume interrupted sessions
- **Customizable prompts**: Edit topic prompts via the TopicEditor

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
- **Statistics**: View anonymous aggregate usage statistics (opt-in)

### Use Without the App (Portable Dojo)

Don't want to set up an API key or use the web app? You can get the full Dojo experience in any AI chatbot that supports custom instructions:

- **[Portable Dojo Guide](docs/Portable-Dojo-Guide.md)** — Setup instructions and system prompt
- **[Knowledge Base](docs/Symbiotic-Thinking-Knowledge-Base.md)** — Complete reference document to attach

Works with Claude Projects, ChatGPT, Gemini, and other AI assistants.

---

## AI Providers

The Dojo supports multiple AI providers. Select your preferred provider in Settings:

| Provider | Model | Free Tier Limits | Best For |
|----------|-------|------------------|----------|
| **Google Gemini** | Gemini 2.5 Flash | ~15 req/min, ~20 req/day | Default choice, good balance |
| **Groq** | Llama 3.3 70B | ~30 req/min, ~14,400 req/day | Higher rate limits, fast inference |
| **CTI Program** | Claude Sonnet | Token budget managed by coordinator | Institutional/classroom use |

> **Note**: Groq (groq.com) provides ultra-fast Llama inference. This is different from Grok (xAI's chatbot).

Your API key is stored in your browser's localStorage and never passes through our servers. Conversations flow directly from your browser to the AI provider.

---

## Privacy Architecture

**This application uses a privacy-first, client-side architecture. Your API key and conversations never pass through our servers.**

### The Privacy Guarantee (Our Servers)

| What | Where It Lives | Our Access |
|------|----------------|------------|
| Your API key | Browser localStorage | **None** |
| Your conversations | Browser memory only | **None** |
| Chat history | Not persisted anywhere | **None** |

We serve the application code. That's it. Your data flows directly between your browser and your chosen AI provider.

> **Important: Conversations are not saved.** When you close or refresh the browser, your conversation is gone. There is no session persistence — each visit starts fresh. If you want to keep a record of your session, use `@reflector` to generate a summary or use the Export button before leaving.

### What the AI Provider Sees

When you use the Dojo, your conversations are sent to your chosen AI provider (Google Gemini, Groq, or CTI backend) under your own API key. Each provider's privacy policies apply to data sent to their API.

**Our privacy guarantee applies only to our infrastructure** — we never see your conversations. Review your chosen provider's policies if you have concerns about how they handle your data.

### CTI Program Provider

When using a CTI (Computing Talent Initiative) program key:
- Conversations route through the CTI backend service (hosted on Google Cloud Run)
- No conversation content is logged server-side
- Token usage is tracked for budget management
- Your coordinator manages key allocation and budgets

### How to Verify (For Engineers)

We encourage you to audit the code. Here's where to look:

| Claim | File to Check | What You'll Find |
|-------|---------------|------------------|
| API key stored locally only | `src/hooks/useApiKey.ts` | Uses `localStorage`, never sent to server |
| Gemini API calls from browser | `src/lib/gemini-client.ts` | Direct `@google/generative-ai` SDK calls |
| Groq API calls from browser | `src/lib/providers/groq-client.ts` | Direct OpenAI-compatible API calls |
| CTI routing (no logging) | `src/lib/providers/cti-client.ts` | Proxies to backend with X-CTI-Key header |
| Chat state is client-side only | `src/hooks/useChat.ts` | React state, no server persistence |

### Data Flow

```
┌─────────────────┐                      ┌─────────────────┐
│                 │   Your API Key &     │   Google/Groq   │
│   Your Browser  │ ──── Messages ─────▶ │   AI Provider   │
│   (Your Device) │                      │                 │
│                 │ ◀──── Response ───── │                 │
└─────────────────┘                      └─────────────────┘
         │
         │  App code only (HTML/JS/CSS)
         │
┌─────────────────┐
│   Our Server    │  ← We only serve the static app
│  (No user data) │     No API keys, no messages, no logs
└─────────────────┘
```

---

## Anonymous Usage Statistics

The Dojo optionally collects anonymous, aggregate usage statistics to help improve the platform. This is **completely separate** from your conversations.

**What we collect:**
- Session counts (not content)
- Message count ranges (1-5, 6-10, 11-20, 21+)
- DIKW level distributions
- Partner and construct usage counts
- Practice Dojo topic usage

**What we never collect:**
- Conversation content
- API keys
- Personal identifiers

Statistics are stored via Netlify Functions and viewable in the Help menu. See `stats-api/netlify/functions/` for implementation details.

---

## Getting Started

### Prerequisites

- Node.js 18+
- An API key from one of the supported providers (free tiers available)

### Get a Free API Key

**Google Gemini:**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API key"
4. Select "Create API key in new project"
5. Copy the generated key

**Groq:**
1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up or sign in (Google/GitHub)
3. Click "API Keys" in sidebar
4. Click "Create API Key"
5. Copy the generated key

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

The build output is a standard Next.js application. We use:
- **Google Cloud Run** for the main frontend
- **Netlify Functions** for statistics API
- **Google Cloud SQL** for CTI key management (institutional deployments)

See `cloudbuild.yaml` and `backend/cloudbuild.yaml` for deployment configuration.

---

## Usage

1. **Enter your API key** — Click "Set API Key" in the sidebar, select your provider
2. **Take the Tour** — New users see a guided tour; restart anytime from Help
3. **Choose a Mode**:
   - **Practice Dojo** — Structured learning topics with visual progression
   - **Free Mode** — Open-ended conversation with the Sensei
4. **Select a Construct** — Choose your training mode based on stakes
5. **Activate Sparring Partners** — Toggle or @ mention partners to challenge your thinking
6. **Track Your Progress** — Watch the DIKW pyramid and Creating-Consuming balance
7. **Export Your Session** — Save as Markdown/JSON before leaving

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   └── page.tsx            # Main application page
├── components/
│   ├── Chat/               # Chat interface components
│   ├── ApiKeyModal/        # API key and provider configuration
│   ├── ConfigPanel/        # System prompt customization
│   ├── HelpPanel/          # Help and documentation
│   ├── PracticeDojo/       # Topic selection, editor, progress, visual components
│   ├── Sidebar/            # Construct and partner selectors
│   ├── StatusPanel/        # DIKW, UMPIRE, balance trackers
│   ├── Tour/               # Guided tour overlay and prompt
│   ├── ExportButton/       # Session export functionality
│   └── StatsModal/         # Usage statistics display
├── hooks/
│   ├── useChat.ts          # Chat state management
│   ├── useApiKey.ts        # API key and provider management (localStorage)
│   ├── useDojoConfig.ts    # Configuration state
│   ├── usePracticeDojoState.ts  # Practice Dojo session state
│   ├── useTopicConfig.ts   # Topic customizations
│   ├── useTour.ts          # Tour state management
│   └── useStats.ts         # Anonymous statistics tracking
└── lib/
    ├── gemini-client.ts    # Google Gemini API client
    ├── providers/          # Multi-provider abstraction
    │   ├── types.ts        # Provider configuration
    │   ├── groq-client.ts  # Groq API client
    │   ├── cti-client.ts   # CTI backend proxy client
    │   └── index.ts        # Unified provider interface
    ├── practice-dojo/      # Practice Dojo topics and types
    ├── mentions.ts         # @ mention parsing
    ├── export.ts           # Session export/import utilities
    └── prompts/            # System prompts and composer

backend/                    # CTI Backend Service (FastAPI)
├── main.py                 # FastAPI application
├── router_chat.py          # Chat proxy endpoint
├── router_budget.py        # Budget check endpoint
├── database.py             # Cloud SQL connection
├── auth.py                 # CTI key authentication
├── manage_keys.py          # Key management utilities
└── cloudbuild.yaml         # Backend deployment config

stats-api/                  # Anonymous Statistics API (Netlify Functions)
└── netlify/functions/
    └── stats.ts            # Statistics endpoint

docs/
├── Portable-Dojo-Guide.md           # Use Dojo with any AI chatbot
├── Symbiotic-Thinking-Knowledge-Base.md  # Complete reference document
└── Practice-Dojo-Learning-Design.md # Learning design principles
```

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI Providers**:
  - Google Gemini 2.5 Flash (via @google/generative-ai)
  - Groq Llama 3.3 70B (via OpenAI-compatible API)
  - Anthropic Claude (via CTI backend proxy)
- **State**: React hooks with localStorage persistence
- **Privacy**: Zero server-side data handling for conversations
- **Backend** (optional): FastAPI on Google Cloud Run
- **Statistics**: Netlify Functions with Netlify Blobs storage

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
