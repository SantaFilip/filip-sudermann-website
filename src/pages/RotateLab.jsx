import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import TrustBar from '@/components/sections/TrustBar';
import CreatorEconomy from '@/components/sections/CreatorEconomy';
import CreatorComparison from '@/components/sections/CreatorComparison';
import ArbeitsweiseSection from '@/components/sections/ArbeitsweiseSection';
import GlobalReach from '@/components/sections/GlobalReach';
import ConsultationBooking from '@/components/sections/ConsultationBooking';
import FAQ from '@/components/sections/FAQ';
import RotaryStage from '@/components/lab/RotaryStage';

/**
 * Testseite fuer die rotierende Trommel - bewusst NICHT verlinkt und nicht
 * in der Sitemap. Home bleibt unveraendert, bis die Optik sitzt.
 *
 * Die beiden InteractiveFolder-Sections (Services, Ueber mich) fehlen hier
 * absichtlich: sie klappen auf und aendern dabei ihre Hoehe. Auf einer
 * Trommelflaeche, die nicht scrollen kann, waere der aufgeklappte Inhalt
 * abgeschnitten.
 */
export default function RotateLab() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="fixed bottom-4 left-4 z-50 rounded border border-accent bg-card/90 px-3 py-1.5 text-xs font-mono text-muted-foreground backdrop-blur">
        Testversion · Trommel + rotierender Hintergrund
      </div>

      <main>
        <RotaryStage>
          <Hero />
          <TrustBar />
          <CreatorEconomy />
          <CreatorComparison />
          <ArbeitsweiseSection />
          <GlobalReach />
          <ConsultationBooking />
          <FAQ />
        </RotaryStage>
      </main>

      <Footer />
    </div>
  );
}
