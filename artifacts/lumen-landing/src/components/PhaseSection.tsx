import { motion } from "framer-motion";
import menstrualGlow from "@/assets/images/glow-menstrual.png";
import follicularGlow from "@/assets/images/glow-follicular.png";
import ovulatoryGlow from "@/assets/images/glow-ovulatory.png";
import lutealGlow from "@/assets/images/glow-luteal.png";

const phases = [
  {
    id: "menstrual",
    name: "Menstrual",
    tagline: "Low battery. Be gentle.",
    color: "#0f1024",
    text: "#f4f2ff",
    accent: "#9aa6ff",
    bgImg: menstrualGlow,
    note: "Soft mode. Sleep priority. No movement pressure.",
  },
  {
    id: "follicular",
    name: "Follicular",
    tagline: "Build energy. Lean in.",
    color: "#f3fbf5",
    text: "#15301f",
    accent: "#1e9d6b",
    bgImg: follicularGlow,
    note: "Lean-in section opens. Strength + new ideas welcomed.",
  },
  {
    id: "ovulatory",
    name: "Ovulatory",
    tagline: "Glow on. You're radiant.",
    color: "#fff8e7",
    text: "#3a2a05",
    accent: "#d49b1a",
    bgImg: ovulatoryGlow,
    note: "Confidence cues. Skin care. Connection prompts.",
  },
  {
    id: "luteal",
    name: "Luteal",
    tagline: "Steady the tide.",
    color: "#fff3e9",
    text: "#3b1c0a",
    accent: "#d97639",
    bgImg: lutealGlow,
    note: "Cravings & mood support. Magnesium. Slower missions.",
  },
];

export function PhaseSection() {
  return (
    <section className="py-32 bg-[#fff3e9] relative">
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3b1c0a] mb-6">
            A phase-fluid dashboard.
          </h2>
          <p className="text-lg text-[#8c5a3a] max-w-2xl mx-auto">
            Your home screen reshapes completely around your cycle phase, energy, and mood. It even recognizes a "Holding Pattern" when ovulation isn't confirmed yet.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="relative rounded-[2rem] overflow-hidden aspect-square md:aspect-[4/5] flex items-end p-8"
              style={{ backgroundColor: phase.color }}
            >
              <img 
                src={phase.bgImg} 
                alt={`${phase.name} glow`} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
              />
              
              <div
                className="absolute top-8 right-8 w-3 h-3 rounded-full shadow-lg"
                style={{ backgroundColor: phase.accent, boxShadow: `0 0 24px ${phase.accent}` }}
                aria-hidden
              />

              <div className="relative z-10 glass-card p-6 rounded-2xl w-full">
                <div
                  className="text-[11px] uppercase tracking-[0.18em] font-medium mb-3 opacity-70"
                  style={{ color: phase.accent }}
                >
                  Phase {i + 1}
                </div>
                <h3 className="text-2xl font-display font-medium mb-2" style={{ color: phase.text }}>
                  {phase.name}
                </h3>
                <p className="opacity-80 mb-3" style={{ color: phase.text }}>
                  {phase.tagline}
                </p>
                <p className="text-sm opacity-60" style={{ color: phase.text }}>
                  {phase.note}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
