import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ui/use-toast';

// Calendly controls the widget language via each event type's language setting
// (not URL params). To serve both DE and EN, use a separate event type per language.
// Vorerst laufen beide Sprachen bewusst auf den deutschen Event-Type
// (/erstgesprach) - englische Besucher sehen also ein deutsches Widget.
// Sobald ein englischer Event-Type steht, hier 'en' wieder darauf umstellen.
const CALENDLY_URLS = {
  de: 'https://calendly.com/filipsudermann-info/erstgesprach',
  en: 'https://calendly.com/filipsudermann-info/erstgesprach',
};
const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';

export default function ConsultationBooking() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const url = CALENDLY_URLS[lang] || CALENDLY_URLS.en;
    const init = () => {
      if (!window.Calendly || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      window.Calendly.initInlineWidget({
        url,
        parentElement: containerRef.current,
      });
    };

    if (window.Calendly) {
      init();
      return;
    }

    let script = document.querySelector(`script[src="${CALENDLY_SCRIPT}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = CALENDLY_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => script.removeEventListener('load', init);
  }, [lang]);

  // Listen for Calendly booking events. Calendly itself already emails you a
  // confirmation on every booking, so no extra notification call is needed here.
  useEffect(() => {
    const handler = (e) => {
      const data = e.data;
      if (data && typeof data === 'object' && data.event === 'calendly.event_scheduled') {
        setDone(true);
        toast({ title: lang === 'de' ? 'Termin gebucht!' : 'Meeting booked!' });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [lang]);

  const dismiss = () => setDone(false);

  useEffect(() => {
    if (!done) return;
    const resetTimer = setTimeout(() => setDone(false), 3000);
    return () => clearTimeout(resetTimer);
  }, [done]);

  return (
    <section id="beratung" className="py-20 lg:py-32 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-12 lg:mb-16">
          <div className="inline-flex flex-row items-center gap-4 border-2 border-accent rounded-xl px-6 py-3 mb-5 bg-card">
            <span className="text-[34px] lg:text-[40px] font-heading font-extrabold tracking-tight text-accent leading-tight -translate-y-1 lg:-translate-y-1.5">{t.booking.title.split(' ')[0]}</span>
            <span className="text-[28px] lg:text-[34px] font-heading font-extrabold tracking-tight text-foreground leading-tight">{t.booking.title.split(' ').slice(1).join(' ')}</span>
          </div>
          <p className="text-muted-foreground max-w-xl leading-relaxed">{t.booking.subtitle}</p>
        </div>

        <AnimatePresence>
          {done && (
            <motion.button
              type="button"
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onClick={dismiss}
              className="bg-card border border-accent p-6 flex items-center gap-4 w-full text-left cursor-pointer hover:border-foreground transition-colors mb-6"
            >
              <div className="w-10 h-10 bg-accent flex items-center justify-center shrink-0">
                <Check size={18} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{t.booking.successTitle}</p>
                <p className="text-sm text-muted-foreground">{t.booking.successBody}</p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full border border-border shrink-0">
                <X size={16} className="text-muted-foreground" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="bg-card border border-border p-2">
          <div ref={containerRef} style={{ minWidth: '320px', height: '680px' }} />
        </div>
      </div>
    </section>
  );
}
