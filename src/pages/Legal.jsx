import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Legal({ doc }) {
  const { t, lang, toggleLang } = useLanguage();
  const content = t.legal[doc];

  if (!content) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
          <Link to="/" className="font-heading font-bold tracking-tight">Filip Sudermann</Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border">
              <button
                onClick={() => lang !== 'de' && toggleLang()}
                className="relative px-2.5 py-1 text-xs font-semibold"
                aria-label="Deutsch"
              >
                {lang === 'de' && <motion.div layoutId="lang-indicator-legal" className="absolute inset-0 bg-foreground" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <span className={`relative z-10 transition-colors ${lang === 'de' ? 'text-background' : 'text-muted-foreground'}`}>DE</span>
              </button>
              <button
                onClick={() => lang !== 'en' && toggleLang()}
                className="relative px-2.5 py-1 text-xs font-semibold"
                aria-label="English"
              >
                {lang === 'en' && <motion.div layoutId="lang-indicator-legal" className="absolute inset-0 bg-foreground" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <span className={`relative z-10 transition-colors ${lang === 'en' ? 'text-background' : 'text-muted-foreground'}`}>EN</span>
              </button>
            </div>
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> <span className="hidden sm:inline">{t.legal.backHome}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <p className="text-xs font-mono tracking-widest text-accent uppercase mb-3">{content.subtitle}</p>
        <h1 className="text-3xl lg:text-5xl font-heading font-bold tracking-tight mb-12">{content.title}</h1>

        <div className="space-y-10">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="font-heading font-semibold text-lg mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-[15px]">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground italic leading-relaxed">{t.legal.disclaimer}</p>
        </div>

        <div className="mt-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors">
            <ArrowLeft size={16} /> {t.legal.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
