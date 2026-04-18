import { PlayCircle, Smartphone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white pt-16 pb-10 border-t border-[#d47128]/10">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <p className="font-display text-2xl font-semibold text-[#3b1c0a] mb-3">
              Lumen
            </p>
            <p className="text-sm text-[#8c5a3a] leading-relaxed max-w-xs">
              The calm, perceptive PCOS companion. Designed with care for women
              who deserved a softer tool a long time ago.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8c5a3a] font-medium mb-4">
              Explore
            </p>
            <ul className="space-y-2 text-sm text-[#3b1c0a]">
              <li>
                <a href="#features" className="hover:opacity-70 transition-opacity">
                  Features
                </a>
              </li>
              <li>
                <a href="#how" className="hover:opacity-70 transition-opacity">
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#try-it"
                  className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  <Smartphone className="w-4 h-4" />
                  Try it
                </a>
              </li>
              <li>
                <a
                  href="/lumen-trailer/"
                  className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  <PlayCircle className="w-4 h-4" />
                  Trailer
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8c5a3a] font-medium mb-4">
              Company
            </p>
            <ul className="space-y-2 text-sm text-[#3b1c0a]">
              <li>
                <a href="#" className="hover:opacity-70 transition-opacity">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-70 transition-opacity">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-70 transition-opacity">
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@lumen.app"
                  className="hover:opacity-70 transition-opacity"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#d47128]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8c5a3a]">
            &copy; {new Date().getFullYear()} Lumen. Made gently.
          </p>
          <p className="text-xs text-[#8c5a3a]">
            Lumen is a wellness companion. It does not provide medical advice or
            replace your clinician.
          </p>
        </div>
      </div>
    </footer>
  );
}
