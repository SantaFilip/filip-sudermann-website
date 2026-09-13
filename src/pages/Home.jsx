import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import TrustBar from '@/components/sections/TrustBar';
import CreatorEconomy from '@/components/sections/CreatorEconomy';
import InteractiveFolder from '@/components/sections/InteractiveFolder';
import ServicesContent from '@/components/sections/folders/ServicesContent';
import AboutContent from '@/components/sections/folders/AboutContent';
import CreatorComparison from '@/components/sections/CreatorComparison';
import ArbeitsweiseSection from '@/components/sections/ArbeitsweiseSection';
import GlobalReach from '@/components/sections/GlobalReach';
import ConsultationBooking from '@/components/sections/ConsultationBooking';
import FAQ from '@/components/sections/FAQ';
import FadeIn from '@/components/FadeIn';
import RotaryStage from '@/components/lab/RotaryStage';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const f = t.folders;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/*
         * Acht Sections liegen auf einem rotierenden Zylinder (12 Facetten,
         * seitliche Drehung). Auf dem Handy faellt die Buehne von selbst weg
         * und diese Sections laufen normal untereinander, siehe RotaryStage.
         *
         * Services und Ueber-mich-Folder fehlen hier bewusst: sie klappen auf
         * und aendern dabei ihre Hoehe. Auf einer Flaeche fester Hoehe waere
         * der aufgeklappte Inhalt abgeschnitten. Sie stehen deshalb unten,
         * ausserhalb der Buehne, im normalen Scrollfluss - das verschiebt
         * ihre Position gegenueber der linearen Seite, verliert aber keinen
         * Inhalt.
         */}
        <RotaryStage
          sides={12}
          axis="y"
          fill={0.42}
          mobileAxis="x"
          mobileFill={0.5}
          expandTo={0.93}
        >
          <Hero />
          <TrustBar />
          <CreatorEconomy />
          <CreatorComparison />
          <ArbeitsweiseSection />
          <GlobalReach />
          <ConsultationBooking />
          <FAQ />
        </RotaryStage>

        <FadeIn>
          <InteractiveFolder
            id="services"
            tab={f.services.tab}
            title={f.services.title}
            subtitle={f.services.subtitle}
            openLabel={f.services.openLabel}
            closeLabel={f.services.closeLabel}
          >
            <ServicesContent />
          </InteractiveFolder>
        </FadeIn>
        <FadeIn>
          <InteractiveFolder
            id="about"
            tab={f.about.tab}
            title={f.about.title}
            subtitle={f.about.subtitle}
            openLabel={f.about.openLabel}
            closeLabel={f.about.closeLabel}
          >
            <AboutContent />
          </InteractiveFolder>
        </FadeIn>
      </main>
      <Footer />
    </div>
  );
}
