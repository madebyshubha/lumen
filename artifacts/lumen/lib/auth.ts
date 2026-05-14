import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  setBaseUrl,
  setAuthTokenGetter,
  signInWithApple as apiSignInWithApple,
  signInWithGoogle as apiSignInWithGoogle,
  signInDev as apiSignInDev,
  signOut as apiSignOut,
  updateProfile as apiUpdateProfile,
  getMe as apiGetMe,
  type AuthSession,
  type UserProfile,
  type ProfileUpdateInput,
} from "@workspace/api-client-react";

import {
  appleSignIn as nativeAppleSignIn,
  googleSignIn as nativeGoogleSignIn,
  isAppleAvailable as nativeIsAppleAvailable,
  isGoogleAvailable as nativeIsGoogleAvailable,
} from "@/lib/socialAuth";

const TOKEN_KEY = "lumen.session.token";

let cachedToken: string | null = null;
let bootstrapped = false;

function resolveBaseUrl(): string | null {
  const domain =
    process.env.EXPO_PUBLIC_API_DOMAIN ?? process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return null;
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

async function readPersistedToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function writePersistedToken(token: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (token == null) {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
    } catch {
      // ignore
    }
    return;
  }
  try {
    if (token == null) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
}

/**
 * One-shot setup — wires the generated API client to talk to the remote
 * server, registers a token-getter that reads from SecureStore (or
 * AsyncStorage on web), and returns the persisted session token, if any.
 *
 * Safe to call multiple times.
 */
export async function bootstrapAuth(): Promise<string | null> {
  if (!bootstrapped) {
    const baseUrl = resolveBaseUrl();
    if (baseUrl) setBaseUrl(baseUrl);
    setAuthTokenGetter(() => cachedToken);
    bootstrapped = true;
  }
  cachedToken = await readPersistedToken();
  return cachedToken;
}

export function getCachedToken(): string | null {
  return cachedToken;
}

async function applySession(session: AuthSession): Promise<UserProfile> {
  cachedToken = session.token;
  await writePersistedToken(session.token);
  return session.user;
}

export async function clearSession(): Promise<void> {
  cachedToken = null;
  await writePersistedToken(null);
}

export async function isAppleAvailable(): Promise<boolean> {
  return nativeIsAppleAvailable();
}

export function isGoogleAvailable(): boolean {
  return nativeIsGoogleAvailable();
}

export async function signInWithApple(): Promise<UserProfile> {
  const credential = await nativeAppleSignIn();
  const session = await apiSignInWithApple({
    identityToken: credential.identityToken,
    email: credential.email,
    fullName: credential.fullName,
  });
  return applySession(session);
}

export async function signInWithGoogle(): Promise<UserProfile> {
  const credential = await nativeGoogleSignIn();
  const session = await apiSignInWithGoogle({ idToken: credential.idToken });
  return applySession(session);
}

export async function signInDev(handle: string): Promise<UserProfile> {
  const session = await apiSignInDev({ handle });
  return applySession(session);
}

export async function fetchMe(): Promise<UserProfile | null> {
  if (!cachedToken) return null;
  try {
    return await apiGetMe();
  } catch (err) {
    // Token rejected — wipe it so the app drops back to the login screen.
    if ((err as { status?: number } | null)?.status === 401) {
      await clearSession();
    }
    return null;
  }
}

export async function signOutServer(): Promise<void> {
  if (!cachedToken) return;
  try {
    await apiSignOut();
  } catch {
    // Even if the server rejects, locally we still clear.
  }
  await clearSession();
}

export async function updateProfile(
  patch: ProfileUpdateInput,
): Promise<UserProfile> {
  return await apiUpdateProfile(patch);
}
