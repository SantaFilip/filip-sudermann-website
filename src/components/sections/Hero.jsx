import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { IMAGES } from '@/lib/links';
import { Image } from '@/components/ui/image';
import { scrollToSection } from '@/lib/scrollToSection';
import BANNER_DE from '@/assets/images/banner-de.png';
import BANNER_EN from '@/assets/images/banner-en.png';

const NAVY = '#0B1930';
const GOLD = '#C8A13A';
const GOLD_LIGHT = '#D6B45C';
const CREAM = '#F8F4EC';

export default function Hero() {
  const { t, lang } = useLanguage();
  const bannerUrl = lang === 'de' ? BANNER_DE : BANNER_EN;

  return (
    <section
      id="top"
      className="relative pt-24 lg:pt-32 pb-8 lg:pb-12 overflow-hidden"
      style={{ background: CREAM }}
    >
      <div className="hidden lg:block absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full border border-dashed" style={{ borderColor: `${GOLD}33` }} />
        <div className="absolute top-1/2 -translate-y-1/2 -right-40 w-[340px] h-[340px] rounded-full border border-dashed" style={{ borderColor: `${GOLD}26` }} />
        <div className="absolute bottom-10 left-1/3 w-[260px] h-[260px] rounded-full border" style={{ borderColor: `${GOLD}1F` }} />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" fill="none">
          <line x1="0" y1="78%" x2="100%" y2="78%" stroke={GOLD} strokeWidth="0.6" opacity="0.25" />
          <line x1="0" y1="22%" x2="55%" y2="22%" stroke={GOLD_LIGHT} strokeWidth="0.5" opacity="0.2" />
        </svg>
      </div>

      <div className="w-full">
        <img src={bannerUrl} alt="With Systematic Growth — Scale your business" className="w-full h-auto block" />
      </div>
      <div className="relative max-w-[1500px] mx-auto px-8 lg:px-16 mt-8 lg:mt-12">
        <div className="hidden lg:grid lg:grid-cols-[48fr_52fr] gap-0 items-center" style={{ minHeight: '640px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="pr-12"
          >
            <h1
              className="font-display font-normal tracking-tight text-balance"
              style={{ color: NAVY, fontSize: '4rem', lineHeight: '1.04', maxWidth: '600px' }}
            >
              {t.hero.title}
            </h1>
            <p
              className="mt-8 font-body text-[1.05rem] leading-relaxed"
              style={{ color: '#46536A', maxWidth: '430px' }}
            >
              {t.hero.subtitle}
            </p>
            <div className="mt-10">
              <a
                href="#beratung"
                onClick={(e) => { e.preventDefault(); scrollToSection('beratung'); }}
                className="btn-fill relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium z-0"
                style={{ background: NAVY, color: '#FFFFFF' }}
              >
                {t.hero.cta1} <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="relative"
            style={{ height: '640px' }}
          >
            <div className="relative h-full w-full" style={{ maxWidth: '560px', marginLeft: 'auto', marginRight: '-20px' }}>
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div
                  className="absolute rounded-full border border-dashed"
                  style={{ top: '-40px', right: '-60px', width: '300px', height: '300px', borderColor: `${GOLD}40` }}
                />
                <div
                  className="absolute rounded-full border border-dashed"
                  style={{ bottom: '-50px', left: '-30px', width: '220px', height: '220px', borderColor: `${GOLD_LIGHT}33` }}
                />
              </div>

              <div
                className="relative overflow-hidden h-full w-full"
                style={{
                  borderRadius: '30px',
                  boxShadow: '0 40px 80px -32px rgba(11,25,48,0.35)',
                  transform: 'translateX(20px)',
                }}
              >
                <Image
                  src={IMAGES.heroPortrait}
                  alt="Filip Sudermann"
                  className="w-full h-full"
                  fittingType="fill"
                />
                <span className="absolute bottom-5 left-6 text-sm font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] z-10">
                  ~ Filip Sudermann, 2026
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:hidden grid grid-cols-1 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight leading-[1.05] text-balance">
              {t.hero.title}
            </h1>
            <p className="text-muted-foreground mt-6 text-lg max-w-xl leading-relaxed">{t.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a
                href="#beratung"
                onClick={(e) => { e.preventDefault(); scrollToSection('beratung'); }}
                className="btn-fill relative bg-foreground text-background px-7 py-3.5 text-sm font-medium z-0 flex items-center justify-center gap-2"
              >
                {t.hero.cta1} <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {/* aspect-square statt aspect-[4/5]: die Quelle (hero-portrait.jpg)
                ist selbst quadratisch (1024x1024). Ein 4:5-Rahmen (schmaler
                als das Quadrat) liess object-cover ca. 10% links/rechts
                wegschneiden - knapp genug, um den Laptop-Rand abzuschneiden.
                Mit exakt demselben Seitenverhaeltnis wie die Quelle croppt
                object-cover gar nicht mehr: Kopf und Laptop bleiben
                vollstaendig im Bild, unabhaengig vom umgebenden Layout
                (Handy-Vollbreite oder die schmale Rotunden-Facette, siehe
                index.css .rotary-face .lg\:hidden.grid). */}
            <div className="relative hero-portrait-box aspect-square bg-secondary overflow-hidden rounded-[30px]">
              <Image src={IMAGES.heroPortrait} alt="Filip Sudermann" className="w-full h-full" fittingType="fill" />
              <span className="absolute bottom-4 left-5 text-sm font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] z-10">
                ~ Filip Sudermann, 2026
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
