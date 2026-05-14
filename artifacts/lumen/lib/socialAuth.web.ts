// Web stub — native Apple / Google sign-in flows are not available in the
// Replit web preview. Use the dev sign-in fallback in onboarding instead.

export type AppleAuthResult = {
  identityToken: string;
  email: string | null;
  fullName: string | null;
};

export type GoogleAuthResult = {
  idToken: string;
};

export async function isAppleAvailable(): Promise<boolean> {
  return false;
}

export async function appleSignIn(): Promise<AppleAuthResult> {
  throw new Error("Sign in with Apple is not available in the web preview");
}

export function isGoogleAvailable(): boolean {
  return false;
}

export async function googleSignIn(): Promise<GoogleAuthResult> {
  throw new Error("Sign in with Google is not available in the web preview");
}
