import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check, Loader2 } from "lucide-react";

type SubmitState = "idle" | "loading" | "success";

export function ClosingCta() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state !== "idle") return;
    setState("loading");
    setTimeout(() => {
      setState("success");
      setEmail("");
      setTimeout(() => setState("idle"), 3500);
    }, 700);
  };

  return (
    <section className="py-24 bg-[#3b1c0a] text-white relative overflow-hidden">
      {/* One soft warm glow, dialed-down */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 30%, #d97639 0%, transparent 60%)",
        }}
      />
      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-[0.18em] font-medium text-[#d97639] mb-4">
            Stay close
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-medium mb-5 tracking-tight leading-[1.05]">
            One soft companion.
            <br />
            <span className="text-white/70">Every cycle.</span>
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
            Leave your email — we'll let you know the moment Lumen lands on the
            App Store.
          </p>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md mx-auto flex flex-col sm:flex-row gap-2 bg-white/8 backdrop-blur-md p-2 rounded-full border border-white/15 focus-within:border-white/30 transition-colors"
          >
            <label htmlFor="closing-email" className="sr-only">
              Email address for launch updates
            </label>
            <div className="flex items-center gap-2 flex-1 px-4 min-w-0">
              <Mail className="w-4 h-4 text-white/55 flex-shrink-0" />
              <input
                id="closing-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourself.com"
                className="flex-1 min-w-0 bg-transparent text-sm py-2.5 placeholder:text-white/40 text-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={state !== "idle"}
              className="min-h-[44px] px-6 rounded-full bg-[#d97639] text-white text-sm font-medium hover:bg-[#c66628] disabled:opacity-80 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3b1c0a]"
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                </>
              ) : state === "success" ? (
                <>
                  <Check className="w-4 h-4" /> You're on the list
                </>
              ) : (
                "Notify me"
              )}
            </button>
          </form>

          <p className="text-xs text-white/45 mt-6">
            No spam. One quiet email when Lumen launches.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
