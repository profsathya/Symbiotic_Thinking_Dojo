# Privacy — what the Dojo stores, where, and why

This page is the single source of truth for what data the Symbiotic Thinking
Dojo handles. The short version: **conversations live in your browser and go
only to the AI provider that answers them; the Dojo's own backend stores
metering data, not content; usage statistics are opt-in and anonymous.**

## Data matrix

| Data | Where it lives | Sent to | Retention |
|---|---|---|---|
| Conversation messages (chat, Practice Dojo, Architect Studio) | Your browser (`localStorage`) | The AI provider that generates replies (Anthropic via the CTI backend, or the provider whose API key you configured) | Until you clear the session/activity or your browser storage |
| Practice Dojo progress (phase, checkpoints, self-checks, choices) | Your browser (`localStorage`) | Self-check summaries are included in the AI system prompt for your own session | Until you reset the topic or clear browser storage |
| Architect Studio runs (decisions, notes, timers) | Your browser (`localStorage`) | Pass 2/3 prompts go to the AI provider | Until you start over or clear browser storage |
| API keys (your own provider key, or a CTI key) | Your browser (`localStorage`) | CTI key: sent as a header to the Dojo backend to authenticate. Provider keys: sent to that provider | Until you remove them in settings |
| CTI key record | Dojo backend database | — | Key id, the student email/name your coordinator registered, token budget and usage counters, timestamps. **No conversation content is stored.** |
| Backend request logs | Cloud Run logs | — | Metadata only: key id, request type, model, message count, token counts. **Message content and system prompts are never logged.** |
| Usage statistics | Stats endpoint (only if this deployment configures one) | Anonymous counts: message-count buckets, activity/topic usage, thinking-level (DIKW) distribution, sparring-partner usage | **Only sent if you explicitly opt in** via the in-app ask. No content, no names, no keys, no identifiers |

## Key links

Coordinators can share links that carry a CTI key. Two forms work:

- **`https://<dojo>/#key=<key>` (preferred)** — the `#fragment` never leaves
  the browser, so the key cannot appear in server, proxy, or CDN access logs.
- `https://<dojo>/?key=<key>` (legacy) — still accepted so old links keep
  working.

Either way, the Dojo saves the key to your browser and immediately removes it
from the address bar so it doesn't linger in history or screenshots.

## Telemetry consent

- The Dojo never sends usage statistics unless you explicitly choose
  "Share anonymous stats" when asked (the answer is stored as
  `dojo-telemetry-consent` in your browser).
- Declining — or never answering — sends nothing and changes nothing about
  how the app works.
- Deployments with no stats endpoint configured send nothing regardless.

## What the Dojo never does

- Store your conversations on its own servers
- Log message content or system prompts on the backend
- Send anything to third parties other than the AI provider answering your
  session (and the opt-in stats endpoint, if you agreed)
- Use cookies or cross-site tracking

## Questions

Open an issue on the repository or contact your course coordinator.
