import { motion } from "framer-motion";
import { PlayCircle, Smartphone } from "lucide-react";
import screenHome from "@/assets/images/screen-home.jpg";
import screenCare from "@/assets/images/screen-care.jpg";

const EXPO_LINK = "exps://trylumen.replit.app";

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
        "relative rounded-[2.5rem] bg-[#1a0d05] p-2 shadow-[0_30px_80px_-20px_rgba(59,28,10,0.45)] ring-1 ring-black/10 " +
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
  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#fff3e9]">
      {/* Soft warm gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(120%_80%_at_15%_10%,#ffe1c7_0%,transparent_55%),radial-gradient(90%_70%_at_95%_90%,#fcd0b0_0%,transparent_60%),linear-gradient(180deg,#fff3e9_0%,#ffe9d6_100%)]"
      />

      {/* Organic blobs */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.55, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -left-32 top-24 z-0 h-[28rem] w-[28rem] rounded-full bg-[#f3a96b] blur-3xl"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.45, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="absolute -right-24 top-1/3 z-0 h-[24rem] w-[24rem] rounded-full bg-[#1c8a7c]/40 blur-3xl"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="absolute bottom-[-6rem] left-1/3 z-0 h-[20rem] w-[20rem] rounded-full bg-[#d97639]/40 blur-3xl"
      />

      {/* Subtle grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.08] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.23 0 0 0 0 0.11 0 0 0 0 0.04 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col items-center px-6 pt-28 pb-20 md:flex-row md:items-center md:gap-10 md:pt-32 md:pb-24 lg:gap-16">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl text-left md:flex-1"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#d97639]" />
            <span className="font-display text-sm font-medium tracking-tight text-[#3b1c0a]">
              Lumen — for PCOS / PCOD
            </span>
          </div>

          <h1 className="font-display text-[2.75rem] font-medium leading-[1.02] tracking-tight text-[#3b1c0a] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            A companion <span className="italic text-[#d97639]">that bends</span> around your phase.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#8c5a3a] md:text-xl">
            Lumen listens in one tap, reshapes itself around your energy and
            mood, and never shames you. A patient companion — not a patient
            chart.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <a
              href={EXPO_LINK}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d97639] px-7 py-4 font-medium text-white shadow-[0_10px_30px_-10px_rgba(217,118,57,0.7)] transition-colors hover:bg-[#c66628] sm:w-auto"
            >
              <Smartphone className="h-5 w-5" />
              Try it in Expo Go
            </a>
            <a
              href="/lumen-trailer/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#3b1c0a]/15 bg-white/70 px-7 py-4 font-medium text-[#3b1c0a] backdrop-blur-md transition-colors hover:bg-white sm:w-auto"
            >
              <PlayCircle className="h-5 w-5" />
              Watch the trailer
            </a>
          </div>

          <p className="mt-4 text-xs text-[#8c5a3a]/80">
            Opens in Expo Go on your phone. New here? Scan the QR code below to
            install.
          </p>
        </motion.div>

        {/* Right: phone screenshots */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative mt-16 w-full md:mt-0 md:flex-1"
        >
          <div className="relative mx-auto h-[24rem] w-full max-w-[20rem] sm:h-[28rem] sm:max-w-[22rem] md:h-[30rem] md:max-w-[20rem] lg:h-[34rem] lg:max-w-[24rem]">
            {/* Soft halo behind phones */}
            <div
              aria-hidden
              className="absolute inset-6 -z-10 rounded-full bg-gradient-to-br from-[#ffd0a8] to-[#f3a96b]/60 blur-2xl"
            />

            {/* Back phone (care) */}
            <motion.div
              initial={{ rotate: 0, x: 0, y: 0 }}
              animate={{ rotate: 8 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="absolute right-0 top-2 w-[58%] origin-bottom-left sm:w-[55%]"
            >
              <PhoneFrame src={screenCare} alt="Lumen care screen" />
            </motion.div>

            {/* Front phone (home) */}
            <motion.div
              initial={{ rotate: 0, x: 0, y: 0 }}
              animate={{ rotate: -6 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              className="absolute bottom-0 left-0 w-[60%] origin-bottom-right sm:w-[58%]"
            >
              <PhoneFrame src={screenHome} alt="Lumen home screen" />
            </motion.div>

            {/* Small floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="absolute -top-4 left-2 hidden items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-[#3b1c0a] shadow-sm backdrop-blur-md sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#1c8a7c]" />
              Phase-fluid
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.05 }}
              className="absolute -bottom-3 right-4 hidden items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-[#3b1c0a] shadow-sm backdrop-blur-md sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#d97639]" />
              One-tap listen
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
