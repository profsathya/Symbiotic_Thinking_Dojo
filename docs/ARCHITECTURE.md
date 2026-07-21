# Architecture

A map of the system for anyone (human or agent) making changes. Companion
docs: `AGENTS.md` (working rules), `docs/PRIVACY.md` (data commitments).

## The pieces

```
Browser (Next.js app, all state in localStorage)
 ├─ Free chat + Sparring Partners        src/app/page.tsx, src/hooks/useChat.ts
 ├─ Practice Dojo (guided topics)        src/lib/practice-dojo/*, src/components/PracticeDojo/*
 ├─ Architect Studio (three-pass forms)  src/app/architect/*, src/lib/architect/*
 └─ Providers                            src/lib/providers/*
      ├─ Gemini / Groq  → provider APIs directly (user's own key)
      └─ CTI            → FastAPI backend → Anthropic
                          backend/ (Cloud Run + Postgres)
```

There is no application server for the frontend beyond static/SSR delivery:
conversations, progress, keys, and settings all live in the browser and go
only to the AI provider that answers them.

## Frontend

- **Chat engine** (`src/hooks/useChat.ts`): messages, streaming, marker
  parsing (BALANCE, DIKW, `[NEXT_PHASE]`), welcome messages. Markers are
  stripped before display.
- **System prompts** (`src/lib/prompts/composer.ts`): layered composition —
  dojo philosophy → sensei → mode section (Practice Dojo topic / Ikigai) →
  construct → partners → engagement scaffolding. Practice Dojo context
  (current phase guidance, checkpoint history, student self-checks) is
  injected here. Student free text is flattened/capped/JSON-quoted before it
  enters a prompt.
- **Practice Dojo**: a topic (`TopicConfig`) is a sequence of phases with
  per-phase content guidance. `phases[0]` is a welcome-owned placeholder;
  sessions start on `phases[1]`. **Progression is student-owned**: the
  "Ready to move on?" button opens a self-check dialog (goal + honest
  response + decision). The model's `[NEXT_PHASE]` marker only marks the
  phase "sensei-signaled," which highlights the button. The final phase's
  gate completes the activity (`markTopicCompleted`). State persists in
  localStorage via `usePracticeDojoState` and survives refresh/resume.
- **Architect Studio** (`/architect`): a forward-only stage machine
  (setup → solo → delegate → partner → reflection → complete) over
  structured forms, deliberately outside the chat-phase engine. Ten
  decisions across four themes; pausable per-stage timers; instructor
  lesson plan at `/architect/plan`.
- **Telemetry** (`src/hooks/useStats.ts`): anonymous counts only, sent to an
  optional stats endpoint, strictly gated on explicit opt-in consent.

## Backend (`backend/`)

FastAPI proxy so institutions can allocate Anthropic spend per student
without sharing a provider key:

- `auth.py` — validates the `X-CTI-Key` header (active, unexpired, under
  budget).
- `router_chat.py` — the chat proxy. Per-provider-key `AsyncAnthropic`
  clients (never a shared global; never the sync client). Budget flow is
  atomic: `reserve_budget` claims `max_tokens` in one conditional UPDATE,
  `settle_usage` replaces the reservation with actual usage,
  `release_budget` returns it on failure. Logs metadata only — no message
  content.
- `database.py` — SQLite (dev) / Postgres (prod) behind one wrapper.
- `manage_keys.py` — coordinator CLI (create/list/top-up/export);
  `manage_prod_keys.sh` wraps it with the Cloud SQL proxy.
- Model selection: `SONNET_MODEL` for reasoning requests, `HAIKU_MODEL` for
  extraction (`config.py`, overridable by env).

## Deployment

- Frontend → Cloud Run via `.github/workflows/deploy.yml` (on push to main).
- Backend → Cloud Run via `deploy-backend*.yml`.
- Quality gates → `.github/workflows/ci.yml` (lint, typecheck, vitest,
  build on every PR).

## Invariants worth protecting

1. Conversations never touch Dojo-owned storage or logs.
2. The student decides phase progression; models only signal.
3. Student free text is quoted data inside prompts, never structure.
4. Telemetry without consent is a bug, not a default.
5. One student's spend can never land on another student's provider key.
