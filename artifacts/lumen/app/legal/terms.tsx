import React from "react";

import { LegalScreen } from "@/components/LegalScreen";

export default function Terms() {
  return (
    <LegalScreen
      title="Terms of use"
      lastUpdated="May 14, 2026"
      intro="By using Lumen, you agree to these terms. They are short on purpose."
      sections={[
        {
          heading: "What Lumen is",
          body: "Lumen is a free wellness companion designed for women living with PCOS, PCOD, or irregular cycles. It is not a medical device and does not provide medical care.",
        },
        {
          heading: "Eligibility",
          body: "You must be at least 13 years old to use Lumen. If you are between 13 and 18, please use Lumen with a parent or guardian's awareness.",
        },
        {
          heading: "Acceptable use",
          body: "Use Lumen for your own personal wellness. Do not attempt to scrape, reverse engineer, or disrupt the service. Do not impersonate other users in the Circle leaderboard.",
        },
        {
          heading: "AI features",
          body: "The AI in the Vent journal is a lifestyle-coaching assistant that may produce inaccurate or irrelevant responses. You agree not to rely on it for medical decisions. See the medical disclaimer for full detail.",
        },
        {
          heading: "Changes",
          body: "We may update these terms as Lumen evolves. Material changes will be surfaced in-app before they take effect.",
        },
        {
          heading: "Contact",
          body: "Questions about these terms can be sent to hello@lumenpcos.app.",
        },
      ]}
    />
  );
}
