import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

export type ExpoQrState =
  | { kind: "loading" }
  | { kind: "ready"; src: string; expoUrl: string }
  | { kind: "missing" }
  | { kind: "error" };

export function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function useExpoQr(
  width = 320,
  dark = "#3b1c0a",
  light = "#ffffff",
): ExpoQrState {
  const [state, setState] = useState<ExpoQrState>({ kind: "loading" });
  const domain = import.meta.env.VITE_REPLIT_EXPO_DEV_DOMAIN as
    | string
    | undefined;
  const expoUrl = useMemo(
    () => (domain ? `exps://${domain}` : null),
    [domain],
  );

  useEffect(() => {
    if (!expoUrl) {
      setState({ kind: "missing" });
      return;
    }
    QRCode.toDataURL(expoUrl, {
      width,
      margin: 1,
      color: { dark, light },
    })
      .then((src) => setState({ kind: "ready", src, expoUrl }))
      .catch((err) => {
        console.error("QR generation failed", err);
        setState({ kind: "error" });
      });
  }, [expoUrl, width, dark, light]);

  return state;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("copy failed", err);
    return false;
  }
}
