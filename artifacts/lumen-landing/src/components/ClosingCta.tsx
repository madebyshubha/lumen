import { useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Mail, Check } from "lucide-react";

export function ClosingCta() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <section className="py-24 bg-[#3b1c0a] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 30%, #d97639 0%, transparent 60%), radial-gradient(50% 60% at 80% 70%, #1c8a7c 0%, transparent 60%)",
        }}
      />
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-display font-medium mb-5 tracking-tight">
            One soft companion. Every cycle.
          </h2>
          <p className="text-base md:text-lg text-white/75 max-w-xl mx-auto mb-10 leading-relaxed">
            Watch the trailer or leave your email — we'll let you know the
            moment Lumen lands on the App Store.
          </p>

          <div className="flex flex-col items-center gap-6">
            <a
              href="/lumen-trailer/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#3b1c0a] font-medium hover:bg-white/90 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Watch the trailer
            </a>

            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/15"
            >
              <div className="flex items-center gap-2 flex-1 px-4">
                <Mail className="w-4 h-4 text-white/60 flex-shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourself.com"
                  className="flex-1 bg-transparent text-sm py-2.5 placeholder:text-white/40 text-white focus:outline-none"
                  aria-label="Email address for launch updates"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#d97639] text-white text-sm font-medium hover:bg-[#d97639]/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                {submitted ? (
                  <>
                    <Check className="w-4 h-4" /> You're on the list
                  </>
                ) : (
                  "Notify me"
                )}
              </button>
            </form>

            <p className="text-xs text-white/50">
              No spam. One quiet email when Lumen launches.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
