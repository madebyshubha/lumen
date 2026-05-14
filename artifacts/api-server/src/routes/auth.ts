import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  SignInWithAppleBody,
  SignInWithGoogleBody,
  SignInDevBody,
  UpdateProfileBody,
  type AuthError,
  type AuthSession,
  type UserProfile,
} from "@workspace/api-zod";

import {
  findOrCreateUser,
  serializeUser,
  signSessionToken,
  verifyAppleIdToken,
  verifyGoogleIdToken,
} from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function authError(code: AuthError["code"], message: string): AuthError {
  return { code, message };
}

router.post("/auth/apple", async (req, res): Promise<void> => {
  const parsed = SignInWithAppleBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json(authError("bad_request", parsed.error.issues[0]?.message ?? "Invalid body"));
    return;
  }

  let identity;
  try {
    identity = await verifyAppleIdToken(parsed.data.identityToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Apple verification failed";
    if (/not configured/i.test(message)) {
      req.log.error({ err }, "apple sign-in misconfigured");
      res.status(503).json(authError("provider_unconfigured", message));
      return;
    }
    req.log.warn({ err }, "apple identity token rejected");
    res.status(401).json(authError("unauthorized", message));
    return;
  }

  const user = await findOrCreateUser({
    provider: "apple",
    providerSub: identity.sub,
    email: identity.email,
    name: parsed.data.fullName ?? null,
  });
  const token = await signSessionToken(user);
  const session: AuthSession = { token, user: serializeUser(user) };
  res.json(session);
});

router.post("/auth/google", async (req, res): Promise<void> => {
  const parsed = SignInWithGoogleBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json(authError("bad_request", parsed.error.issues[0]?.message ?? "Invalid body"));
    return;
  }

  let identity;
  try {
    identity = await verifyGoogleIdToken(parsed.data.idToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google verification failed";
    if (/not configured/i.test(message)) {
      req.log.error({ err }, "google sign-in misconfigured");
      res.status(503).json(authError("provider_unconfigured", message));
      return;
    }
    req.log.warn({ err }, "google identity token rejected");
    res.status(401).json(authError("unauthorized", message));
    return;
  }

  const user = await findOrCreateUser({
    provider: "google",
    providerSub: identity.sub,
    email: identity.email,
    name: identity.name,
  });
  const token = await signSessionToken(user);
  const session: AuthSession = { token, user: serializeUser(user) };
  res.json(session);
});

router.post("/auth/dev", async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res
      .status(404)
      .json(authError("not_found", "Dev sign-in is disabled in production"));
    return;
  }
  const parsed = SignInDevBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json(authError("bad_request", parsed.error.issues[0]?.message ?? "Invalid body"));
    return;
  }
  const handle = parsed.data.handle.trim().toLowerCase();
  const user = await findOrCreateUser({
    provider: "dev",
    providerSub: handle,
    email: `${handle}@dev.lumen.local`,
    name: null,
  });
  const token = await signSessionToken(user);
  const session: AuthSession = { token, user: serializeUser(user) };
  res.json(session);
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const profile: UserProfile = serializeUser(user);
  res.json(profile);
});

router.post("/auth/signout", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  await db
    .update(usersTable)
    .set({ sessionVersion: sql`${usersTable.sessionVersion} + 1` })
    .where(eq(usersTable.id, user.id));
  res.status(204).send();
});

router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json(authError("bad_request", parsed.error.issues[0]?.message ?? "Invalid body"));
    return;
  }

  const user = req.user!;
  const patch: Partial<typeof usersTable.$inferInsert> = {};
  const data = parsed.data;
  if (data.name !== undefined) patch.name = data.name;
  if (data.diet !== undefined) patch.diet = data.diet;
  if (data.homeCountry !== undefined) patch.homeCountry = data.homeCountry;
  if (data.energy !== undefined) patch.energy = data.energy;
  if (data.lastPeriodIso !== undefined) patch.lastPeriodIso = data.lastPeriodIso;
  if (data.cycleLength !== undefined) patch.cycleLength = data.cycleLength;
  if (data.onboarded === true) patch.onboardedAt = new Date();

  if (Object.keys(patch).length === 0) {
    res.json(serializeUser(user));
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(patch)
    .where(eq(usersTable.id, user.id))
    .returning();

  const profile: UserProfile = serializeUser(updated ?? user);
  res.json(profile);
});

export default router;
