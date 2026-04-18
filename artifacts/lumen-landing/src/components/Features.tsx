import { motion } from "framer-motion";
import {
  Mic,
  CheckCircle,
  Sunrise,
  Users,
  Activity,
  Sparkles,
  LineChart,
  Compass,
} from "lucide-react";

const features = [
  {
    title: "Phase-Fluid dashboard",
    desc: "The whole home reshapes around your cycle phase, energy, and mood — including a quiet Holding Pattern when ovulation hasn't been confirmed yet.",
    icon: Compass,
    color: "#1c8a7c",
    bg: "#eaf6f4",
  },
  {
    title: "Morning Brief",
    desc: "A device-agnostic daily read on your body — sleep, energy, phase, and today's gentle plan.",
    icon: Sunrise,
    color: "#d97639",
    bg: "#fff3e9",
  },
  {
    title: "One-tap mood + quick logs",
    desc: "Never a twelve-field form. Just one tap to log your mood, your symptoms, your day.",
    icon: CheckCircle,
    color: "#1e9d6b",
    bg: "#f3fbf5",
  },
  {
    title: "Adaptive missions",
    desc: "Three-tier daily tasks — Mission, Lean In, Gentle — scaled by your HRV and phase. Travel-aware, diet-aware.",
    icon: Activity,
    color: "#d49b1a",
    bg: "#fff8e7",
  },
  {
    title: "Vent voice journal",
    desc: "A voice journal that listens and reflects back phase-aware insight, never judgment.",
    icon: Mic,
    color: "#1c8a7c",
    bg: "#eaf6f4",
  },
  {
    title: "Care plans",
    desc: "Targeted protocols for acne, hair loss, fatigue, or travel — quiet routines, not bootcamps.",
    icon: Sparkles,
    color: "#9aa6ff",
    bg: "#0f1024",
  },
  {
    title: "Secret Circle",
    desc: "An anonymous community with a phase-mates mood map and a kind, anonymous leaderboard. No comparison shame.",
    icon: Users,
    color: "#d97639",
    bg: "#fff3e9",
  },
  {
    title: "Cycle & health intelligence",
    desc: "Long-term pattern recognition that makes you feel seen, not surveilled. Your body, finally explained gently.",
    icon: LineChart,
    color: "#7b8cff",
    bg: "#f4f2ff",
  },
];

export function Features() {
  return (
    <section className="py-32 bg-white relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3b1c0a] mb-6">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-lg text-[#8c5a3a] max-w-2xl mx-auto">
            Thoughtfully designed to relieve the mental load of PCOS, not add to it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-8 rounded-[2rem] border border-[#d47128]/10 bg-[#fff3e9]/30 hover:bg-[#fff3e9]/60 transition-colors"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: feat.bg, color: feat.color }}
              >
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-display font-medium text-[#3b1c0a] mb-3">
                {feat.title}
              </h3>
              <p className="text-[#8c5a3a] leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
