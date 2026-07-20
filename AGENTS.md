# Working in this repository (humans and AI agents)

A quick orientation plus the rules that keep changes safe. The architecture
map lives in `docs/ARCHITECTURE.md`; privacy commitments in `docs/PRIVACY.md`.

## Commands

```bash
npm run dev          # Next.js dev server
npm run lint         # eslint over src/ — errors fail CI
npm run typecheck    # tsc --noEmit
npm run test         # vitest (tests/ directory)
npm run build        # production build — must pass before merging
```

Backend (FastAPI, in `backend/`): `pip install -r backend/requirements.txt`,
run with `uvicorn main:app`. CI compiles every backend module.

## Quality gates

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, and a
production build on every PR. All four must pass.

- **eslint errors are at zero — keep them there.** Warnings are tolerated but
  don't add new ones.
- The strictest rule in play is `react-hooks/set-state-in-effect`. Don't call
  setState synchronously in an effect body. Instead:
  - Load-from-localStorage → **lazy `useState` initializer** with a
    `typeof window === 'undefined'` guard (see `usePracticeDojoState`,
    `useApiKey`, `useTour`).
  - Reset-state-when-props-change → **adjust during render** by tracking the
    previous value in state (see `PromptEditor`, `ApiKeyModal`,
    `TopicSelectionModal`).
  - Fetch-then-set → set state in the async callback with a cancelled flag
    (see `BudgetIndicator`).
  - Impure values (`Date.now()`) are also banned during render — compute them
    in callbacks (see `CountdownTimer`).
- When verifying commands in automation, capture real exit codes
  (`npx eslint src; echo $?`) — don't pipe the output through `tail`/`grep`
  and read the pipe's status.

## Conventions

- TypeScript + Next.js App Router + Tailwind v4; dark theme
  (`bg-gray-950` base) with `print:` variants on instructor-facing pages.
- Practice Dojo topics live in `src/lib/practice-dojo/topics/`. Phase
  progression is **student-owned**: the `[NEXT_PHASE]` marker is only a
  readiness signal that highlights the "Ready to move on?" button — it never
  advances state. New topic prompts must describe it that way (the test suite
  checks for engine-semantics wording).
- Student free text is untrusted everywhere it enters a system prompt:
  flatten whitespace, cap length, JSON-quote (see `quoteSelfCheckResponse`
  in `src/lib/prompts/composer.ts`).
- Keys in URLs: use the shared `src/lib/url-key.ts` helper; prefer `#key=`
  fragments over `?key=` query params in anything that generates links.
- Telemetry is opt-in only. Never add a tracking call that isn't gated on
  stored consent (`useStats`).
- Backend: per-key Anthropic clients, `AsyncAnthropic` only (never the sync
  client in an async route), and budget changes go through
  `reserve_budget`/`settle_usage`/`release_budget` — not read-then-write.

## PR habits

- Branch from latest `main`; one concern per PR.
- Before pushing: `npm run lint && npm run typecheck && npm run test &&
  npm run build`.
- Commit messages explain *why*; PR bodies list what was verified and how.
