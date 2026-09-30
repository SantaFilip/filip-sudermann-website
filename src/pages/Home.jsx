import React, { useState, useEffect } from 'react';
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

// Die Rolle zeigte leere Flaechen, verursacht durch einen Float-Vergleich
// (d !== 0 statt i !== vorne) in RotaryStage - siehe dortiger Commit. Per
// Playwright im Production-Build reproduziert, behoben und verifiziert
// (kompletter Scroll-Durchlauf ohne leere Flaeche), zusaetzlich live vom
// Nutzer bestaetigt. Der Schalter bleibt als Fallback stehen, falls
// spaeter doch noch ein Rand-fall auftaucht.
const ROLLE_STANDARD = true;

function OnePager({ f }) {
  return (
    <>
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
      <FadeIn><CreatorComparison /></FadeIn>
      <FadeIn><ArbeitsweiseSection /></FadeIn>
      <FadeIn><GlobalReach /></FadeIn>
      <FadeIn><ConsultationBooking /></FadeIn>
      <FadeIn><FAQ /></FadeIn>
    </>
  );
}

function Rolle({ f }) {
  return (
    <>
      <RotaryStage
        axis="y"
        fill={0.42}
        mobileAxis="x"
        mobileFill={0.5}
        expandTo={0.93}
        crossFill={0.6}
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
    </>
  );
}

// Muss zu MOBILE_MAX in RotaryStage passen: dort faellt die Rolle auf dem
// Handy ohnehin auf einen flachen Stapel zurueck - dann gehoeren 1 / Growth
// System und 2 / Founder Info an ihren chronologischen Platz vor die 3 statt
// ans Seitenende.
const MOBILE_QUERY = '(max-width: 767px)';

function useMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return mobile;
}

export default function Home() {
  const { t } = useLanguage();
  const f = t.folders;
  const mobile = useMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{mobile ? <OnePager f={f} /> : <Rolle f={f} />}</main>
      <Footer />
    </div>
  );
}
