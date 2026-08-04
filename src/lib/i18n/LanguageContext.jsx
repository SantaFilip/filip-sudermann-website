import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'de';
    return localStorage.getItem('filip_lang') || 'de';
  });
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    localStorage.setItem('filip_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setWiping(true);
    const next = lang === 'de' ? 'en' : 'de';
    const swapTimer = setTimeout(() => setLang(next), 280);
    const doneTimer = setTimeout(() => setWiping(false), 560);
    return () => { clearTimeout(swapTimer); clearTimeout(doneTimer); };
  }, [lang]);

  const t = translations[lang] || translations.de;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
      <AnimatePresence>
        {wiping && (
          <motion.div
            key="wipe-overlay"
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ backgroundColor: 'hsl(46 64% 52%)', transformOrigin: '0% 50%' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0] }}
            transition={{ duration: 0.56, times: [0, 0.35, 0.5, 1], ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
