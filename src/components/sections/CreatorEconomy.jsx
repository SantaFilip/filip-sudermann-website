import React, { Suspense, lazy, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useInDerNaehe } from '@/hooks/use-in-der-naehe';

// recharts ist gross und wird nur fuer dieses eine Diagramm gebraucht: eigenes
// Paket, nachgeladen. Die Box hat eine feste Hoehe, es springt also nichts.
const CreatorEconomyChart = lazy(() => import('@/components/sections/CreatorEconomyChart'));

export default function CreatorEconomy() {
  const { t } = useLanguage();
  const diagrammRef = useRef(null);
  const diagrammNah = useInDerNaehe(diagrammRef);

  return (
    <section id="creator-economy" className="py-20 lg:py-32 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mb-12">
          <h2 className="text-[2.8rem] lg:text-[4.5rem] font-heading font-bold tracking-tight leading-[1.1]">
            {t.creatorEconomy.titlePre}{' '}
            <span className="font-display italic text-accent font-normal">{t.creatorEconomy.titleAccent}</span>
          </h2>
          <p className="text-muted-foreground mt-5 text-lg max-w-2xl leading-relaxed">{t.creatorEconomy.subtitle}</p>
        </div>

        <div className="bg-card border-2 border-foreground rounded-2xl p-4 sm:p-6 lg:p-10">
          <div className="flex items-center justify-between mb-6">
            <p className="text-2xl tracking-wide text-foreground font-bold" style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>{t.creatorEconomy.chartTitle}</p>
          </div>
          <div ref={diagrammRef} className="w-full h-[340px] lg:h-[400px]">
            {diagrammNah && (
              <Suspense fallback={null}>
                <CreatorEconomyChart yLabel={t.creatorEconomy.yLabel} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
