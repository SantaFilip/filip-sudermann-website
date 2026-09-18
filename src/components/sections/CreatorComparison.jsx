import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Check } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import CaseStudySection from '@/components/sections/CaseStudySection';

export default function CreatorComparison() {
  const { t } = useLanguage();
  const c = t.creatorComparison;
  const [konkretOpen, setKonkretOpen] = useState(false);

  return (
    <section id="results" className="py-20 lg:py-28 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <div className="inline-flex flex-row items-center gap-4 border-2 border-accent rounded-xl px-6 py-3 mb-2 bg-card">
            <span className="text-[34px] lg:text-[40px] font-heading font-extrabold tracking-tight text-accent leading-tight -translate-y-1 lg:-translate-y-1.5">3</span>
            <span className="text-[28px] lg:text-[34px] font-heading font-extrabold tracking-tight text-foreground leading-tight">{c.marktwortBadge}</span>
          </div>
          <h2 className="text-[2.8rem] lg:text-[4.5rem] font-heading font-bold tracking-tight leading-[1.05] text-balance">{c.title}</h2>
          <p className="text-muted-foreground mt-2 max-w-xl text-base lg:text-lg">{c.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-4 lg:gap-6">
          <div className="border rounded-xl p-5 lg:p-9 flex flex-col bg-white" style={{ borderColor: '#d1d1d1' }}>
            <p className="text-base font-bold tracking-widest uppercase mb-5" style={{ color: '#5e5e5e' }}>{c.leftTitle}</p>
            <ul className="space-y-4 flex-1">
              {c.leftItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: '#d1d1d1' }}>
                    <X size={13} className="text-muted-foreground" />
                  </div>
                  <span className="text-base lg:text-xl font-semibold text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 pt-5 border-t" style={{ borderColor: '#d1d1d1' }}>
              <p className="text-base lg:text-lg font-bold" style={{ color: '#5e5e5e' }}>{c.leftFooter}</p>
            </div>
          </div>

          <div className="flex items-center justify-center py-1 lg:py-0">
            <ArrowRight size={28} className="text-accent rotate-90 lg:rotate-0" />
          </div>

          <div className="border-2 rounded-xl p-5 lg:p-9 flex flex-col" style={{ borderColor: '#C5A566', background: '#F7F4EF' }}>
            <p className="text-base font-bold tracking-widest uppercase mb-5" style={{ color: '#B8A375' }}>{c.rightTitle}</p>
            <ul className="space-y-4 flex-1">
              {c.rightItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#C5A566' }}>
                    <Check size={13} className="text-white" />
                  </div>
                  <span className="text-base lg:text-xl font-medium" style={{ color: '#1a1a1a' }}>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 pt-5 border-t" style={{ borderColor: '#C5A56655' }}>
              <p className="text-base lg:text-lg font-bold" style={{ color: '#B8A375' }}>{c.rightFooter}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10 konkret-toggle">
          <motion.button
            onClick={() => setKonkretOpen(!konkretOpen)}
            className="flex items-center gap-3 shrink-0 group"
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="inline-flex items-center gap-3 border-2 border-accent rounded-xl px-5 py-3 bg-foreground">
              <span className="text-base lg:text-lg font-heading font-extrabold tracking-tight text-background whitespace-nowrap">{c.konkretLabel}</span>
              <span className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${konkretOpen ? 'bg-accent text-foreground' : 'text-background border border-background/30'}`}>
                {konkretOpen ? c.closeLabel : c.openLabel}
              </span>
            </div>
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {konkretOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="pt-14">
                <CaseStudySection />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
