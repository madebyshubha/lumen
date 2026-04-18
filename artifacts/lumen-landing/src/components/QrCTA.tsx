import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Smartphone, Copy, Check } from "lucide-react";

type QrState =
  | { kind: "loading" }
  | { kind: "ready"; src: string; expoUrl: string }
  | { kind: "missing" }
  | { kind: "error" };

export function QrCTA() {
  const [state, setState] = useState<QrState>({ kind: "loading" });
  const [copied, setCopied] = useState(false);
  const domain = import.meta.env.VITE_REPLIT_EXPO_DEV_DOMAIN as string | undefined;

  useEffect(() => {
    if (!domain) {
      setState({ kind: "missing" });
      return;
    }
    const expoUrl = `exp://${domain}`;
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
  }, [domain]);

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
    <section id="try-it" className="py-32 bg-[#fff3e9] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <div className="glass-card rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 bg-white/40">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3b1c0a] mb-6">
              Ready to feel seen?
            </h2>
            <p className="text-lg text-[#8c5a3a] mb-8 max-w-md mx-auto md:mx-0">
              Lumen is available via Expo Go. Install the Expo Go app on your phone, then scan the code to open Lumen.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <a 
                href="https://apps.apple.com/app/expo-go/id982107779"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#3b1c0a] text-white rounded-full font-medium hover:bg-[#3b1c0a]/90 transition-colors text-sm"
              >
                App Store (Expo Go)
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#3b1c0a] text-white rounded-full font-medium hover:bg-[#3b1c0a]/90 transition-colors text-sm"
              >
                Google Play (Expo Go)
              </a>
            </div>
          </div>

          <div className="flex-shrink-0 w-full max-w-[280px]">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-white flex flex-col items-center"
            >
              {state.kind === "ready" && (
                <>
                  <img
                    src={state.src}
                    alt="Scan with Expo Go to open Lumen"
                    className="w-full h-auto rounded-xl mb-4"
                  />
                  <p className="text-sm font-medium text-[#8c5a3a] text-center mb-3">
                    Scan with your phone's camera
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-medium text-[#3b1c0a] bg-[#fff8e7] border border-[#d49b1a]/30 hover:bg-[#fdf0d2] transition-colors"
                    aria-label="Copy Expo link"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Link copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy exp:// link
                      </>
                    )}
                  </button>
                </>
              )}

              {state.kind === "loading" && (
                <div className="w-full aspect-square bg-[#fff8e7] rounded-xl mb-4 flex items-center justify-center text-[#8a6f33] text-sm">
                  Preparing your code...
                </div>
              )}

              {(state.kind === "missing" || state.kind === "error") && (
                <>
                  <div className="w-full aspect-square bg-[#fff8e7] rounded-xl mb-4 flex flex-col items-center justify-center text-center p-5 border border-[#d49b1a]/20">
                    <Smartphone className="w-8 h-8 text-[#d49b1a] mb-2" />
                    <p className="text-sm font-medium text-[#3a2a05]">
                      Live preview unavailable
                    </p>
                    <p className="text-xs text-[#8a6f33] mt-1 leading-relaxed">
                      {state.kind === "missing"
                        ? "We're not running the dev preview right now. Install Expo Go and check back soon."
                        : "We couldn't generate the preview code. Install Expo Go and check back soon."}
                    </p>
                  </div>
                  <p className="text-xs text-[#8c5a3a] text-center">
                    Tap the store buttons to install Expo Go in the meantime.
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
