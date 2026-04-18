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
        className="font-display text-2xl font-semibold tracking-tight rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        Lumen
      </a>
      <div className="hidden md:flex items-center gap-7 text-sm font-medium">
        <a
          href="#features"
          className="hover:opacity-80 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 px-1 py-0.5"
        >
          Features
        </a>
        <a
          href="#how"
          className="hover:opacity-80 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 px-1 py-0.5"
        >
          How it works
        </a>
        <a
          href="#try-it"
          className="hover:opacity-80 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 px-1 py-0.5"
        >
          Try it
        </a>
      </div>
      <a
        href="#try-it"
        className="text-sm font-medium bg-white/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Try the app
      </a>
    </motion.nav>
  );
}
