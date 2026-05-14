import React from "react";

import { LegalScreen } from "@/components/LegalScreen";

export default function MedicalDisclaimer() {
  return (
    <LegalScreen
      title="Medical disclaimer"
      lastUpdated="May 14, 2026"
      intro="Lumen is a wellness companion, not a medical device. The content in this app is for informational and lifestyle purposes only."
      sections={[
        {
          heading: "Not medical advice",
          body: "Nothing in Lumen constitutes medical advice, diagnosis, or treatment. The phase explanations, daily missions, food suggestions, and AI-generated responses are general lifestyle guidance, not a substitute for the judgment of a qualified clinician.",
        },
        {
          heading: "Always consult your clinician",
          body: "Before starting, stopping, or changing any treatment, supplement, exercise plan, or diet — especially in connection with PCOS, PCOD, fertility, pregnancy, or any other medical condition — please consult a qualified healthcare professional who knows your full history.",
        },
        {
          heading: "Emergencies",
          body: "Lumen does not handle emergencies. If you believe you are experiencing a medical emergency, call your local emergency number immediately.",
        },
        {
          heading: "Cycle tracking limitations",
          body: "Lumen estimates your cycle phase from the date you provide and any wearable data you sync. It cannot detect pregnancy, miscarriage, or any underlying condition. Cycle predictions are not contraceptive guidance.",
        },
        {
          heading: "AI-generated content",
          body: "When you write a vent, our AI may extract symptoms and suggest small lifestyle nudges. It is explicitly instructed not to diagnose or recommend medication, but AI can make mistakes. Treat its output as a friendly suggestion, never a clinical opinion.",
        },
      ]}
    />
  );
}
