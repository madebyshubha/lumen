import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PhaseSection } from "@/components/PhaseSection";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { QrCTA } from "@/components/QrCTA";
import { ClosingCta } from "@/components/ClosingCta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div
      id="top"
      className="min-h-[100dvh] w-full flex flex-col bg-background selection:bg-primary/20"
    >
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PhaseSection />
        <section id="features">
          <Features />
        </section>
        <HowItWorks />
        <QrCTA />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
