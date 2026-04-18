// Lifestyle context — diet preferences, location, travel, and meal logging.
// Used by the task engine to generate PCOS-aware daily missions that adapt
// to where the user is, what they normally eat, and what they've eaten today.

export type Diet =
  | "vegetarian"
  | "vegan"
  | "eggetarian"
  | "non-vegetarian"
  | "pescatarian"
  | "jain";

export const DIET_LABEL: Record<Diet, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  "non-vegetarian": "Non-vegetarian",
  pescatarian: "Pescatarian",
  jain: "Jain",
};

export const DIET_OPTIONS: Diet[] = [
  "vegetarian",
  "vegan",
  "eggetarian",
  "pescatarian",
  "non-vegetarian",
  "jain",
];

// ---- Countries -----------------------------------------------------------

export type CountryCode =
  | "IN" | "US" | "GB" | "IT" | "FR" | "JP" | "TH" | "MX"
  | "CN" | "AE" | "ES" | "DE" | "AU" | "SG" | "BR" | "OTHER";

export type Country = { code: CountryCode; name: string };

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "IT", name: "Italy" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "TH", name: "Thailand" },
  { code: "MX", name: "Mexico" },
  { code: "CN", name: "China" },
  { code: "AE", name: "UAE" },
  { code: "ES", name: "Spain" },
  { code: "DE", name: "Germany" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "BR", name: "Brazil" },
  { code: "OTHER", name: "Somewhere else" },
];

export function countryName(code: CountryCode): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? "Somewhere";
}

// ---- Country meal guidance ----------------------------------------------
// Each country knows two go-to PCOS-friendly picks: one for plant-forward
// diets and one for diets that include fish or meat. We bucket "vegan" with
// "vegetarian/eggetarian/jain" for the veg pick (then nudge dairy off in
// the detail line), and pescatarian with non-vegetarian.

type DietBucket = "veg" | "fishMeat";
function bucketFor(diet: Diet): DietBucket {
  if (diet === "non-vegetarian" || diet === "pescatarian") return "fishMeat";
  return "veg";
}

type Pick = { title: string; detail: string };

const PICKS: Record<CountryCode, Record<DietBucket, Pick>> = {
  IN: {
    veg: {
      title: "Dal + sabzi + one roti",
      detail: "Skip white rice today. Add a spoon of ghee for satiety.",
    },
    fishMeat: {
      title: "Grilled fish curry + sabzi",
      detail: "Coconut-based gravy, half the rice you'd normally take.",
    },
  },
  US: {
    veg: {
      title: "Chickpea bowl with tahini and greens",
      detail: "Skip the bread basket — load up on the salad first.",
    },
    fishMeat: {
      title: "Grilled chicken salad, no croutons",
      detail: "Olive oil + lemon dressing instead of creamy ones.",
    },
  },
  GB: {
    veg: {
      title: "Lentil soup + roasted veg",
      detail: "Pass on the white roll — sourdough only if you must.",
    },
    fishMeat: {
      title: "Grilled salmon + greens",
      detail: "Chips can wait. Add mushy peas for fibre.",
    },
  },
  IT: {
    veg: {
      title: "Lentil pasta + olive oil + arugula",
      detail: "Lentil pasta has 3x the protein of regular. Skip the breadbasket.",
    },
    fishMeat: {
      title: "Grilled fish + roasted veg",
      detail: "Branzino or orata. Tiramisu is a once-a-trip thing.",
    },
  },
  FR: {
    veg: {
      title: "Ratatouille + chickpea side",
      detail: "A small wedge of cheese is fine — skip the baguette.",
    },
    fishMeat: {
      title: "Salade niçoise",
      detail: "Tuna, eggs, olives. Hold the potatoes if you can.",
    },
  },
  JP: {
    veg: {
      title: "Miso + edamame + brown rice",
      detail: "Tofu donburi is your friend. Skip tempura today.",
    },
    fishMeat: {
      title: "Sashimi + seaweed salad",
      detail: "Skip the tempura and sweet teriyaki sauces.",
    },
  },
  TH: {
    veg: {
      title: "Tofu pad see ew with extra veg",
      detail: "Ask for less sugar. Pad thai is a sugar bomb — pick som tam instead.",
    },
    fishMeat: {
      title: "Tom yum + grilled fish",
      detail: "Avoid pad thai and sweet curries today.",
    },
  },
  MX: {
    veg: {
      title: "Bean + avocado bowl",
      detail: "No tortilla chips on the table. Salsa verde is free.",
    },
    fishMeat: {
      title: "Grilled fish tacos on lettuce wraps",
      detail: "Or two corn tortillas — never four. Plenty of guac.",
    },
  },
  CN: {
    veg: {
      title: "Stir-fried tofu + bok choy",
      detail: "Skip fried rice and sweet sauces. Steamed dumplings only if needed.",
    },
    fishMeat: {
      title: "Steamed fish + greens",
      detail: "Avoid sweet & sour and General Tso. Brown rice if available.",
    },
  },
  AE: {
    veg: {
      title: "Hummus + tabouleh + baked falafel",
      detail: "Skip the deep-fried side. Pita in halves, not whole.",
    },
    fishMeat: {
      title: "Grilled chicken shawarma in lettuce",
      detail: "Or in one small wrap. Heavy garlic toum — yes.",
    },
  },
  ES: {
    veg: {
      title: "Gazpacho + tortilla española",
      detail: "Big salad first. Skip the bread.",
    },
    fishMeat: {
      title: "Grilled sardines or octopus + salad",
      detail: "Tapas are great — skip patatas bravas.",
    },
  },
  DE: {
    veg: {
      title: "Sauerkraut + lentil bowl + roasted veg",
      detail: "Fermented food helps PCOS gut. Skip the bread basket.",
    },
    fishMeat: {
      title: "Grilled trout + salad",
      detail: "Schnitzel another day. Sauerkraut on the side.",
    },
  },
  AU: {
    veg: {
      title: "Avocado + halloumi + roast veg bowl",
      detail: "Cafés do this well. Skip the smoothie bowl — sugar-loaded.",
    },
    fishMeat: {
      title: "Grilled barramundi + salad",
      detail: "Skip the chips. Lemon and chilli oil instead.",
    },
  },
  SG: {
    veg: {
      title: "Vegetarian thali or tofu laksa (light coconut)",
      detail: "Skip char kway teow today — fried + sweet sauce.",
    },
    fishMeat: {
      title: "Steamed fish + kailan",
      detail: "Hawker fish soup is also a great pick.",
    },
  },
  BR: {
    veg: {
      title: "Black beans + rice (small portion) + greens",
      detail: "Add farofa sparingly. Skip the pão de queijo.",
    },
    fishMeat: {
      title: "Grilled fish (peixe) + salada",
      detail: "Brazilian churrasco — pick lean cuts, skip bread.",
    },
  },
  OTHER: {
    veg: {
      title: "Half-veg, quarter-protein, quarter-carb plate",
      detail: "Lentils, tofu, paneer, eggs, beans — pick one for the protein quarter.",
    },
    fishMeat: {
      title: "Half-veg, quarter-protein, quarter-carb plate",
      detail: "Fish, chicken, eggs — palm-sized portion. Greens fill the rest.",
    },
  },
};

export function pickFor(country: CountryCode, diet: Diet): Pick {
  const guides = PICKS[country] ?? PICKS.OTHER;
  const pick = guides[bucketFor(diet)];
  // Vegan/Jain nudges: drop dairy/onion-garlic mentions where applicable.
  if (diet === "vegan") {
    return {
      title: pick.title.replace(/halloumi/i, "tofu").replace(/paneer/i, "tofu"),
      detail: pick.detail.replace(/ghee/i, "olive oil"),
    };
  }
  if (diet === "jain") {
    return {
      title: pick.title.replace(/onion|garlic/gi, "asafoetida"),
      detail: pick.detail + " (Jain-friendly: skip onion/garlic; root-veg only if you allow it.)",
    };
  }
  return pick;
}

// ---- Meals & insulin-friendliness scoring -------------------------------

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export type MealScore = "steady" | "mixed" | "spike";

export type Meal = {
  id: string;
  slot: MealSlot;
  text: string;
  loggedAt: string;
  score: MealScore;
};

const SPIKE_KEYWORDS = [
  "white rice", "white bread", "bread", "pasta", "pizza", "noodle",
  "soda", "coke", "pepsi", "juice", "sugar", "dessert", "cake",
  "ice cream", "fries", "chips", "donut", "doughnut", "croissant",
  "pastry", "cereal", "candy", "chocolate", "cookie", "muffin",
  "pancake", "waffle", "boba", "bubble tea", "frappuccino", "honey",
  "syrup", "jam", "bagel", "naan", "white roll",
];

const STEADY_KEYWORDS = [
  "salad", "egg", "lentil", "dal", "chickpea", "bean", "tofu", "tempeh",
  "paneer", "fish", "chicken", "turkey", "salmon", "tuna", "sardine",
  "quinoa", "oats", "brown rice", "broccoli", "spinach", "kale",
  "avocado", "almond", "walnut", "hummus", "yogurt", "yoghurt",
  "cottage cheese", "edamame", "greens", "olive oil", "nuts", "seed",
  "berries", "berry", "sabzi", "sauerkraut", "miso",
];

export function scoreMeal(text: string): MealScore {
  const lower = text.toLowerCase();
  let spike = 0;
  let steady = 0;
  for (const k of SPIKE_KEYWORDS) if (lower.includes(k)) spike++;
  for (const k of STEADY_KEYWORDS) if (lower.includes(k)) steady++;
  if (spike === 0 && steady === 0) return "mixed";
  if (spike >= 2 && steady === 0) return "spike";
  if (steady >= 2 && spike === 0) return "steady";
  if (spike > steady) return "spike";
  if (steady > spike) return "steady";
  return "mixed";
}

export const MEAL_SCORE_LABEL: Record<MealScore, string> = {
  steady: "Steady",
  mixed: "Mixed",
  spike: "Spike risk",
};

// ---- Daily context shape ------------------------------------------------

export type DailyContext = {
  location?: string;
  travelling: boolean;
  travelCountry?: CountryCode;
  meals: Meal[];
};

export const EMPTY_CONTEXT: DailyContext = {
  travelling: false,
  meals: [],
};
