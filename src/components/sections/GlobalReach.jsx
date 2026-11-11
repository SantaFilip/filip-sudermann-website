import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Earth3D from '@/components/sections/Earth3D';

export default function GlobalReach() {
  const { t, lang } = useLanguage();

  return (
    // overflow-hidden: der Glow hinter dem Globus ragt ueber seine Box
    // hinaus - auf dem Handy sonst ueber den Bildschirmrand, die Seite
    // wuerde seitlich scrollbar.
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
            {/* Glut hinter dem Globus: ohne sie verliert sich die Kugel vor dem
                hellen Seitenhintergrund, mit ihr liest sie als leuchtender
                Koerper statt als flaches Foto. */}
            {/* inset-[-18%] mit blur-3xl legte einen Hof von fast einem
                Fuenftel Durchmesser um die Kugel - auf dem grossen Globus im
                Portal ein grauer Schleier, der weit in die Flaeche
                hineinlief. Eng und schwaecher: die Glut soll die Kugel vom
                hellen Grund abheben, nicht selbst als Scheibe lesen. */}
            <div
              className="pointer-events-none absolute inset-[-5%] rounded-full blur-2xl"
              style={{
                background:
                  'radial-gradient(circle, hsl(var(--accent) / 0.22) 0%, hsl(var(--primary) / 0.1) 46%, transparent 66%)',
              }}
            />
            <div className="relative w-full h-full overflow-hidden">
              <Earth3D />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
