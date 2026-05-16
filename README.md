# Lumen

> A human-first PCOS / PCOD companion that adapts to your actual body each day — not a generic calendar.
>
> "I move with your body, not against it."

Lumen is a mobile app for women with PCOS and PCOD. Most period trackers assume a textbook 28-day cycle and shame women when their body "fails" the calendar. Lumen does the opposite — it reads her real signals, understands where she actually is in her cycle, and adjusts the day's plan around her.

## What makes it different

- **Phase-Fluid Logic** — when the calendar says luteal but no BBT rise has confirmed ovulation, Lumen enters a calm "Holding Pattern" focused on insulin sensitivity and stress management, instead of counting down to a period that may not be coming. No other app does this.
- **Vibe-driven home** — one sentence (typed or spoken) reshapes the day's tasks, palette, and mission tone.
- **Voice-first journal** — on-device live captions via expo-speech-recognition; hosted Whisper re-transcribes afterward with PCOS-vocabulary bias; LLM extracts symptoms and habits automatically.
- **Wearable-optional** — reads menstrual flow, HRV, BBT, sleep, and steps from Apple HealthKit (iOS) and Health Connect (Android); gracefully falls back to smart defaults without a wearable.
- **Single-tap UX** — no text input on the home screen, ever. Chips, drops, and the mic only.
- **No emojis** — emotional weight comes from copy and motion, not decorations.

## Screens

- **Today** — proactive morning brief, phase chip, vibe input, vitals row, phase-adaptive task list.
- **Care** — symptom-aware PCOS protocols (acne, fatigue, hair loss, etc.) in plain language.
- **Vent** — single-tap voice journal with live captions, Whisper polish, and LLM symptom extraction.
- **Circle** — anonymous phase-mate leaderboard and mood map. No names, no feed.
- **You** — profile, HealthKit connection status, legal documents, sign-out.

## What is built

| Area | Status |
|---|---|
| 6 app screens + onboarding | Done |
| Phase-Fluid Logic + Holding Pattern | Done |
| Apple Sign-In + Google Sign-In (real JWT sessions) | Done |
| HealthKit (iOS) + Health Connect (Android) bridge | Done |
| Native voice — expo-speech-recognition | Done |
| Hosted Whisper ASR with PCOS-vocab bias | Done |
| LLM vent analysis with per-client quota + 12h cache | Done |
| Legal screens — Privacy / Terms / Medical disclaimer | Done |
| Push notifications | Not yet |
| Circle cohort backend (DB + API) | Not yet (in-memory mock) |
| PostHog analytics + Sentry crash reporting | Not yet |
| App Store / Play Store listings + EAS build | Not yet |

The v1 launch PRD, 4-week timeline, and RICE-prioritised to-do list are in [`.local/tasks/lumen-v1-launch-pack.md`](./.local/tasks/lumen-v1-launch-pack.md).

## Stack

- **App**: Expo 54 + Expo Router v6 (iOS / Android / web target)
- **API**: Express 5 + Drizzle ORM (PostgreSQL)
- **Auth**: expo-apple-authentication + @react-native-google-signin/google-signin + JWT sessions in expo-secure-store
- **Health**: @kingstinct/react-native-healthkit (iOS) + react-native-health-connect (Android)
- **Voice**: expo-speech-recognition (native) + Web Speech API (web) + OpenAI Whisper (hosted ASR)
- **LLM**: OpenAI GPT-4o via api-server
- **Monorepo**: pnpm workspaces + TypeScript project references + Orval API codegen

## Project layout

```
artifacts/
  lumen/           — Expo mobile app (iOS / Android / web)
  api-server/      — Express API server (auth, vents, vibe, ASR)
  mockup-sandbox/  — Component preview server (Canvas design tool)
lib/
  api-spec/        — OpenAPI spec + Orval codegen config
  api-client-react/— Generated React Query hooks (from api-spec)
  api-zod/         — Generated Zod schemas (from api-spec)
  db/              — Drizzle ORM schema + migrations
  integrations-openai-ai-server/ — OpenAI client + rate-limit helpers
```

## Running locally

```bash
pnpm install
pnpm --filter @workspace/lumen run dev        # Expo — web preview + QR code for device
pnpm --filter @workspace/api-server run dev   # Express API server
```

Scan the QR code with Expo Go on your phone for the native preview. Google Sign-In and HealthKit require a custom dev client — Expo Go supports Apple Sign-In and the mock health fallback.
