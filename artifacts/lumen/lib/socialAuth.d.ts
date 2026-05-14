// Platform-resolved module — Metro picks socialAuth.native.ts on iOS/Android
// and socialAuth.web.ts on web. This .d.ts declares the shared contract so
// TypeScript can resolve `import "@/lib/socialAuth"` from both contexts.

export type AppleAuthResult = {
  identityToken: string;
  email: string | null;
  fullName: string | null;
};

export type GoogleAuthResult = {
  idToken: string;
};

export declare function isAppleAvailable(): Promise<boolean>;
export declare function appleSignIn(): Promise<AppleAuthResult>;

export declare function isGoogleAvailable(): boolean;
export declare function googleSignIn(): Promise<GoogleAuthResult>;
