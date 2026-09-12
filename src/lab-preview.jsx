import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import TrustBar from '@/components/sections/TrustBar';
import CreatorEconomy from '@/components/sections/CreatorEconomy';
import CreatorComparison from '@/components/sections/CreatorComparison';
import ArbeitsweiseSection from '@/components/sections/ArbeitsweiseSection';
import FAQ from '@/components/sections/FAQ';
import RotaryStage from '@/components/lab/RotaryStage';
import AxisSwitch, { STAGE_PRESETS } from '@/components/lab/AxisSwitch';
import SmoothScroll from '@/components/SmoothScroll';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ToastProvider } from '@/components/ui/use-toast';
import '@/index.css';

/**
 * Eigener Einstiegspunkt nur fuer die Vorschau-Seite. Baut die Trommel
 * standalone, ohne Router-Pfade und ohne die Sections, die externe Dienste
 * brauchen - die sind in einer Sandbox blockiert und wuerden als leere
 * Kaesten erscheinen.
 */
function Placeholder({ title, reason }) {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="border-2 border-dashed border-accent/60 bg-card/60 p-12 text-center">
          <p className="font-heading text-3xl font-bold text-foreground">{title}</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {reason}
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
            Platzhalter nur in dieser Vorschau
          </p>
        </div>
      </div>
    </section>
  );
}

function LabPreview() {
  const [preset, setPreset] = useState('wuerfel');
  const { axis, sides, fill } = STAGE_PRESETS[preset];

  return (
    <SmoothScroll>
      <LanguageProvider>
        <ToastProvider>
          <HashRouter>
            <div className="min-h-screen bg-background">
              <Header />

              <AxisSwitch preset={preset} onChange={setPreset} />

              <main>
                <RotaryStage key={preset} axis={axis} sides={sides} fill={fill}>
                  <Hero />
                  <TrustBar />
                  <CreatorEconomy />
                  <CreatorComparison />
                  <ArbeitsweiseSection />
                  <Placeholder
                    title="Globale Reichweite"
                    reason="Der 3D-Globus laedt seine Texturen von GitHub. Externe Requests sind in dieser Vorschau blockiert, auf deiner Seite laeuft er normal."
                  />
                  <Placeholder
                    title="Kostenloses Erstgespraech"
                    reason="Das Calendly-Widget wird von aussen nachgeladen und ist hier blockiert. Auf deiner Seite steht an dieser Stelle der Buchungskalender."
                  />
                  <FAQ />
                </RotaryStage>
              </main>

              <Footer />
            </div>
          </HashRouter>
        </ToastProvider>
      </LanguageProvider>
    </SmoothScroll>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LabPreview />
  </React.StrictMode>
);
