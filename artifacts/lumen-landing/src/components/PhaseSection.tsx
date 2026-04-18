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
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <p className="text-xs uppercase tracking-[0.18em] font-medium text-[#d97639] mb-4">
            Phase-fluid logic
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3b1c0a] mb-5 leading-[1.05]">
            Your home screen
            <br />
            <span className="text-[#8c5a3a]">reshapes around you.</span>
          </h2>
          <p className="text-lg text-[#8c5a3a] leading-relaxed">
            Palette, missions, copy — even what Lumen asks of you. And when
            ovulation isn't confirmed yet, it quietly enters a Holding Pattern.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: Math.min(i * 0.08, 0.24) }}
              className="relative rounded-[2rem] overflow-hidden aspect-square md:aspect-[4/5] flex items-end p-7"
              style={{ backgroundColor: phase.color }}
            >
              <img
                src={phase.bgImg}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
              />

              <div
                className="absolute top-7 right-7 w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: phase.accent,
                  boxShadow: `0 0 20px ${phase.accent}`,
                }}
                aria-hidden
              />

              <div className="relative z-10 rounded-2xl bg-white/55 backdrop-blur-md border border-white/35 p-5 w-full">
                <div
                  className="text-[10px] uppercase tracking-[0.2em] font-medium mb-2.5"
                  style={{ color: phase.accent }}
                >
                  Phase 0{i + 1}
                </div>
                <h3
                  className="text-xl font-display font-medium mb-1.5"
                  style={{ color: phase.text }}
                >
                  {phase.name}
                </h3>
                <p
                  className="text-sm font-medium mb-2 opacity-85"
                  style={{ color: phase.text }}
                >
                  {phase.tagline}
                </p>
                <p
                  className="text-xs opacity-65 leading-relaxed"
                  style={{ color: phase.text }}
                >
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
