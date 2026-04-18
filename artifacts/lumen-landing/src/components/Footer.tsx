import { Smartphone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white pt-16 pb-10 border-t border-[#3b1c0a]/8">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <p className="font-display text-2xl font-semibold text-[#3b1c0a] mb-3 tracking-tight">
              Lumen
            </p>
            <p className="text-sm text-[#8c5a3a] leading-relaxed max-w-xs">
              The calm, perceptive PCOS companion. Designed with care for women
              who deserved a softer tool a long time ago.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8c5a3a] font-medium mb-4">
              Explore
            </p>
            <ul className="space-y-2.5 text-sm text-[#3b1c0a]">
              <li>
                <a
                  href="#features"
                  className="inline-flex min-h-[44px] items-center hover:text-[#d97639] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 px-1"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how"
                  className="inline-flex min-h-[44px] items-center hover:text-[#d97639] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 px-1"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#try-it"
                  className="inline-flex min-h-[44px] items-center gap-2 hover:text-[#d97639] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 px-1"
                >
                  <Smartphone className="w-4 h-4" />
                  Try it
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8c5a3a] font-medium mb-4">
              Company
            </p>
            <ul className="space-y-2.5 text-sm text-[#3b1c0a]">
              <li>
                <a
                  href="#"
                  className="inline-flex min-h-[44px] items-center hover:text-[#d97639] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 px-1"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex min-h-[44px] items-center hover:text-[#d97639] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 px-1"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex min-h-[44px] items-center hover:text-[#d97639] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 px-1"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@lumen.app"
                  className="inline-flex min-h-[44px] items-center hover:text-[#d97639] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97639]/40 px-1"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#3b1c0a]/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8c5a3a]">
            &copy; {new Date().getFullYear()} Lumen. Made gently.
          </p>
          <p className="text-xs text-[#8c5a3a] max-w-md text-center sm:text-right">
            Lumen is a wellness companion. It does not provide medical advice or
            replace your clinician.
          </p>
        </div>
      </div>
    </footer>
  );
}
