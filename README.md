# Lumen

> A human-first PCOS / PCOD companion that adapts to your actual body each day — not a generic calendar.
>
> *"I move with your body, not against it."*

Lumen is a mobile app for women with PCOS and PCOD. Most period apps assume a textbook 28-day cycle and tell women their period is "in 3 days" when their body never even ovulated. Lumen does the opposite: it reads her overnight signals, understands her body's real state, and adjusts the day for her.

## What makes it different

- **Phase-Fluid Logic** — when the calendar says luteal but no temperature rise has confirmed ovulation, Lumen stays in a calm "Holding Pattern" focused on insulin sensitivity and stress, instead of counting down to a period that may not be coming. This is the headline feature, and as far as we know, no other app does it.
- **Proactive morning briefing** — opens with a card that already did the thinking: *"I checked your overnight data, you had a restless night, so I moved your workout to tomorrow."*
- **Vibe-driven dynamic home** — the home screen's layout, palette, mission tone and visible sections all shift with her current state. Calm days show more; rough days simplify and protect her attention.
- **Cycle / diet / travel-aware missions** — daily tasks generated from four signals at once (where she is in her cycle, her diet, where in the world she is, and her active concerns).
- **Single-tap UX** — no text input on the home screen, ever. The app speaks plain language.
- **No emojis anywhere** — emotional weight comes from copy and motion.

## Screens

- **Today (Home)** — proactive brief, mood, phase-aware mission, today's tasks, food/water/sleep widgets.
- **Care** — symptom-aware PCOS plan, supplements, and education in plain language.
- **Vent** — single-tap "talk it out" mic, no typing required.
- **Circle** — anonymous community mood map and phase-mates leaderboard. No names, no feed.
- **You (Profile)** — adaptive task settings, current HRV / stress signal, diet and context.

The full pitch screenshot pack is in [`screenshots/`](./screenshots).

## Stack

- **App**: Expo (React Native) + Expo Router, with a web target for the preview pane.
- **API**: Express + Drizzle (PostgreSQL) — wired up but not yet feeding the app; the prototype runs entirely on-device.
- **Monorepo**: pnpm workspaces.

## Project layout

```
artifacts/
  lumen/             — the mobile app (Expo)
  api-server/        — Express API server (placeholder)
  mockup-sandbox/    — component preview server for design iteration
```

## Running locally

```bash
pnpm install
pnpm --filter @workspace/lumen run dev   # Expo (web + mobile via QR code)
pnpm --filter @workspace/api-server run dev
```

To run on a real iPhone or Android device without going through the App Store, install **Expo Go** on the phone and scan the QR code that the Expo dev server prints.

## Status

This is a prototype. Sign-in is local (nothing leaves the device), and the demo seed places the user 18 days past her last period with no detected ovulation, so the app opens directly into the Holding Pattern dashboard — its headline state.
