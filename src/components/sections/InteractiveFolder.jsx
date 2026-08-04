import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

export default function InteractiveFolder({ id, tab, title, subtitle, openLabel, closeLabel, children }) {
  const [open, setOpen] = useState(false);
  const [tabNum, ...tabRest] = tab.split(' / ');
  const tabName = tabRest.join(' / ');

  useEffect(() => {
    const checkHash = () => {
      if (id && window.location.hash === `#${id}`) {
        setOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [id]);

  return (
    <section id={id} className="border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.button
          onClick={() => setOpen(!open)}
          className="w-full text-left py-10 lg:py-16 flex items-start justify-between gap-6 group"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="flex-1">
            <div className="inline-flex flex-row items-center gap-4 border-2 border-accent rounded-xl px-6 py-3 mb-5 bg-card">
              <span className="text-[34px] lg:text-[40px] font-heading font-extrabold tracking-tight text-accent leading-tight -translate-y-1 lg:-translate-y-1.5">{tabNum}</span>
              <span className="text-[24px] lg:text-[34px] font-heading font-extrabold tracking-tight text-foreground leading-tight whitespace-nowrap">{tabName}</span>
            </div>
            <h2 className="text-[2.8rem] lg:text-[4.5rem] xl:text-[5.6rem] font-heading font-bold tracking-tight leading-[1.05]">{title}</h2>
            <p className="text-muted-foreground mt-4 max-w-xl text-base lg:text-lg">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0 mt-2">
            <span className="text-sm font-medium hidden sm:block text-muted-foreground group-hover:text-foreground transition-colors">
              {open ? closeLabel : openLabel}
            </span>
            <div className={`w-12 h-12 border rounded-lg flex items-center justify-center transition-colors ${open ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground border-border'}`}>
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span key="minus" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Minus size={20} />
                  </motion.span>
                ) : (
                  <motion.span key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Plus size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="pb-14 lg:pb-20 pt-2 border-t border-border">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
