import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pnpmDir = join(here, "..", "..", "..", "node_modules", ".pnpm");

function findRoutesJs() {
  const entries = readdirSync(pnpmDir);
  for (const e of entries) {
    if (!e.startsWith("@remotion+studio-server@")) continue;
    const p = join(pnpmDir, e, "node_modules", "@remotion", "studio-server", "dist", "routes.js");
    try {
      statSync(p);
      return p;
    } catch {}
  }
  return null;
}

const PUBLIC_PATH = process.env.REMOTION_PUBLIC_PATH || "/lumen-trailer/";
const file = findRoutesJs();
if (!file) {
  console.error("[patch-public-path] routes.js not found; skipping");
  process.exit(0);
}
const src = readFileSync(file, "utf8");
const replaced = src.replace(/publicPath: '\/'(,)/g, `publicPath: '${PUBLIC_PATH}'$1`);
if (replaced === src) {
  console.log(`[patch-public-path] already patched or pattern not found: ${file}`);
} else {
  writeFileSync(file, replaced);
  console.log(`[patch-public-path] patched ${file} -> publicPath='${PUBLIC_PATH}'`);
}
