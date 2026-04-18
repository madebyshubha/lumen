import { motion } from "framer-motion";
import { Smartphone, Compass, Heart } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Open Lumen on your phone",
    desc: "Install Expo Go and scan the code in the hero — Lumen opens in seconds. No sign-up wall, no quiz to escape.",
    icon: Smartphone,
  },
  {
    n: "02",
    title: "Lumen learns your phase",
    desc: "Tell it where you are in your cycle in one tap. The whole home reshapes — palette, missions, copy, even what it asks of you.",
    icon: Compass,
  },
  {
    n: "03",
    title: "Live the soft plan",
    desc: "One mission, one lean-in, one gentle thing — scaled to your energy today. Vent when you need to. The rest can wait.",
    icon: Heart,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-32 bg-[#fff8e7] relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <p className="text-xs uppercase tracking-[0.18em] font-medium text-[#d49b1a] mb-4">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-medium text-[#3a2a05] mb-5 leading-[1.05]">
            Three steps.
            <br />
            <span className="text-[#8a6f33]">No bootcamp.</span>
          </h2>
          <p className="text-lg text-[#8a6f33] leading-relaxed">
            A soft, perceptive companion that meets you where you are today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: Math.min(i * 0.08, 0.2) }}
              className="relative p-7 rounded-3xl bg-white/65 backdrop-blur-md border border-white/55 flex flex-col"
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 bg-[#fff3e9] text-[#d49b1a]">
                <step.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-medium mb-2 text-[#d49b1a]">
                Step {step.n}
              </div>
              <h3 className="text-lg font-display font-medium text-[#3a2a05] mb-2 leading-snug">
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
