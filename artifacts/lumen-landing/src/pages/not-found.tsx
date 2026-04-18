import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#fff8e7] px-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 mb-6">
          <Compass className="w-7 h-7 text-[#d97639]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-medium text-[#3b1c0a] mb-3">
          This page is off-cycle.
        </h1>
        <p className="text-sm text-[#8c5a3a] leading-relaxed mb-8">
          We couldn't find what you were looking for. Take a soft breath and
          head back to the Lumen home.
        </p>
        <a
          href="/lumen-landing/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#d97639] text-white text-sm font-medium hover:bg-[#d97639]/90 transition-colors"
        >
          Back to Lumen
        </a>
      </div>
    </div>
  );
}
