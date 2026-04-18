import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Copy, Check, ExternalLink, Download } from "lucide-react";
import { useExpoQr, detectMobile, copyText } from "@/lib/useExpoQr";

export function QrCTA() {
  const qr = useExpoQr(220);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  const onCopy = async () => {
    if (qr.kind !== "ready") return;
    const ok = await copyText(qr.expoUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section
      id="try-it"
      className="py-32 bg-[#fff3e9] relative overflow-hidden"
    >
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <p className="text-xs uppercase tracking-[0.18em] font-medium text-[#1c8a7c] mb-4">
            Try Lumen
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3b1c0a] mb-5 leading-[1.05]">
            Get Lumen on your phone.
          </h2>
          <p className="text-lg text-[#8c5a3a] leading-relaxed">
            Use the live preview today, or wait for the standalone app on the
            store.
          </p>
        </motion.div>

        <div className="rounded-[2rem] border border-white/70 bg-white/65 backdrop-blur-md p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-8 md:gap-10">
            {/* QR / mobile button */}
            <div className="flex justify-center md:justify-start">
              {!isMobile ? (
                <div className="rounded-2xl bg-white p-3 ring-1 ring-[#1c8a7c]/15 shadow-[0_8px_24px_-12px_rgba(28,138,124,0.25)]">
                  {qr.kind === "ready" && (
                    <img
                      src={qr.src}
                      alt="Scan with your phone camera to open Lumen in Expo Go"
                      className="block h-[180px] w-[180px] rounded-lg"
                    />
                  )}
                  {qr.kind === "loading" && (
                    <div className="h-[180px] w-[180px] animate-pulse rounded-lg bg-[#fff3e9]" />
                  )}
                  {(qr.kind === "missing" || qr.kind === "error") && (
                    <div className="flex h-[180px] w-[180px] flex-col items-center justify-center rounded-lg bg-[#fff8e7] p-3 text-center text-xs text-[#8a6f33]">
                      <Smartphone className="mb-2 h-6 w-6 text-[#d49b1a]" />
                      Live preview offline
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {qr.kind === "ready" && (
                    <a
                      href={qr.expoUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1c8a7c] px-6 py-3.5 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(28,138,124,0.6)] transition-colors hover:bg-[#177268] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c8a7c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff3e9]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Expo Go
                    </a>
                  )}
                  {qr.kind === "loading" && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#fff8e7] border border-[#d49b1a]/25 px-5 py-3 text-sm text-[#8a6f33]">
                      Preparing your link…
                    </div>
                  )}
                  {(qr.kind === "missing" || qr.kind === "error") && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#fff8e7] border border-[#d49b1a]/25 px-5 py-3 text-sm text-[#8a6f33]">
                      <Smartphone className="h-4 w-4 text-[#d49b1a]" />
                      Live preview offline
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right copy + actions */}
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-display font-medium text-[#3b1c0a] mb-2">
                {isMobile
                  ? "Tap to open Lumen in Expo Go"
                  : "Scan with your phone camera"}
              </h3>
              <p className="text-sm text-[#8c5a3a] leading-relaxed mb-5">
                Install{" "}
                <a
                  href="https://apps.apple.com/app/expo-go/id982107779"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[#1c8a7c]/40 underline-offset-2 hover:text-[#1c8a7c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c8a7c]/40 rounded"
                >
                  Expo Go for iOS
                </a>{" "}
                or{" "}
                <a
                  href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[#1c8a7c]/40 underline-offset-2 hover:text-[#1c8a7c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c8a7c]/40 rounded"
                >
                  Android
                </a>
                , then scan the code. Lumen opens in seconds — no sign-up wall.
              </p>

              {qr.kind === "ready" && (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-center md:justify-start">
                  <code className="text-xs text-[#3b1c0a] bg-white border border-[#d97639]/15 px-3 py-2 rounded-full font-mono break-all max-w-full overflow-hidden text-ellipsis">
                    {qr.expoUrl}
                  </code>
                  <button
                    type="button"
                    onClick={onCopy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d97639]/25 bg-white px-3 py-2 text-xs font-medium text-[#3b1c0a] transition-colors hover:bg-[#fff3e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/50"
                    aria-label="Copy Expo link to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy link
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="mt-7 pt-6 border-t border-[#3b1c0a]/8">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-[#8c5a3a] mb-3">
                  <Download className="h-3.5 w-3.5" />
                  Coming soon
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href="#"
                    aria-disabled="true"
                    onClick={(e) => e.preventDefault()}
                    className="flex-1 inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#3b1c0a] text-white text-sm hover:opacity-95 transition-opacity cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b1c0a]/50"
                  >
                    <span className="flex flex-col text-left leading-tight">
                      <span className="text-[10px] uppercase tracking-[0.18em] opacity-60">
                        Soon on
                      </span>
                      <span className="font-medium">App Store</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                  <a
                    href="#"
                    aria-disabled="true"
                    onClick={(e) => e.preventDefault()}
                    className="flex-1 inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#3b1c0a] text-white text-sm hover:opacity-95 transition-opacity cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b1c0a]/50"
                  >
                    <span className="flex flex-col text-left leading-tight">
                      <span className="text-[10px] uppercase tracking-[0.18em] opacity-60">
                        Soon on
                      </span>
                      <span className="font-medium">Google Play</span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
