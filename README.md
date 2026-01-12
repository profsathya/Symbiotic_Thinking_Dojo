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

### Frameworks

- **UMPIRE Cycle**: Understand → Map → Plan → Implement → Review → Evaluate
- **3Cs Checkpoint**: Context, Choices, Confirmation before every decision
- **DIKW Pyramid**: Track depth from Data → Information → Knowledge → Wisdom
- **Creating-Consuming Balance**: Visual feedback on active vs. passive engagement

### Guided Practice

Start with an Ikigai discovery session — a structured journey to explore your interests, strengths, and purpose.

---

## Privacy Architecture

**This application uses a privacy-first, client-side architecture. Your API key and conversations never pass through our servers.**

### The Privacy Guarantee

| What | Where It Lives | Our Access |
|------|----------------|------------|
| Your API key | Browser localStorage | **None** |
| Your conversations | Browser memory → Google API | **None** |
| Chat history | Not persisted | **None** |

We serve the application code. That's it. Your data flows directly between your browser and Google's Gemini API.

### How to Verify (For Engineers)

We encourage you to audit the code. Here's where to look:

| Claim | File to Check | What You'll Find |
|-------|---------------|------------------|
| API key stored locally only | `src/hooks/useApiKey.ts` | Uses `localStorage`, never sent to server |
| API calls from browser only | `src/lib/gemini-client.ts` | Direct `@google/generative-ai` SDK calls |
| No server-side chat processing | `src/app/api/` | Empty — no chat endpoints |
| Chat state is client-side only | `src/hooks/useChat.ts` | React state, no server calls |

### Data Flow

```
┌─────────────────┐                      ┌─────────────────┐
│                 │   Your API Key &     │                 │
│   Your Browser  │ ──── Messages ─────▶ │   Google AI     │
│   (Your Device) │                      │   (Gemini API)  │
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

### What Google Sees

When you use the Dojo, your conversations go to Google's Gemini API under your own API key. Google's [API terms](https://ai.google.dev/gemini-api/terms) apply. We recommend reviewing their privacy practices if you have concerns.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google AI API key (free tier available)

### Get a Free API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API key"
4. Select "Create API key in new project" (or choose existing)
5. Copy the generated key

The free tier includes ~15 requests/minute and ~1M tokens/day — more than enough for personal learning.

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

The build output is a standard Next.js static export.

---

## Usage

1. **Enter your API key** — Click "Set API Key" in the sidebar
2. **Select a Construct** — Choose your training mode based on stakes
3. **Activate Sparring Partners** — Toggle or @ mention partners to challenge your thinking
4. **Engage with the Sensei** — Share your challenge and work through it
5. **Track Your Progress** — Watch the DIKW pyramid and Creating-Consuming balance
6. **Reflect with @reflector** — Generate a summary when you're ready to wrap up

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   └── page.tsx           # Main application page
├── components/
│   ├── Chat/              # Chat interface components
│   ├── ApiKeyModal/       # API key configuration
│   ├── HelpPanel/         # Help and documentation
│   ├── Sidebar/           # Construct and partner selectors
│   └── StatusPanel/       # DIKW, UMPIRE, balance trackers
├── hooks/
│   ├── useChat.ts         # Chat state management (client-side)
│   ├── useApiKey.ts       # API key management (localStorage)
│   └── useDojoConfig.ts   # Configuration state
└── lib/
    ├── gemini-client.ts   # Direct browser-to-Gemini API calls
    ├── mentions.ts        # @ mention parsing
    ├── prompts/           # System prompts and composer
    └── types.ts           # TypeScript definitions
```

---

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **LLM**: Google Gemini API (client-side)
- **State**: React hooks (no server state)
- **Privacy**: Zero server-side data handling

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
