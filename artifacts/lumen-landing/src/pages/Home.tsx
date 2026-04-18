import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PhaseSection } from "@/components/PhaseSection";
import { Features } from "@/components/Features";
import { QrCTA } from "@/components/QrCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background selection:bg-primary/20">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PhaseSection />
        <Features />
        <QrCTA />
      </main>
      <Footer />
    </div>
  );
}
