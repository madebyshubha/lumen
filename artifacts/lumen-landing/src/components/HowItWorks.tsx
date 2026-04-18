import { motion } from "framer-motion";
import { Smartphone, Compass, Heart } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Open Lumen on your phone",
    desc: "Install Expo Go and scan the code below — Lumen opens in seconds. No sign-up wall, no quiz to escape.",
    icon: Smartphone,
    color: "#1c8a7c",
    bg: "#eaf6f4",
  },
  {
    n: "02",
    title: "Lumen learns your phase",
    desc: "Tell it where you are in your cycle in one tap. The whole home reshapes — palette, missions, copy, even what it asks of you.",
    icon: Compass,
    color: "#d49b1a",
    bg: "#fff8e7",
  },
  {
    n: "03",
    title: "Live the soft plan",
    desc: "One mission, one lean-in, one gentle thing — scaled to your energy today. Vent when you need to. The rest can wait.",
    icon: Heart,
    color: "#d97639",
    bg: "#fff3e9",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-32 bg-[#fff8e7] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3a2a05] mb-6">
            How Lumen works.
          </h2>
          <p className="text-lg text-[#8a6f33] max-w-2xl mx-auto">
            Three steps. No checklists. No bootcamp. Just a soft, perceptive companion that meets you where you are today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="relative p-8 rounded-[2rem] bg-white/60 backdrop-blur-md border border-white/60 flex flex-col"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: step.bg, color: step.color }}
              >
                <step.icon className="w-6 h-6" />
              </div>
              <div
                className="text-xs uppercase tracking-[0.18em] font-medium mb-2"
                style={{ color: step.color }}
              >
                Step {step.n}
              </div>
              <h3 className="text-xl font-display font-medium text-[#3a2a05] mb-3">
                {step.title}
              </h3>
              <p className="text-[#8a6f33] leading-relaxed text-sm">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
