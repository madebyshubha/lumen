import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import heroArt from "@/assets/images/hero-art.png";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#fff3e9]">
      {/* Background Image / Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fff3e9] z-10 opacity-60" />
        <img 
          src={heroArt} 
          alt="Abstract calm glowing art" 
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 max-w-5xl flex flex-col items-center text-center mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/60">
            <span className="w-2 h-2 rounded-full bg-[#d97639]" />
            <span className="font-display text-sm font-medium tracking-tight text-[#3b1c0a]">
              Lumen
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-[#3b1c0a] leading-[1.1] mb-6">
            A human-first companion for PCOS / PCOD.
          </h1>
          <p className="text-lg md:text-xl text-[#8c5a3a] mb-10 max-w-2xl mx-auto leading-relaxed">
            Lumen listens in one tap, reshapes itself around your phase,
            energy, and mood, and never shames you. A patient companion — not
            a patient chart.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#try-it"
              className="w-full sm:w-auto px-8 py-4 bg-[#d97639] text-white rounded-full font-medium hover:bg-[#d97639]/90 transition-colors shadow-sm"
            >
              Try it on your phone
            </a>
            <a 
              href="/lumen-trailer/"
              className="w-full sm:w-auto px-8 py-4 bg-white/60 backdrop-blur-md text-[#3b1c0a] border border-white/40 rounded-full font-medium hover:bg-white/80 transition-colors flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Watch the trailer
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
