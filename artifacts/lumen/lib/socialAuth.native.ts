import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

export type AppleAuthResult = {
  identityToken: string;
  email: string | null;
  fullName: string | null;
};

export type GoogleAuthResult = {
  idToken: string;
};

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

let googleConfigured = false;
function configureGoogle(): void {
  if (googleConfigured) return;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  // androidClientId is read implicitly from google-services.json in the
  // custom dev client build, so it doesn't need to be passed here.
  GoogleSignin.configure({
    iosClientId: iosClientId || undefined,
    webClientId: webClientId || undefined,
    scopes: ["openid", "email", "profile"],
  });
  googleConfigured = true;
}

export function isGoogleAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

export async function googleSignIn(): Promise<GoogleAuthResult> {
  configureGoogle();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try {
    const result = await GoogleSignin.signIn();
    // v16 returns { type: 'success', data: { idToken, ... } } | { type: 'cancelled' }
    if (result && (result as { type?: string }).type === "cancelled") {
      throw new Error("Google sign-in was cancelled");
    }
    const data = (result as { data?: { idToken?: string | null } }).data ?? null;
    const idToken = data?.idToken ?? (result as { idToken?: string | null }).idToken;
    if (!idToken) {
      throw new Error("Google did not return an ID token");
    }
    return { idToken };
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (
      code === statusCodes.SIGN_IN_CANCELLED ||
      code === statusCodes.IN_PROGRESS
    ) {
      throw new Error("Google sign-in was cancelled");
    }
    throw err;
  }
}
