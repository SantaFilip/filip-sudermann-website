import React, { Suspense, lazy, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useInDerNaehe } from '@/hooks/use-in-der-naehe';

// three.js ist das schwerste Paket der Seite - erst laden, wenn der Globus
// in die Naehe des Bildschirms kommt, nicht schon beim Seitenstart.
const Earth3D = lazy(() => import('@/components/sections/Earth3D'));

export default function GlobalReach() {
  const { t, lang } = useLanguage();
  const globusRef = useRef(null);
  const globusNah = useInDerNaehe(globusRef);

  return (
    // overflow-hidden: nichts aus dieser Sektion darf ueber den Bildschirmrand
    // ragen - auf dem Handy wuerde die Seite sonst seitlich scrollbar.
    <section id="global-reach" className="overflow-hidden py-20 lg:py-32 bg-card/30 border-t border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-[2.8rem] lg:text-[4.5rem] xl:text-[5.6rem] font-heading font-bold tracking-tight leading-[1.05]">
              {t.globalReach.titlePre}
              <span className="font-display italic text-accent font-normal">{t.globalReach.titleAccent}</span>
            </h2>
            <p className="text-muted-foreground mt-6 text-lg max-w-lg leading-relaxed">{t.globalReach.subtitle}</p>
            <div className="inline-flex items-center gap-2 mt-8 bg-background border border-border px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-accent glow-node" />
              <span className="text-xs font-mono tracking-widest text-foreground font-bold">{lang === 'de' ? 'Standort' : 'Location'}: {t.globalReach.badgeCountry}</span>
            </div>
          </div>
          {/* globe-frame: im Vollbild-Portal der Rolle wird die Kugel groesser
              gesetzt (siehe index.css). Dort steht die halbe Bildschirmbreite
              zur Verfuegung, auf 28rem gedeckelt wirkte sie daneben verloren. */}
          <div className="globe-frame relative w-full max-w-md mx-auto aspect-square">
            {/* Hier lag eine "Glut": ein radialer Verlauf in Gold und
                Nachtblau, weichgezeichnet und ueber die Box hinausgezogen.
                Auf dem cremefarbenen Grund las er als grauer Schatten rund
                um die Kugel. Ersatzlos gestrichen - der Bereich neben dem
                Globus hat jetzt exakt die Farbe des uebrigen Hintergrunds.
                Den Koerper gibt ihm stattdessen die Randaufhellung INNEN
                an der Kugel selbst (siehe Earth3D.jsx). */}
            <div ref={globusRef} className="relative w-full h-full overflow-hidden">
              {globusNah && (
                <Suspense fallback={null}>
                  <Earth3D />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
