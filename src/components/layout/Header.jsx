import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Link } from 'react-router-dom';
import { scrollToSection } from '@/lib/scrollToSection';

export default function Header() {
  const { t, lang, toggleLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reihenfolge folgt der Nummerierung der Badges (1 Wachstumssystem, 2 Info
  // zum Gruender, 3 Marktvorteil, 4 Arbeitsweise, 5 Kontakt, 6 FAQ).
  const navItems = [
    { label: t.nav.services, href: '#services' },
    { label: t.nav.about, href: '#about' },
    { label: t.nav.results, href: '#results' },
    { label: t.nav.process, href: '#process' },
    { label: t.nav.contact, href: '#beratung' },
    { label: t.nav.faq, href: '#faq' },
  ];

  const handleNav = (e, href) => {
    e.preventDefault();
    scrollToSection(href.replace('#', ''));
    setMobileOpen(false);
  };

  const LangToggle = () => (
    <div className="flex items-center border border-border bg-card/50 rounded-full">
      <button
        onClick={() => lang !== 'de' && toggleLang()}
        className="relative px-2.5 py-1 text-xs font-semibold tracking-wide"
        aria-label="Deutsch"
      >
        {lang === 'de' && (
          <motion.div
            layoutId="lang-indicator"
            className="absolute inset-0 bg-foreground"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <span className={`relative z-10 transition-colors ${lang === 'de' ? 'text-background' : 'text-muted-foreground'}`}>DE</span>
      </button>
      <button
        onClick={() => lang !== 'en' && toggleLang()}
        className="relative px-2.5 py-1 text-xs font-semibold tracking-wide"
        aria-label="English"
      >
        {lang === 'en' && (
          <motion.div
            layoutId="lang-indicator"
            className="absolute inset-0 bg-foreground"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <span className={`relative z-10 transition-colors ${lang === 'en' ? 'text-background' : 'text-muted-foreground'}`}>EN</span>
      </button>
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/60 transition-shadow duration-300">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-16 flex items-center justify-between h-16 lg:h-20">
        <a href="#about" onClick={(e) => handleNav(e, '#about')} className={`font-heading font-bold tracking-tight transition-all duration-300 ${scrolled ? 'text-base' : 'text-lg'}`}>
          Filip Sudermann
        </a>
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => handleNav(e, item.href)} className="text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 lg:gap-4 shrink-0">
          <LangToggle />
          <Link to="/inspiration-hub" className="hidden xl:inline-flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors">
            {t.nav.inspirationHub} <ArrowUpRight size={14} />
          </Link>
          <a href="#beratung" onClick={(e) => handleNav(e, '#beratung')} className="hidden sm:inline-block btn-fill relative bg-foreground text-white px-5 py-2.5 text-sm font-medium z-0">
            {t.nav.cta}
          </a>
          <button className="lg:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-border bg-background"
          >
            <nav className="flex flex-col px-6 py-4 gap-4">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={(e) => handleNav(e, item.href)} className="text-sm text-muted-foreground hover:text-foreground">
                  {item.label}
                </a>
              ))}
              <Link to="/inspiration-hub" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
                {t.nav.inspirationHub}
              </Link>
              <a href="#beratung" onClick={(e) => handleNav(e, '#beratung')} className="btn-fill relative bg-foreground text-background px-5 py-2.5 text-sm font-medium text-center z-0">
                {t.nav.cta}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
