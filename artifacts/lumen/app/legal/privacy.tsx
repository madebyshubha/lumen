import React from "react";

import { LegalScreen } from "@/components/LegalScreen";

export default function PrivacyPolicy() {
  return (
    <LegalScreen
      title="Privacy policy"
      lastUpdated="May 14, 2026"
      intro="Lumen is built so that the data you most care about — your cycle, your moods, your vents — stays on your device by default."
      sections={[
        {
          heading: "What we store on your device",
          body: "Your name, sign-in provider, diet, country, last period date, daily logs (water, sleep, energy, movement, meals), tracked concerns, vent journal entries, and your streak. This data lives in your phone's local storage and is not uploaded to our servers.",
        },
        {
          heading: "What we send to our server",
          body: "When you write a vent or set a vibe, the text of that single entry — plus the minimum context needed to interpret it (cycle phase, day of cycle, diet, country, energy, tracked concerns) — is sent to our API for AI analysis. We do not store the text after the response is returned. We do not associate it with your name.",
        },
        {
          heading: "Third parties we use",
          body: "We use OpenAI (or a comparable provider) to analyse vent entries. They process the text under their data-handling terms and do not use it to train their models. We do not sell your data, ever.",
        },
        {
          heading: "Health data permissions",
          body: "If you grant Apple Health or Health Connect access, Lumen reads HRV, sleep, basal body temperature, and step count to power Phase-Fluid Logic and the morning brief. This data stays on your device and is never uploaded.",
        },
        {
          heading: "Anonymous analytics",
          body: "We may collect anonymous, aggregated usage events (screen views, feature taps, retention) to understand what is working. These events are tied to a random device ID, never to your name, vent text, or health data. You can opt out from the You tab.",
        },
        {
          heading: "Your rights",
          body: "You can sign out and reset at any time from the You tab — this clears all local data. To request deletion of any server-side data associated with your device ID, write to privacy@lumenpcos.app.",
        },
      ]}
    />
  );
}
