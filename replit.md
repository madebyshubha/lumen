# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Lumen — PCOS Companion App

Lumen is the flagship product in this monorepo. Living in `artifacts/lumen` (Expo), with the API at `artifacts/api-server` and the marketing site at `artifacts/mockup-sandbox`.

### Build status (v1 readiness — v2 pack, ~90% built)
- **Built and working**: 6 screens, Phase-Fluid Logic + Holding Pattern, vibe-driven home, vitals (water/sleep/energy/movement), meal logging + PCOS scoring, morning brief (in-app card), task engine, Care tab, Vent journal with LLM, Circle leaderboard, local persistence (AsyncStorage), legal screens (privacy/terms/medical disclaimer), LLM per-client quota + cache, **Apple/Google sign-in (real)**, **HealthKit + Health Connect bridge (mock fallback on Expo Go/web)**, **native voice (iOS/Android via expo-speech-recognition)**, **hosted Whisper re-transcription**.
- **Still mocked or missing for v1**: push notifications (morning brief + cycle reminders), real Circle cohort backend (in-memory mock today), PostHog analytics, Sentry crash reporting, real-data badge + foreground health refresh, App Store / Play Store listings, TestFlight / Play internal track.
- **Repo cleanup done (Task #43)**: removed `artifacts/lumen-trailer/` (Remotion), `artifacts/lumen-landing/` (no source), `attached_assets/`, `screenshots/`, 4 zero-import components (`CapabilityBadges`, `KeyboardAwareScrollViewCompat`, `Stepper`, `TaskCard`), and `scripts/src/hello.ts` placeholder. `dist/` and `static-build/` added to `.gitignore`. Note: `ErrorFallback.tsx` was kept — it has 0 direct app imports but is the default fallback used by `ErrorBoundary.tsx`.

The full v2 PRD, business one-pager, user flow architecture, week-by-week timeline, and RICE-prioritised to-dos are in `.local/tasks/lumen-v1-launch-pack.md`.

### Lumen-specific conventions (user preferences)
- **No emojis anywhere** in the Lumen app or its copy.
- **No text input on the Today screen** — single-tap UX only (chips, drops, mic).
- Glassmorphism aesthetic (`GlassCard` component).
- Plain, human language in all copy. Device-agnostic ("we" not "your watch").
- Voice input on every input surface where possible. Native voice (iOS/Android) shipped in v1 via expo-speech-recognition + hosted Whisper.
- `cycle.phase` (calendar) drives protocols/mood/leaderboard; `cycle.effectivePhase` drives UI/tasks (so Holding Pattern shows when calendar=luteal but no BBT rise detected).
