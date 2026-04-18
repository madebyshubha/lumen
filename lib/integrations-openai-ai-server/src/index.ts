export { openai } from "./client";

// Lightweight rate-limit detection so callers don't have to depend on the
// full batch utilities just to fall back gracefully on 429s.
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; code?: string; message?: string };
  if (e.status === 429) return true;
  if (typeof e.code === "string" && e.code.toLowerCase().includes("rate")) {
    return true;
  }
  return typeof e.message === "string" && /rate.?limit/i.test(e.message);
}
