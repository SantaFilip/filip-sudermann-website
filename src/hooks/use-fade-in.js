import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Blendet das Element beim Reinscrollen ein. Gibt eine ref zurueck, die auf
 * das zu animierende Element gesetzt wird.
 */
export function useFadeIn({ y = 24, duration = 0.8, start = 'top 85%', delay = 0 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ohne Animation bleibt der Inhalt einfach sichtbar - niemals ausblenden,
    // sonst waere die Seite fuer diese Nutzer teilweise leer.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // gsap.from statt fromTo: der sichtbare Zustand steht im Markup, GSAP
    // blendet nur aus und wieder ein. Laeuft das JS nicht, ist alles da.
    const tween = gsap.from(el, {
      opacity: 0,
      y,
      duration,
      delay,
      ease: 'power2.out',
      // Inline-Styles nach der Animation entfernen, damit kein transform
      // als Stacking-Context zurueckbleibt.
      clearProps: 'opacity,transform',
      scrollTrigger: {
        trigger: el,
        start,
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [y, duration, start, delay]);

  return ref;
}
