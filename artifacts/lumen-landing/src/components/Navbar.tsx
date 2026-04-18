import { motion } from "framer-motion";
import { Link } from "wouter";
import { PlayCircle } from "lucide-react";

export function Navbar() {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between mix-blend-difference text-white"
    >
      <div className="font-display text-2xl font-semibold tracking-tight">
        Lumen
      </div>
      <div className="flex items-center gap-6">
        <a 
          href="/lumen-trailer/"
          className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <PlayCircle className="w-4 h-4" />
          Watch trailer
        </a>
        <a 
          href="#try-it"
          className="text-sm font-medium bg-white/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
        >
          Try the app
        </a>
      </div>
    </motion.nav>
  );
}
