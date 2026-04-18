// PCOS symptom protocols. Each entry is a chronic symptom the user can
// flag as a "concern" so today's mission includes the highest-leverage
// daily actions for it, alongside a deeper screen explaining the
// likely root cause, what to add, what to remove, what to track, and
// when to escalate to a doctor.
//
// These are educational only — not a substitute for medical advice.

import type { ConcernKey } from "@/lib/lifestyle";
import type { Task } from "@/lib/tasks";

export type ProtocolStep = { title: string; detail: string };

export type Protocol = {
  key: ConcernKey;
  title: string; // user-facing label
  oneLiner: string; // shown in the symptom list
  rootCause: string; // 2–3 lines, plain language
  travelNote?: string; // shown if user is travelling — why it can flare
  addToday: ProtocolStep[]; // 3–4 things to do today
  removeToday: ProtocolStep[]; // 3 things to avoid today
  weekly: ProtocolStep[]; // 2 weekly habits that compound
  supplements: ProtocolStep[]; // 1–3 supplements to consider
  whenToSeeDoctor: string; // one short line
  // The 1–2 highest-leverage steps from `addToday` that should be injected
  // into today's mission as critical tasks. Indexes into addToday.
  todayTaskIndexes: number[];
};

export const PROTOCOLS: Record<ConcernKey, Protocol> = {
  acne: {
    key: "acne",
    title: "Acne and inflammation",
    oneLiner: "Cystic, jawline, or back acne that won't quit.",
    rootCause:
      "PCOS acne is androgen-driven, not hygiene-driven. High insulin tells your ovaries to make more testosterone, which tells your skin glands to make thick oil and clog. Inflammation from poor sleep, gut imbalance, and dairy turns clogs into cysts.",
    travelNote:
      "Travel flares acne because of: airport sugar, dehydration, broken sleep, AC dryness pulling more oil, and cortisol from rushing. A month of travel is a month of low-grade androgen surge — the skin is the messenger.",
    addToday: [
      {
        title: "Walk for 10 minutes after every meal",
        detail: "Lowers insulin spikes that drive androgens. The single biggest acne lever.",
      },
      {
        title: "Two cups of leafy greens at one meal",
        detail: "Spinach, kale, arugula. Liver clears excess hormones — it needs the cofactors.",
      },
      {
        title: "Three litres of water today",
        detail: "Dilutes androgens and supports lymph drainage in the skin.",
      },
      {
        title: "Sleep window starts at 10:30 pm",
        detail: "Skin repairs in deep sleep. Late nights raise cortisol, which feeds acne.",
      },
    ],
    removeToday: [
      { title: "Skip dairy for the day", detail: "Whey and casein push IGF-1 — the strongest dietary acne trigger." },
      { title: "No added sugar", detail: "Including hidden sugar in sauces, lattes, granola, juices." },
      { title: "Don't pick or squeeze", detail: "Adds 4–6 weeks to a cyst's life and risks pigmentation." },
    ],
    weekly: [
      { title: "Strength training 2–3x", detail: "Lean muscle is the fastest way to lower fasting insulin." },
      { title: "One fermented food daily", detail: "Sauerkraut, kimchi, kefir (if you tolerate dairy), yogurt. Gut → skin." },
    ],
    supplements: [
      { title: "Inositol 4g/day (40:1 myo:d-chiro)", detail: "Best-studied PCOS supplement; lowers insulin and androgens in 8–12 weeks." },
      { title: "Zinc 30mg with food", detail: "Gentle DHT modulator; 8-week trials show acne reduction." },
      { title: "Omega-3 1–2g/day", detail: "Lowers skin inflammation. Look for EPA-dominant fish oil." },
    ],
    whenToSeeDoctor:
      "If acne is cystic, scarring, or unchanged after 12 weeks of consistent diet + sleep work — see a dermatologist or endocrinologist. Spironolactone and combined OCPs are evidence-based options to discuss.",
    todayTaskIndexes: [0, 1],
  },

  "hair-loss": {
    key: "hair-loss",
    title: "Scalp hair thinning",
    oneLiner: "Widening parting or more hair in the brush.",
    rootCause:
      "Same androgen story as acne — DHT shrinks hair follicles on the scalp (while sometimes thickening them on the face). Iron and ferritin deficiency, common in women, multiplies the problem.",
    travelNote: "Stress and disrupted sleep on the road further raise cortisol and DHT.",
    addToday: [
      { title: "Iron-rich meal at lunch", detail: "Lentils + vitamin C, or red meat. Pair with citrus for absorption." },
      { title: "Scalp massage 3 minutes tonight", detail: "Improves follicle blood flow; small but real effect." },
      { title: "Protein at every meal", detail: "Hair is keratin. Underfueled bodies sacrifice hair first." },
    ],
    removeToday: [
      { title: "No tight ponytail today", detail: "Traction at the hairline becomes permanent." },
      { title: "Skip the hot tools", detail: "Brittle PCOS hair breaks before it falls — same look, different cause." },
      { title: "No crash dieting", detail: "Under-eating tells the body to shed hair within 8 weeks." },
    ],
    weekly: [
      { title: "Strength train 2x", detail: "Same insulin lever — lower DHT means happier follicles." },
      { title: "Get ferritin tested", detail: "Aim for ferritin > 70 ng/mL — well above 'normal'. Many doctors miss this." },
    ],
    supplements: [
      { title: "Inositol 4g/day", detail: "Same PCOS root-lever as for acne." },
      { title: "Iron only if low", detail: "Test first; don't supplement blind. Bisglycinate is gentlest." },
    ],
    whenToSeeDoctor:
      "If thinning is rapid (handfuls), patchy, or you have a family history of PCOS-pattern loss, ask for a full thyroid + ferritin + DHEA-S panel and a dermatology referral.",
    todayTaskIndexes: [0, 2],
  },

  hirsutism: {
    key: "hirsutism",
    title: "Facial or body hair",
    oneLiner: "Dark hair on chin, jaw, chest, or stomach.",
    rootCause:
      "Hair follicles in these areas are extra sensitive to androgens. The follicles you have are the ones you have; lowering insulin and androgens slows new growth and softens existing.",
    addToday: [
      { title: "Walk after meals — every meal", detail: "Insulin → androgen pathway, same as acne." },
      { title: "Spearmint tea, two cups", detail: "Two RCTs show lower free testosterone after 30 days of 2 cups/day." },
    ],
    removeToday: [
      { title: "Skip the sugar drink", detail: "One spike resets the day's progress." },
      { title: "No tweezing today (if waxing tomorrow)", detail: "Mixed methods irritate; pick one." },
    ],
    weekly: [
      { title: "Strength train 2–3x", detail: "Lower fasting insulin = slower regrowth." },
      { title: "Consistent sleep window", detail: "Cortisol rhythm matters as much as hours." },
    ],
    supplements: [
      { title: "Inositol 4g/day", detail: "PCOS gold-standard." },
      { title: "Spearmint tea daily", detail: "Cheap, well-studied, no side effects." },
    ],
    whenToSeeDoctor:
      "If hair growth is rapid, voice deepens, or you also have very irregular cycles — ask for a testosterone, DHEA-S, and 17-OHP panel.",
    todayTaskIndexes: [0, 1],
  },

  "irregular-cycle": {
    key: "irregular-cycle",
    title: "Irregular or missing periods",
    oneLiner: "Cycles longer than 35 days, or skipped months.",
    rootCause:
      "Anovulation is the PCOS hallmark — the follicle stalls and the cycle never resets. Insulin, stress, under-eating, and over-exercising are the four levers that push it.",
    addToday: [
      { title: "Eat a real breakfast within 90 minutes of waking", detail: "Skipping breakfast spikes cortisol and worsens anovulation." },
      { title: "30g protein at breakfast", detail: "Eggs + Greek yogurt, or tofu scramble + seeds. Stabilises the day." },
      { title: "Walk after every meal", detail: "Insulin lever again — works on cycle, acne, and hair together." },
    ],
    removeToday: [
      { title: "No fasting longer than 12 hours", detail: "Long fasts worsen anovulation in PCOS women, despite the hype." },
      { title: "Skip HIIT today", detail: "Replace with strength + walking — your nervous system needs the break." },
      { title: "Cap caffeine at 1 cup", detail: "Cortisol amplifier when cycles are already off." },
    ],
    weekly: [
      { title: "Strength train 2–3x", detail: "Most evidence-backed lever for cycle regularity." },
      { title: "Track basal body temp on waking", detail: "Confirms whether you're ovulating; data > guessing." },
    ],
    supplements: [
      { title: "Inositol 4g/day", detail: "Restores ovulation in 60–70% of PCOS women within 3 months." },
      { title: "Vitamin D 2000–4000 IU if deficient", detail: "Vitamin D deficiency is a PCOS amplifier; test first." },
    ],
    whenToSeeDoctor:
      "If you've skipped 3+ months in a row, or you're trying to conceive — see a gynecologist. Letrozole is the first-line ovulation induction.",
    todayTaskIndexes: [0, 1],
  },

  "weight-belly": {
    key: "weight-belly",
    title: "Belly weight that won't shift",
    oneLiner: "Stubborn weight around the middle even with effort.",
    rootCause:
      "Visceral fat in PCOS is insulin-driven, not calorie-driven. The body stores fat centrally because that's where insulin tells it to.",
    addToday: [
      { title: "30g protein at every meal", detail: "Satiety, muscle, and lower insulin in one move." },
      { title: "Walk for 10 min after every meal", detail: "More effective for belly fat than one big workout." },
      { title: "Strength training day", detail: "Muscle is the metabolic organ that fixes this." },
    ],
    removeToday: [
      { title: "No liquid calories", detail: "Juices, sweet coffee, alcohol — these go straight to belly." },
      { title: "Skip 'light' cardio chasing weight loss", detail: "It raises hunger without the muscle benefit." },
      { title: "No late-night eating", detail: "Insulin sensitivity drops at night for PCOS women specifically." },
    ],
    weekly: [
      { title: "Strength train 3x", detail: "Non-negotiable lever." },
      { title: "Track waist, not weight", detail: "Belly is the right metric here, not the scale." },
    ],
    supplements: [
      { title: "Inositol 4g/day", detail: "Improves body composition independent of weight." },
      { title: "Berberine 500mg with meals (3x)", detail: "As effective as metformin in some trials. Check with your doctor first." },
    ],
    whenToSeeDoctor:
      "If you've been consistent for 6 months without change, ask for a fasting insulin and HOMA-IR test. Metformin or GLP-1 agonists may be appropriate.",
    todayTaskIndexes: [0, 1],
  },

  fatigue: {
    key: "fatigue",
    title: "Wired-but-tired fatigue",
    oneLiner: "Tired all day, alert at night, hard to recover.",
    rootCause:
      "PCOS fatigue is rarely just sleep — it's blood sugar swings, low ferritin, low B12, sluggish thyroid, and dysregulated cortisol stacked together.",
    travelNote: "Time zones and travel meals destabilise blood sugar and circadian rhythm — both root causes.",
    addToday: [
      { title: "Get 10 minutes of morning sunlight", detail: "Resets cortisol curve; the cheapest energy lever." },
      { title: "Eat protein within 90 minutes of waking", detail: "Prevents the 11 am crash." },
      { title: "Walk after lunch", detail: "Blunts the 3 pm slump." },
    ],
    removeToday: [
      { title: "Coffee after noon", detail: "Half-life is 6 hours; afternoon coffee = wired night." },
      { title: "Doomscrolling in bed", detail: "Blue light and stress hits delay deep sleep — when you actually recover." },
      { title: "Skip the sweet snack", detail: "The crash is the fatigue you're trying to escape." },
    ],
    weekly: [
      { title: "Get a thyroid + ferritin + B12 panel", detail: "PCOS women are deficient in these at 2–3x the rate." },
      { title: "Two strength sessions", detail: "Counterintuitively, lifting fixes fatigue better than rest." },
    ],
    supplements: [
      { title: "Magnesium glycinate 200–400mg at night", detail: "Sleep depth and recovery." },
      { title: "B-complex with active folate", detail: "If your panel shows borderline B12 or folate." },
    ],
    whenToSeeDoctor:
      "If you've been exhausted for 3+ months despite sleep and diet work — get a full thyroid (TSH, free T4, free T3, antibodies), iron studies, and B12.",
    todayTaskIndexes: [0, 1],
  },

  cravings: {
    key: "cravings",
    title: "Sugar cravings",
    oneLiner: "Afternoon sugar pull you can't outrun.",
    rootCause:
      "Cravings are a glucose-dip response, not a willpower problem. PCOS women have steeper post-meal dips, which trigger sweet-seeking 2–3 hours later.",
    addToday: [
      { title: "Add fat + protein to every carb", detail: "Apple + almond butter, not apple alone. Flattens the dip." },
      { title: "Pre-empt the 4 pm crash", detail: "Eat a protein snack at 3 pm before the craving arrives." },
      { title: "Walk after meals", detail: "Reduces the dip itself, the upstream cause of the craving." },
    ],
    removeToday: [
      { title: "No 'naked' carbs", detail: "No bread alone, no fruit alone, no rice alone — always pair." },
      { title: "Sweet drinks off the table", detail: "Liquid sugar is the worst offender." },
      { title: "No late-night sugar", detail: "Wrecks sleep and starts tomorrow's craving." },
    ],
    weekly: [
      { title: "Strength train", detail: "Muscle absorbs glucose without insulin. Less insulin = fewer dips." },
      { title: "Consistent meal timing", detail: "Same windows daily trains the system." },
    ],
    supplements: [
      { title: "Inositol 4g/day", detail: "Smooths glucose curves over 8–12 weeks." },
      { title: "Chromium 200mcg", detail: "Modest but real effect on sweet cravings." },
    ],
    whenToSeeDoctor:
      "If cravings are extreme and weight is climbing, ask for fasting glucose, fasting insulin, and HbA1c.",
    todayTaskIndexes: [0, 2],
  },

  insomnia: {
    key: "insomnia",
    title: "Trouble sleeping",
    oneLiner: "Hard to fall asleep, or waking at 3 am.",
    rootCause:
      "PCOS doubles sleep apnea risk. 3 am wakings are usually a cortisol-glucose dip. Falling-asleep trouble is usually a too-late cortisol curve.",
    addToday: [
      { title: "Morning sunlight, 10 minutes", detail: "Sets melatonin onset 14 hours later — your sleep starts at sunrise." },
      { title: "Last meal 3 hours before bed", detail: "Late eating raises insulin and disrupts deep sleep." },
      { title: "Magnesium glycinate at 9 pm", detail: "200–400mg. Slows the nervous system without grogginess." },
    ],
    removeToday: [
      { title: "No screens after 10 pm", detail: "Or use red mode; blue light delays melatonin." },
      { title: "No alcohol", detail: "Wrecks deep sleep even if it knocks you out." },
      { title: "No coffee after noon", detail: "Half-life is real even if you 'sleep through it'." },
    ],
    weekly: [
      { title: "Same sleep window every day", detail: "Including weekends. Drift kills the rhythm." },
      { title: "Get a sleep apnea screen if you snore", detail: "PCOS + snoring = high probability of apnea." },
    ],
    supplements: [
      { title: "Magnesium glycinate 200–400mg", detail: "Most evidence-backed for PCOS sleep." },
      { title: "L-theanine 200mg if anxious", detail: "Calms without sedation." },
    ],
    whenToSeeDoctor:
      "If you snore loudly, wake unrefreshed, or partner reports breathing pauses — get a sleep study. Untreated apnea worsens every other PCOS marker.",
    todayTaskIndexes: [0, 2],
  },

  anxiety: {
    key: "anxiety",
    title: "Anxiety and mood swings",
    oneLiner: "Edgy, low, or weepy in the second half of the cycle.",
    rootCause:
      "PCOS women have 2–3x the rate of anxiety and depression. Neurosteroid swings (allopregnanolone), inflammation, and blood sugar dips all contribute.",
    addToday: [
      { title: "Box breathing, 2 minutes, 3 times today", detail: "4-in, 4-hold, 4-out, 4-hold. Drops cortisol fast." },
      { title: "20-minute walk outside", detail: "Movement + nature beats most anxiolytics in trials." },
      { title: "Protein + fat at every meal", detail: "Glucose dips amplify anxiety; this is upstream." },
    ],
    removeToday: [
      { title: "Cap caffeine at 1 cup", detail: "Caffeine is a known anxiogenic in PCOS women specifically." },
      { title: "No alcohol", detail: "Rebound anxiety hits 4–8 hours later." },
      { title: "No news doomscroll today", detail: "The amygdala doesn't know it's not happening to you." },
    ],
    weekly: [
      { title: "Strength train 2–3x", detail: "Most reliable mood lift in trials, on par with SSRIs for mild-moderate." },
      { title: "Therapy or peer support", detail: "Hormonal support without psychological support is half a treatment." },
    ],
    supplements: [
      { title: "Magnesium glycinate 200–400mg", detail: "Anxiety, sleep, and PCOS in one." },
      { title: "Omega-3 1–2g/day", detail: "Mood + skin + cardiovascular — PCOS triple play." },
    ],
    whenToSeeDoctor:
      "If anxiety or low mood lasts 2+ weeks, interferes with work or relationships, or includes thoughts of self-harm — please reach out for professional support today.",
    todayTaskIndexes: [0, 1],
  },

  "dark-patches": {
    key: "dark-patches",
    title: "Dark velvety patches (acanthosis nigricans)",
    oneLiner: "Darkening on the neck, armpits, or knuckles.",
    rootCause:
      "These patches are a visible insulin resistance signal — the skin responding to chronically high insulin. They fade as insulin drops.",
    addToday: [
      { title: "Walk after every meal", detail: "Most direct insulin lever." },
      { title: "30g protein at every meal", detail: "Lower carb load = lower insulin = patches fade over months." },
    ],
    removeToday: [
      { title: "No sugary drinks", detail: "These keep insulin chronically elevated." },
      { title: "Don't scrub the patches", detail: "Won't fade them — the cause is internal." },
    ],
    weekly: [
      { title: "Strength train 3x", detail: "Most powerful insulin sensitiser available." },
      { title: "Track waist", detail: "Belly and patches respond together." },
    ],
    supplements: [
      { title: "Inositol 4g/day", detail: "Direct insulin sensitivity work." },
      { title: "Berberine 500mg with meals (3x)", detail: "Discuss with your doctor; very effective for insulin resistance." },
    ],
    whenToSeeDoctor:
      "Get fasting insulin, HbA1c, and lipids tested. Acanthosis is a clinical sign — your doctor should not dismiss it as cosmetic.",
    todayTaskIndexes: [0, 1],
  },
};

export const CONCERN_LIST: ConcernKey[] = [
  "acne",
  "hair-loss",
  "hirsutism",
  "irregular-cycle",
  "weight-belly",
  "fatigue",
  "cravings",
  "insomnia",
  "anxiety",
  "dark-patches",
];

export function protocolFor(key: ConcernKey): Protocol {
  return PROTOCOLS[key];
}

export function concernLabel(key: ConcernKey): string {
  return PROTOCOLS[key].title;
}

// Build the today-mission tasks for an active concern. Capped at the
// concern's `todayTaskIndexes` so the mission doesn't get overwhelmed.
export function tasksForConcern(key: ConcernKey): Task[] {
  const p = PROTOCOLS[key];
  return p.todayTaskIndexes.map((i, idx) => {
    const step = p.addToday[i];
    return {
      id: `concern-${key}-${idx}`,
      title: step.title,
      detail: step.detail,
      why: p.rootCause,
      kind: "movement",
      priority: "critical",
      context: `Care · ${p.title}`,
    } satisfies Task;
  });
}
