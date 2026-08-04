import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function CaseStudySection() {
  const { t } = useLanguage();
  const cs = t.caseStudy;
  const nr = t.nischenReferenz;

  return (
    <>
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 lg:p-12 mb-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-3">{cs.label}</p>
          <h3 className="text-xl lg:text-2xl font-heading font-bold text-foreground">{cs.subtitle}</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-8 lg:gap-10">
          <div className="text-center">
            <div className="inline-block bg-foreground text-background text-xs font-semibold tracking-widest uppercase px-4 py-1.5 mb-6">{cs.withoutTitle}</div>
            <div className="space-y-5">
              {cs.metrics.map((m) => (
                <div key={m.key}>
                  <span className="text-3xl lg:text-4xl font-heading font-bold">{cs.withoutData[m.key]}</span>
                  <span className="block text-xs text-muted-foreground uppercase tracking-wide mt-1">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center">
              <ArrowRight size={20} className="text-accent" />
            </div>
          </div>

          <div className="bg-foreground text-background rounded-xl p-8 text-center">
            <div className="inline-block bg-accent text-accent-foreground text-xs font-semibold tracking-widest uppercase px-4 py-1.5 mb-6">{cs.withTitle}</div>
            <div className="space-y-5">
              {cs.metrics.map((m) => (
                <div key={m.key}>
                  <span className="text-3xl lg:text-4xl font-heading font-bold text-accent">{cs.withData[m.key]}</span>
                  <span className="block text-xs text-background/60 uppercase tracking-wide mt-1">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-center mb-8">
          <h3 className="text-2xl lg:text-3xl font-heading font-bold tracking-tight">{nr.title}</h3>
          <p className="text-muted-foreground mt-2">{nr.subtitle}</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-foreground/20">
          <table className="w-full table-fixed text-xs sm:text-sm">
            <colgroup>
              <col className="w-[28%] sm:w-[34%]" />
              <col className="w-[16%] sm:w-[18%]" />
              <col className="w-[28%] sm:w-[24%]" />
              <col className="w-[28%] sm:w-[24%]" />
            </colgroup>
            <thead>
              <tr className="bg-foreground text-background">
                <th className="text-left px-1.5 py-2 sm:px-4 lg:px-6 lg:py-4 font-semibold">{nr.columns.nische}</th>
                <th className="text-left px-0.5 py-2 sm:px-4 lg:px-6 lg:py-4 font-semibold">{nr.columns.potenzial}</th>
                <th className="text-left px-1.5 py-2 sm:px-4 lg:px-6 lg:py-4 font-semibold whitespace-nowrap">{nr.columns.lt}</th>
                <th className="text-left px-1.5 py-2 sm:px-4 lg:px-6 lg:py-4 font-semibold whitespace-nowrap">{nr.columns.ht}</th>
              </tr>
            </thead>
            <tbody>
              {nr.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-foreground' : 'bg-foreground/85'}>
                  <td className="px-1.5 py-2 sm:px-4 lg:px-6 lg:py-3 text-background"><span className="mr-1 sm:mr-2">{row.emoji}</span>{row.nische}</td>
                  <td className="px-0.5 py-2 sm:px-4 lg:px-6 lg:py-3">
                    <div className="flex gap-0 justify-center sm:justify-start">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} size={9} className={s < row.stars ? 'fill-accent text-accent' : 'text-background/30'} />
                      ))}
                    </div>
                  </td>
                  <td className="px-1.5 py-2 sm:px-4 lg:px-6 lg:py-3 text-background font-medium whitespace-nowrap">{row.lt}</td>
                  <td className="px-1.5 py-2 sm:px-4 lg:px-6 lg:py-3 text-background font-medium whitespace-nowrap">{row.ht}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
