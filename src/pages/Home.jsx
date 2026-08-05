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
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const f = t.folders;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero bleibt bewusst ohne Fade: er ist beim Laden sofort sichtbar. */}
        <Hero />
        <FadeIn><TrustBar /></FadeIn>
        <FadeIn><CreatorEconomy /></FadeIn>
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
        <FadeIn><CreatorComparison /></FadeIn>
        <FadeIn><ArbeitsweiseSection /></FadeIn>
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
        <FadeIn><GlobalReach /></FadeIn>
        <FadeIn><ConsultationBooking /></FadeIn>
        <FadeIn><FAQ /></FadeIn>
      </main>
      <Footer />
    </div>
  );
}
