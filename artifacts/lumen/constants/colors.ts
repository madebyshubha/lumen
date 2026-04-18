export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export type PhasePalette = {
  name: string;
  tagline: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceMuted: string;
  glass: string;
  glassBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  highlight: string;
  ring: string;
  ringTrack: string;
  gradientFrom: string;
  gradientTo: string;
  shadow: string;
  isDark: boolean;
};

const phases: Record<CyclePhase, PhasePalette> = {
  menstrual: {
    name: "Menstrual",
    tagline: "Low battery. Be gentle.",
    background: "#0f1024",
    backgroundAlt: "#181a36",
    surface: "rgba(255,255,255,0.06)",
    surfaceMuted: "rgba(255,255,255,0.03)",
    glass: "rgba(255,255,255,0.08)",
    glassBorder: "rgba(255,255,255,0.14)",
    text: "#f4f2ff",
    textMuted: "#aab0d6",
    primary: "#9aa6ff",
    primarySoft: "rgba(154,166,255,0.18)",
    accent: "#c79bff",
    accentSoft: "rgba(199,155,255,0.20)",
    highlight: "#7b8cff",
    ring: "#9aa6ff",
    ringTrack: "rgba(255,255,255,0.08)",
    gradientFrom: "#1a1748",
    gradientTo: "#0a0d28",
    shadow: "#000000",
    isDark: true,
  },
  follicular: {
    name: "Follicular",
    tagline: "Build energy. Lean in.",
    background: "#f3fbf5",
    backgroundAlt: "#e7f7ed",
    surface: "rgba(255,255,255,0.78)",
    surfaceMuted: "rgba(255,255,255,0.55)",
    glass: "rgba(255,255,255,0.55)",
    glassBorder: "rgba(56,170,118,0.18)",
    text: "#15301f",
    textMuted: "#5a7869",
    primary: "#1e9d6b",
    primarySoft: "rgba(30,157,107,0.16)",
    accent: "#7ed59c",
    accentSoft: "rgba(126,213,156,0.22)",
    highlight: "#3ec07c",
    ring: "#1e9d6b",
    ringTrack: "rgba(30,157,107,0.14)",
    gradientFrom: "#dff7e6",
    gradientTo: "#f6fff8",
    shadow: "#1e9d6b",
    isDark: false,
  },
  ovulatory: {
    name: "Ovulatory",
    tagline: "Glow on. You're radiant.",
    background: "#fff8e7",
    backgroundAlt: "#fdf0d2",
    surface: "rgba(255,255,255,0.74)",
    surfaceMuted: "rgba(255,255,255,0.5)",
    glass: "rgba(255,255,255,0.55)",
    glassBorder: "rgba(207,150,40,0.22)",
    text: "#3a2a05",
    textMuted: "#8a6f33",
    primary: "#d49b1a",
    primarySoft: "rgba(212,155,26,0.18)",
    accent: "#f3c969",
    accentSoft: "rgba(243,201,105,0.26)",
    highlight: "#e9b13a",
    ring: "#d49b1a",
    ringTrack: "rgba(212,155,26,0.16)",
    gradientFrom: "#fff1c8",
    gradientTo: "#fff9e6",
    shadow: "#d49b1a",
    isDark: false,
  },
  luteal: {
    name: "Luteal",
    tagline: "Steady the tide.",
    background: "#fff3e9",
    backgroundAlt: "#fde2cd",
    surface: "rgba(255,255,255,0.72)",
    surfaceMuted: "rgba(255,255,255,0.5)",
    glass: "rgba(255,255,255,0.55)",
    glassBorder: "rgba(212,113,40,0.20)",
    text: "#3b1c0a",
    textMuted: "#8c5a3a",
    primary: "#d97639",
    primarySoft: "rgba(217,118,57,0.18)",
    accent: "#f3a96b",
    accentSoft: "rgba(243,169,107,0.22)",
    highlight: "#e88a4b",
    ring: "#d97639",
    ringTrack: "rgba(217,118,57,0.16)",
    gradientFrom: "#ffe1c4",
    gradientTo: "#fff4e8",
    shadow: "#d97639",
    isDark: false,
  },
};

// Holding pattern palette — used by Phase-Fluid Logic when the calendar
// would advance into luteal but no temperature rise has confirmed
// ovulation. Distinct steady teal so the dashboard *visually* communicates
// "we're not advancing — we're holding for a signal." Calmer than the
// follicular green, cooler than luteal orange.
export const HOLDING_PALETTE: PhasePalette = {
  name: "Holding pattern",
  tagline: "Insulin and stress, while we wait.",
  background: "#eaf6f4",
  backgroundAlt: "#d8ece9",
  surface: "rgba(255,255,255,0.74)",
  surfaceMuted: "rgba(255,255,255,0.5)",
  glass: "rgba(255,255,255,0.55)",
  glassBorder: "rgba(28,124,118,0.20)",
  text: "#0f2f2c",
  textMuted: "#456c68",
  primary: "#1c8a7c",
  primarySoft: "rgba(28,138,124,0.16)",
  accent: "#5fb8ad",
  accentSoft: "rgba(95,184,173,0.22)",
  highlight: "#2ea597",
  ring: "#1c8a7c",
  ringTrack: "rgba(28,138,124,0.16)",
  gradientFrom: "#dcefec",
  gradientTo: "#f1faf8",
  shadow: "#1c8a7c",
  isDark: false,
};

const colors = {
  phases,
  // Default light palette (kept for legacy useColors compatibility — Lumen uses phase palettes everywhere)
  light: {
    text: phases.luteal.text,
    tint: phases.luteal.primary,
    background: phases.luteal.background,
    foreground: phases.luteal.text,
    card: phases.luteal.surface,
    cardForeground: phases.luteal.text,
    primary: phases.luteal.primary,
    primaryForeground: "#ffffff",
    secondary: phases.luteal.surfaceMuted,
    secondaryForeground: phases.luteal.text,
    muted: phases.luteal.surfaceMuted,
    mutedForeground: phases.luteal.textMuted,
    accent: phases.luteal.accent,
    accentForeground: phases.luteal.text,
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: phases.luteal.glassBorder,
    input: phases.luteal.glassBorder,
  },
  radius: 22,
};

export default colors;
