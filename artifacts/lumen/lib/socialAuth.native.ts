import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as AppleAuthentication from "expo-apple-authentication";

export type AppleAuthResult = {
  identityToken: string;
  email: string | null;
  fullName: string | null;
};

export type GoogleAuthResult = {
  idToken: string;
};

// ---------------------------------------------------------------------------
// Expo Go guard
// @react-native-google-signin/google-signin calls TurboModuleRegistry.
// getEnforcing('RNGoogleSignin') at the top level of its JS file. In Expo Go
// that native module isn't in the binary, so getEnforcing throws a fatal
// error that bypasses regular try-catch and crashes the whole app.
// We detect Expo Go before require() is ever called and return null instead.
// ---------------------------------------------------------------------------
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type GoogleSigninModule = {
  GoogleSignin: {
    configure(opts: {
      iosClientId?: string;
      webClientId?: string;
      scopes?: string[];
    }): void;
    hasPlayServices(opts: { showPlayServicesUpdateDialog: boolean }): Promise<void>;
    signIn(): Promise<unknown>;
  };
  statusCodes: { SIGN_IN_CANCELLED: string; IN_PROGRESS: string };
};

let _google: GoogleSigninModule | null | "unavailable" = null;

function loadGoogle(): GoogleSigninModule | null {
  if (IS_EXPO_GO) return null;
  if (_google === "unavailable") return null;
  if (_google !== null) return _google;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _google = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
    return _google;
  } catch {
    _google = "unavailable";
    return null;
  }
}

// ---------------------------------------------------------------------------
// Apple Sign-In
// ---------------------------------------------------------------------------

export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function appleSignIn(): Promise<AppleAuthResult> {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is only available on iOS");
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token");
  }
  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(" ")
        .trim() || null
    : null;
  return {
    identityToken: credential.identityToken,
    email: credential.email ?? null,
    fullName,
  };
}

// ---------------------------------------------------------------------------
// Google Sign-In
// ---------------------------------------------------------------------------

let googleConfigured = false;
function configureGoogle(mod: GoogleSigninModule): void {
  if (googleConfigured) return;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  mod.GoogleSignin.configure({
    iosClientId: iosClientId || undefined,
    webClientId: webClientId || undefined,
    scopes: ["openid", "email", "profile"],
  });
  googleConfigured = true;
}

export function isGoogleAvailable(): boolean {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  if (IS_EXPO_GO) return false;
  return loadGoogle() !== null;
}

export async function googleSignIn(): Promise<GoogleAuthResult> {
  const mod = loadGoogle();
  if (!mod) {
    throw new Error(
      IS_EXPO_GO
        ? "Google Sign-In is not available in Expo Go — use the dev sign-in fallback."
        : "Google Sign-In is not available on this build.",
    );
  }
  configureGoogle(mod);
  await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try {
    const result = await mod.GoogleSignin.signIn();
    if (result && (result as { type?: string }).type === "cancelled") {
      throw new Error("Google sign-in was cancelled");
    }
    const data = (result as { data?: { idToken?: string | null } }).data ?? null;
    const idToken =
      data?.idToken ?? (result as { idToken?: string | null }).idToken;
    if (!idToken) {
      throw new Error("Google did not return an ID token");
    }
    return { idToken };
  } catch (err) {
    const mod2 = loadGoogle();
    const code = (err as { code?: string } | null)?.code;
    if (
      mod2 &&
      (code === mod2.statusCodes.SIGN_IN_CANCELLED ||
        code === mod2.statusCodes.IN_PROGRESS)
    ) {
      throw new Error("Google sign-in was cancelled");
    }
    throw err;
  }
}
