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
  type LucideIcon,
} from "lucide-react";

type Feature = {
  title: string;
  desc: string;
  icon: LucideIcon;
  span?: "wide" | "tall";
};

const features: Feature[] = [
  {
    title: "Phase-Fluid dashboard",
    desc: "The whole home reshapes around your cycle phase, energy, and mood — including a quiet Holding Pattern when ovulation hasn't been confirmed yet.",
    icon: Compass,
    span: "wide",
  },
  {
    title: "Morning Brief",
    desc: "A device-agnostic daily read on your body — sleep, energy, phase, and today's gentle plan.",
    icon: Sunrise,
  },
  {
    title: "One-tap mood + quick logs",
    desc: "Never a twelve-field form. Just one tap to log your mood, your symptoms, your day.",
    icon: CheckCircle,
  },
  {
    title: "Adaptive missions",
    desc: "Three-tier daily tasks — Mission, Lean In, Gentle — scaled by your HRV and phase. Travel-aware, diet-aware.",
    icon: Activity,
  },
  {
    title: "Vent voice journal",
    desc: "A voice journal that listens and reflects back phase-aware insight, never judgment.",
    icon: Mic,
  },
  {
    title: "Care plans",
    desc: "Targeted protocols for acne, hair loss, fatigue, or travel — quiet routines, not bootcamps.",
    icon: Sparkles,
  },
  {
    title: "Secret Circle",
    desc: "An anonymous community with a phase-mates mood map and a kind, anonymous leaderboard. No comparison shame.",
    icon: Users,
  },
  {
    title: "Cycle & health intelligence",
    desc: "Long-term pattern recognition that makes you feel seen, not surveilled. Your body, finally explained gently.",
    icon: LineChart,
    span: "wide",
  },
];

export function Features() {
  return (
    <section className="py-32 bg-white relative">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <p className="text-xs uppercase tracking-[0.18em] font-medium text-[#d97639] mb-4">
            What's inside
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3b1c0a] mb-5 leading-[1.05]">
            Everything you need.
            <br />
            <span className="text-[#8c5a3a]">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-[#8c5a3a] leading-relaxed">
            Thoughtfully designed to relieve the mental load of PCOS, not add to it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.3) }}
              className={
                "p-7 rounded-3xl border border-[#3b1c0a]/8 bg-[#fffaf3] hover:border-[#d97639]/25 hover:bg-white transition-all duration-300 " +
                (feat.span === "wide" ? "lg:col-span-2" : "")
              }
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 bg-[#fff3e9] text-[#d97639]">
                <feat.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-display font-medium text-[#3b1c0a] mb-2 leading-snug">
                {feat.title}
              </h3>
              <p className="text-[#8c5a3a] leading-relaxed text-[0.95rem]">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
