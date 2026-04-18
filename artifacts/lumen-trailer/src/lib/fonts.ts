import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const outfit = loadOutfit("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
});

export const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
});
