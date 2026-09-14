import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ProcessSteps } from '@/components/sections/ProcessSection';
import { ProfitShareCharts } from '@/components/sections/ProfitShare';

const OLIVE = '#7A854C';

export default function ArbeitsweiseSection() {
  const { t } = useLanguage();
  const p = t.profitShare;
  const a = t.arbeitsweise;

  return (
    <section id="process" className="py-20 lg:py-28 border-t border-border bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <div className="inline-flex flex-row items-center gap-4 border-2 border-accent rounded-xl px-6 py-3 mb-5 bg-card">
            <span className="text-[34px] lg:text-[40px] font-heading font-extrabold tracking-tight text-accent leading-tight -translate-y-1 lg:-translate-y-1.5">4</span>
            <span className="text-[28px] lg:text-[34px] font-heading font-extrabold tracking-tight text-foreground leading-tight">{a.badgeName}</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-heading font-bold tracking-tight">{t.process.title}</h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">{t.process.subtitle}</p>
        </div>

        <ProcessSteps />

        <div className="mt-24">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h3 className="text-2xl lg:text-4xl font-heading font-bold tracking-tight text-foreground text-balance">
              {p.titlePre}
              <span style={{ color: OLIVE }}>{p.titleAccent}</span>
              {p.titleSuffix}
            </h3>
          </div>
          <ProfitShareCharts />
        </div>
      </div>
    </section>
  );
}
