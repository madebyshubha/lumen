import { motion } from "framer-motion";
import { Smartphone, Copy, Check, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import screenHome from "@/assets/images/screen-home.jpg";
import screenCare from "@/assets/images/screen-care.jpg";
import { useExpoQr, detectMobile, copyText } from "@/lib/useExpoQr";

function PhoneFrame({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={
        "relative rounded-[2.5rem] bg-[#1a0d05] p-2 shadow-[0_24px_60px_-22px_rgba(59,28,10,0.4)] ring-1 ring-black/10 " +
        className
      }
    >
      <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1a0d05]" />
      <div className="overflow-hidden rounded-[2rem] bg-black">
        <img
          src={src}
          alt={alt}
          className="block h-auto w-full select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}

export function Hero() {
  const qr = useExpoQr(280);
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
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#fff3e9]">
      {/* Single warm gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(120%_80%_at_15%_10%,#ffe1c7_0%,transparent_55%),linear-gradient(180deg,#fff3e9_0%,#ffe9d6_100%)]"
      />

      {/* One soft halo */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 0.45, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -right-24 top-1/4 z-0 h-[28rem] w-[28rem] rounded-full bg-[#f3a96b] blur-3xl"
      />

      {/* Subtle grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.23 0 0 0 0 0.11 0 0 0 0 0.04 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col items-center px-6 pt-28 pb-20 md:flex-row md:items-center md:gap-10 md:pt-32 md:pb-24 lg:gap-16">
        {/* Left: copy + primary action */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl text-left md:flex-1"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#d97639]" />
            <span className="font-display text-sm font-medium tracking-tight text-[#3b1c0a]">
              Lumen — for PCOS / PCOD
            </span>
          </div>

          <h1 className="font-display text-[2.75rem] font-medium leading-[1.02] tracking-tight text-[#3b1c0a] sm:text-6xl md:text-7xl lg:text-[5rem]">
            A companion <span className="italic text-[#d97639]">that bends</span> around your phase.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#8c5a3a]">
            Lumen listens in one tap, reshapes itself around your energy and
            mood, and never shames you. A patient companion — not a patient
            chart.
          </p>

          {/* Primary CTA: QR card (desktop) or open button (mobile) */}
          <div className="mt-9 max-w-md">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(59,28,10,0.18)]">
              {!isMobile ? (
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 rounded-2xl bg-white p-2 ring-1 ring-[#d97639]/15">
                    {qr.kind === "ready" && (
                      <img
                        src={qr.src}
                        alt="Scan with your phone camera to open Lumen in Expo Go"
                        className="block h-[110px] w-[110px] rounded-lg"
                      />
                    )}
                    {qr.kind === "loading" && (
                      <div className="h-[110px] w-[110px] animate-pulse rounded-lg bg-[#fff3e9]" />
                    )}
                    {(qr.kind === "missing" || qr.kind === "error") && (
                      <div className="flex h-[110px] w-[110px] items-center justify-center rounded-lg bg-[#fff8e7] p-2 text-center text-[10px] leading-tight text-[#8a6f33]">
                        Live preview offline
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-medium text-[#3b1c0a]">
                      Scan to open in Expo Go
                    </p>
                    <p className="mt-1 text-xs leading-snug text-[#8c5a3a]">
                      Point your phone camera at the code. Install{" "}
                      <a
                        href="https://expo.dev/go"
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-[#d97639]/40 underline-offset-2 hover:text-[#d97639] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 rounded"
                      >
                        Expo Go
                      </a>{" "}
                      first.
                    </p>
                    {qr.kind === "ready" && (
                      <div className="mt-3 flex items-center gap-2">
                        <code className="flex-1 min-w-0 truncate rounded-full border border-[#d97639]/15 bg-white px-3 py-2 font-mono text-[11px] leading-none text-[#3b1c0a]">
                          {qr.expoUrl}
                        </code>
                        <button
                          type="button"
                          onClick={onCopy}
                          className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-full border border-[#d97639]/25 bg-white px-3 text-xs font-medium text-[#3b1c0a] transition-colors hover:bg-[#fff3e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/50"
                          aria-label="Copy Expo link to clipboard"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff3e9] text-[#d97639]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-base font-medium text-[#3b1c0a]">
                        Open Lumen on this phone
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-[#8c5a3a]">
                        Make sure{" "}
                        <a
                          href="https://expo.dev/go"
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-[#d97639]/40 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 rounded"
                        >
                          Expo Go
                        </a>{" "}
                        is installed first.
                      </p>
                    </div>
                  </div>
                  {qr.kind === "ready" ? (
                    <a
                      href={qr.expoUrl}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d97639] px-5 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(217,118,57,0.6)] transition-colors hover:bg-[#c66628] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff3e9]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Expo Go
                    </a>
                  ) : (
                    <p className="text-xs text-[#8c5a3a]">
                      Live preview is offline right now. Check back soon.
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-[#8c5a3a]/80">
              No sign-up wall. No quiz to escape. Lumen opens in seconds.
            </p>
          </div>
        </motion.div>

        {/* Right: phone screenshots */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          className="relative mt-16 w-full md:mt-0 md:flex-1"
        >
          <div className="relative mx-auto h-[24rem] w-full max-w-[20rem] sm:h-[28rem] sm:max-w-[22rem] md:h-[30rem] md:max-w-[20rem] lg:h-[34rem] lg:max-w-[24rem]">
            <div
              aria-hidden
              className="absolute inset-6 -z-10 rounded-full bg-gradient-to-br from-[#ffd0a8] to-[#f3a96b]/50 blur-2xl"
            />

            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 5 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="absolute right-0 top-2 w-[58%] origin-bottom-left sm:w-[55%]"
            >
              <PhoneFrame src={screenCare} alt="Lumen care screen" />
            </motion.div>

            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: -4 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              className="absolute bottom-0 left-0 w-[60%] origin-bottom-right sm:w-[58%]"
            >
              <PhoneFrame src={screenHome} alt="Lumen home screen" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
