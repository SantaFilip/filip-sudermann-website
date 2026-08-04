import React from 'react';
import { Search, Target, Laptop, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const iconMap = { Search, Target, Laptop, TrendingUp };

const GOLD = '#C8A13A';
const GOLD_LIGHT = '#D6B45C';
const CHARCOAL = '#0B1930';

export function ProcessSteps() {
  const { t } = useLanguage();
  const steps = t.process.steps;

  return (
    <div className="relative">
      <div className="hidden lg:grid grid-cols-4 gap-0 relative">
        <div
          className="absolute top-[150px] left-[12.5%] right-[12.5%] h-px"
          style={{ background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_LIGHT})` }}
        />

        {steps.map((step, i) => {
          const Icon = iconMap[step.icon] || Search;
          return (
            <div key={i} className="relative flex flex-col items-center px-2">
              <span
                className="font-heading font-bold leading-none mb-3 select-none"
                style={{ fontSize: '5rem', color: CHARCOAL, opacity: 0.12, letterSpacing: '-0.04em' }}
              >
                {`${i + 1}.`}
              </span>

              <div
                className="w-3 h-3 rounded-full mb-4 z-10"
                style={{ background: GOLD, boxShadow: `0 0 0 4px hsl(var(--card))` }}
              />

              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'hsl(var(--card))', border: `1px solid ${GOLD}` }}
              >
                <Icon size={22} strokeWidth={1.6} style={{ color: GOLD }} />
              </div>

              <div
                className="rounded-2xl p-5 w-full"
                style={{ background: 'hsl(var(--card))', border: `1px solid ${GOLD_LIGHT}`, boxShadow: '0 10px 30px -12px rgba(29,34,42,0.18)' }}
              >
                <h3 className="font-heading font-semibold mb-2 text-center" style={{ color: CHARCOAL, fontSize: '1.575rem' }}>
                  {step.title}
                </h3>
                <p className="text-center leading-relaxed" style={{ color: CHARCOAL, opacity: 0.7, fontSize: '0.875rem' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lg:hidden flex flex-col max-w-md mx-auto">
        {steps.map((step, i) => {
          const Icon = iconMap[step.icon] || Search;
          const isLast = i === steps.length - 1;
          return (
            <div key={i} className="relative flex items-start gap-4 pb-8 last:pb-0">
              <div className="relative shrink-0 flex flex-col items-center self-stretch" style={{ width: '54px' }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center relative z-10 shrink-0"
                  style={{ background: 'hsl(var(--card))', border: `1px solid ${GOLD}` }}
                >
                  <Icon size={20} strokeWidth={1.6} style={{ color: GOLD }} />
                </div>
                {!isLast && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-px"
                    style={{ top: '60px', bottom: '-32px', background: `linear-gradient(${GOLD_LIGHT}, ${GOLD}, ${GOLD_LIGHT})` }}
                  />
                )}
                {isLast && (
                  <>
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-px"
                      style={{ top: '56px', bottom: '8px', background: `linear-gradient(${GOLD_LIGHT}, ${GOLD})` }}
                    />
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
                      <path d="M0 0 L6 8 L12 0 Z" fill={GOLD} />
                    </svg>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'hsl(var(--card))', border: `1px solid ${GOLD_LIGHT}`, boxShadow: '0 8px 24px -12px rgba(29,34,42,0.18)' }}
                >
                  <h3 className="font-heading font-semibold mb-1.5" style={{ color: CHARCOAL, fontSize: '1.5rem' }}>
                    {step.title}
                  </h3>
                  <p className="leading-relaxed" style={{ color: CHARCOAL, opacity: 0.7, fontSize: '0.85rem' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProcessSection() {
  const { t } = useLanguage();
  return (
    <section
      id="process"
      className="py-20 lg:py-32 relative overflow-hidden"
      style={{ background: '#F8F4EC' }}
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 600"
        fill="none"
      >
        <path d="M-50 180 Q 300 80 600 180 T 1250 180" stroke={GOLD} strokeWidth="1.2" />
        <path d="M-50 360 Q 300 260 600 360 T 1250 360" stroke={GOLD_LIGHT} strokeWidth="1" />
        <path d="M-50 520 Q 300 420 600 520 T 1250 520" stroke={GOLD} strokeWidth="1.2" />
      </svg>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative">
        <div className="mb-14 lg:mb-20 text-center max-w-2xl mx-auto">
          <span
            className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase mb-6"
            style={{ background: 'hsl(var(--card))', border: `1px solid ${GOLD_LIGHT}`, color: GOLD }}
          >
            3 | {t.arbeitsweise.badgeName}
          </span>
          <h2
            className="text-[2.8rem] lg:text-[4.5rem] font-heading font-bold tracking-tight"
            style={{ color: CHARCOAL }}
          >
            {t.process.title}
          </h2>
          <p className="mt-4 text-base lg:text-lg max-w-xl mx-auto" style={{ color: CHARCOAL, opacity: 0.6 }}>
            {t.process.subtitle}
          </p>
        </div>
        <ProcessSteps />
      </div>
    </section>
  );
}
