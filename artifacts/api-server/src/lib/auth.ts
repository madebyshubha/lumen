import {
  createRemoteJWKSet,
  jwtVerify,
  SignJWT,
  type JWTPayload,
} from "jose";
import { eq, and } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

const GOOGLE_ISSUERS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

const SESSION_TTL_DAYS = 30;
const SESSION_ISSUER = "lumen-api";

function listFromEnv(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function getAppleAudiences(): string[] {
  return listFromEnv("APPLE_BUNDLE_ID");
}

export function getGoogleAudiences(): string[] {
  return [
    ...listFromEnv("GOOGLE_IOS_CLIENT_ID"),
    ...listFromEnv("GOOGLE_ANDROID_CLIENT_ID"),
    ...listFromEnv("GOOGLE_WEB_CLIENT_ID"),
  ];
}

function getSessionSecret(): Uint8Array {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is required (>=16 chars) to sign session tokens",
    );
  }
  return new TextEncoder().encode(secret);
}

export type AppleVerifiedIdentity = {
  sub: string;
  email: string | null;
  emailVerified: boolean;
};

export async function verifyAppleIdToken(
  identityToken: string,
): Promise<AppleVerifiedIdentity> {
  const audiences = getAppleAudiences();
  if (audiences.length === 0) {
    throw new Error(
      "APPLE_BUNDLE_ID is not configured; cannot verify Apple identity tokens",
    );
  }
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: audiences,
  });
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Apple identity token missing sub");
  }
  const email =
    typeof payload["email"] === "string" ? (payload["email"] as string) : null;
  const emailVerifiedRaw = payload["email_verified"];
  const emailVerified =
    emailVerifiedRaw === true || emailVerifiedRaw === "true";
  return { sub: payload.sub, email, emailVerified };
}

export type GoogleVerifiedIdentity = {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleVerifiedIdentity> {
  const audiences = getGoogleAudiences();
  if (audiences.length === 0) {
    throw new Error(
      "GOOGLE_IOS_CLIENT_ID/GOOGLE_ANDROID_CLIENT_ID/GOOGLE_WEB_CLIENT_ID are not configured; cannot verify Google ID tokens",
    );
  }
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: audiences,
  });
  if (!payload.iss || !GOOGLE_ISSUERS.has(payload.iss)) {
    throw new Error(`Unexpected Google issuer: ${String(payload.iss)}`);
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Google ID token missing sub");
  }
  const email =
    typeof payload["email"] === "string" ? (payload["email"] as string) : null;
  const emailVerified = payload["email_verified"] === true;
  const name =
    typeof payload["name"] === "string" ? (payload["name"] as string) : null;
  return { sub: payload.sub, email, emailVerified, name };
}

export type SessionPayload = JWTPayload & {
  sub: string;
  sv: number;
};

export async function signSessionToken(
  user: Pick<User, "id" | "sessionVersion">,
): Promise<string> {
  return await new SignJWT({ sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_ISSUER)
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSessionSecret(), {
    issuer: SESSION_ISSUER,
    audience: SESSION_ISSUER,
  });
  if (typeof payload.sub !== "string") {
    throw new Error("Session token missing sub");
  }
  if (typeof payload["sv"] !== "number") {
    throw new Error("Session token missing sv");
  }
  return payload as SessionPayload;
}

export async function findOrCreateUser(input: {
  provider: "apple" | "google" | "dev";
  providerSub: string;
  email?: string | null;
  name?: string | null;
}): Promise<User> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.provider, input.provider),
        eq(usersTable.providerSub, input.providerSub),
      ),
    )
    .limit(1);

  if (existing) {
    // Backfill email/name once if Apple/Google only delivered them on first
    // sign-in (Apple, in particular, only returns the user's full name on the
    // very first authorisation).
    const patch: Partial<typeof usersTable.$inferInsert> = {};
    if (!existing.email && input.email) patch.email = input.email;
    if (!existing.name && input.name) patch.name = input.name;
    if (Object.keys(patch).length === 0) return existing;
    const [updated] = await db
      .update(usersTable)
      .set(patch)
      .where(eq(usersTable.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      provider: input.provider,
      providerSub: input.providerSub,
      email: input.email ?? null,
      name: input.name ?? null,
    })
    .returning();
  if (!created) {
    throw new Error("Failed to create user");
  }
  return created;
}

import type { UserProfile } from "@workspace/api-zod";

export function serializeUser(user: User): UserProfile {
  const provider =
    user.provider === "apple" || user.provider === "google"
      ? user.provider
      : "dev";
  return {
    id: user.id,
    provider,
    email: user.email ?? null,
    name: user.name ?? null,
    diet: user.diet ?? null,
    homeCountry: user.homeCountry ?? null,
    energy: user.energy ?? null,
    lastPeriodIso: user.lastPeriodIso ?? null,
    cycleLength: user.cycleLength ?? null,
    onboardedAt: user.onboardedAt ?? null,
  };
}
