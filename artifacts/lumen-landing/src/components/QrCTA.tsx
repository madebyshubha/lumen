import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Smartphone, Copy, Check, ExternalLink, Download } from "lucide-react";

type QrState =
  | { kind: "loading" }
  | { kind: "ready"; src: string; expoUrl: string }
  | { kind: "missing" }
  | { kind: "error" };

function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function QrCTA() {
  const [state, setState] = useState<QrState>({ kind: "loading" });
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const domain = import.meta.env.VITE_REPLIT_EXPO_DEV_DOMAIN as
    | string
    | undefined;
  const expoUrl = useMemo(
    () => (domain ? `exp://${domain}` : null),
    [domain],
  );

  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  useEffect(() => {
    if (!expoUrl) {
      setState({ kind: "missing" });
      return;
    }
    QRCode.toDataURL(expoUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#3b1c0a", light: "#ffffff" },
    })
      .then((src) => setState({ kind: "ready", src, expoUrl }))
      .catch((err) => {
        console.error("QR generation failed", err);
        setState({ kind: "error" });
      });
  }, [expoUrl]);

  const handleCopy = async () => {
    if (state.kind !== "ready") return;
    try {
      await navigator.clipboard.writeText(state.expoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("copy failed", err);
    }
  };

  return (
    <section
      id="try-it"
      className="py-32 bg-[#fff3e9] relative overflow-hidden"
    >
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3b1c0a] mb-4">
            Ready to feel seen?
          </h2>
          <p className="text-lg text-[#8c5a3a] max-w-2xl mx-auto">
            Open Lumen on your phone in under a minute. No sign-up wall, no
            quiz to escape.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Block 1: Try the live preview (QR + tap-to-open + copy link) */}
          <div className="glass-card rounded-[2.5rem] p-8 md:p-10 bg-white/50 border border-white/60 flex flex-col">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-medium text-[#1c8a7c] mb-3">
              <Smartphone className="w-4 h-4" />
              Try the live preview
            </div>
            <h3 className="text-2xl font-display font-medium text-[#3b1c0a] mb-3">
              Open Lumen in Expo Go
            </h3>
            <p className="text-sm text-[#8c5a3a] mb-6 leading-relaxed">
              Install Expo Go on your phone, then{" "}
              {isMobile
                ? "tap the button below to open Lumen instantly."
                : "scan this code with your camera. Lumen opens in seconds."}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-full max-w-[220px]">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="bg-white p-5 rounded-3xl shadow-lg border border-white"
                >
                  {state.kind === "ready" && (
                    <img
                      src={state.src}
                      alt="Scan with Expo Go to open Lumen"
                      className="w-full h-auto rounded-xl"
                    />
                  )}
                  {state.kind === "loading" && (
                    <div className="w-full aspect-square bg-[#fff8e7] rounded-xl flex items-center justify-center text-[#8a6f33] text-sm">
                      Preparing your code...
                    </div>
                  )}
                  {(state.kind === "missing" || state.kind === "error") && (
                    <div className="w-full aspect-square bg-[#fff8e7] rounded-xl flex flex-col items-center justify-center text-center p-5 border border-[#d49b1a]/20">
                      <Smartphone className="w-7 h-7 text-[#d49b1a] mb-2" />
                      <p className="text-sm font-medium text-[#3a2a05]">
                        Live preview unavailable
                      </p>
                      <p className="text-xs text-[#8a6f33] mt-1 leading-relaxed">
                        {state.kind === "missing"
                          ? "We're not running the dev preview right now."
                          : "We couldn't generate the preview code."}
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>

              <div className="flex-1 w-full space-y-3">
                {isMobile && state.kind === "ready" && (
                  <a
                    href={state.expoUrl}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-medium text-white bg-[#1c8a7c] hover:bg-[#1c8a7c]/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Expo Go
                  </a>
                )}

                {state.kind === "ready" && (
                  <>
                    <div className="rounded-2xl bg-white border border-[#d97639]/20 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#8c5a3a] font-medium mb-1">
                        Expo link
                      </p>
                      <code className="block text-xs text-[#3b1c0a] break-all font-mono leading-snug">
                        {state.expoUrl}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium text-[#3b1c0a] bg-[#fff8e7] border border-[#d49b1a]/30 hover:bg-[#fdf0d2] transition-colors"
                      aria-label="Copy Expo link"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Link copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy link
                        </>
                      )}
                    </button>
                  </>
                )}

                {(state.kind === "missing" || state.kind === "error") && (
                  <p className="text-sm text-[#8c5a3a] leading-relaxed">
                    Install Expo Go from the store and check back soon — the
                    live preview will be ready then.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Block 2: Download the app */}
          <div className="glass-card rounded-[2.5rem] p-8 md:p-10 bg-white/50 border border-white/60 flex flex-col">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-medium text-[#d97639] mb-3">
              <Download className="w-4 h-4" />
              Download the app
            </div>
            <h3 className="text-2xl font-display font-medium text-[#3b1c0a] mb-3">
              Get Expo Go for your phone
            </h3>
            <p className="text-sm text-[#8c5a3a] mb-6 leading-relaxed">
              Lumen runs inside Expo Go while we polish the standalone build.
              Install Expo Go once, and the QR opens Lumen every time.
            </p>

            <div className="flex flex-col gap-3 mt-auto">
              <a
                href="https://apps.apple.com/app/expo-go/id982107779"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-between px-5 py-4 rounded-2xl bg-[#3b1c0a] text-white hover:bg-[#3b1c0a]/90 transition-colors"
              >
                <span className="flex flex-col text-left">
                  <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">
                    Download on
                  </span>
                  <span className="text-base font-medium">App Store</span>
                </span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-between px-5 py-4 rounded-2xl bg-[#3b1c0a] text-white hover:bg-[#3b1c0a]/90 transition-colors"
              >
                <span className="flex flex-col text-left">
                  <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">
                    Get it on
                  </span>
                  <span className="text-base font-medium">Google Play</span>
                </span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
