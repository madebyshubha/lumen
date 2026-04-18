import { motion } from "framer-motion";
import { Mic, CheckCircle, Sunrise, Users, Activity, Sparkles } from "lucide-react";

const features = [
  {
    title: "Morning Brief",
    desc: "A gentle daily read on your body — sleep, energy, phase, and today's gentle plan.",
    icon: Sunrise,
    color: "#d97639",
    bg: "#fff3e9"
  },
  {
    title: "One-tap Mood",
    desc: "Never a 12-field form. Just one tap to log your mood and move on.",
    icon: CheckCircle,
    color: "#1e9d6b",
    bg: "#f3fbf5"
  },
  {
    title: "Adaptive Missions",
    desc: "Three-tier daily tasks scaled by your energy and phase. Travel and diet aware.",
    icon: Activity,
    color: "#d49b1a",
    bg: "#fff8e7"
  },
  {
    title: "Vent Voice Journal",
    desc: "A voice journal that listens and reflects back phase-aware insight.",
    icon: Mic,
    color: "#1c8a7c",
    bg: "#eaf6f4"
  },
  {
    title: "Care Plans",
    desc: "Targeted protocols for acne, fatigue, or travel — quiet routines, not bootcamps.",
    icon: Sparkles,
    color: "#9aa6ff",
    bg: "#0f1024"
  },
  {
    title: "Secret Circle",
    desc: "An anonymous community with a phase-mates mood map and no comparison shame.",
    icon: Users,
    color: "#d97639",
    bg: "#fff3e9"
  }
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
