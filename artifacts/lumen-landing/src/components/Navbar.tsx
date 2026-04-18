import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between mix-blend-difference text-white"
    >
      <a
        href="#top"
        className="inline-flex min-h-[44px] items-center font-display text-2xl font-semibold tracking-tight rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        Lumen
      </a>
      <div className="hidden md:flex items-center gap-2 text-sm font-medium">
        <a
          href="#features"
          className="inline-flex min-h-[44px] items-center px-3 hover:opacity-80 transition-opacity rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Features
        </a>
        <a
          href="#how"
          className="inline-flex min-h-[44px] items-center px-3 hover:opacity-80 transition-opacity rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          How it works
        </a>
        <a
          href="#try-it"
          className="inline-flex min-h-[44px] items-center px-3 hover:opacity-80 transition-opacity rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Try it
        </a>
      </div>
      <a
        href="#try-it"
        className="inline-flex min-h-[44px] items-center text-sm font-medium bg-white/20 backdrop-blur-md px-5 rounded-full hover:bg-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Try the app
      </a>
    </motion.nav>
  );
}
