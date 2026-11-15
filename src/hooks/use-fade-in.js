import { useEffect, useRef } from 'react';

// Entspricht GSAPs 'power2.out', mit dem die Sections bisher eingeblendet wurden.
const POWER2_OUT = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

/** 'top 85%' (ScrollTrigger-Schreibweise) -> rootMargin fuer den IntersectionObserver. */
function zuRootMargin(start) {
  const prozent = Number(/top\s+(\d+)%/.exec(start)?.[1] ?? 85);
  return `0px 0px -${100 - prozent}% 0px`;
}

/**
 * Blendet das Element beim Reinscrollen ein. Gibt eine ref zurueck, die auf
 * das zu animierende Element gesetzt wird.
 *
 * Bewusst ohne GSAP: IntersectionObserver plus die Animations-API des
 * Browsers leisten dasselbe, und GSAP muss dadurch auf dem Handy gar nicht
 * erst geladen werden.
 */
export function useFadeIn({ y = 24, duration = 0.8, start = 'top 85%', delay = 0 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Ohne Animation bleibt der Inhalt einfach sichtbar - niemals ausblenden,
    // sonst waere die Seite fuer diese Nutzer teilweise leer.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!('IntersectionObserver' in window) || !el.animate) return undefined;

    // Der sichtbare Zustand steht im Markup; ausgeblendet wird nur per
    // Inline-Style, und der verschwindet nach der Animation wieder - kein
    // transform bleibt als Stacking-Context zurueck.
    el.style.opacity = '0';
    el.style.transform = `translateY(${y}px)`;
    let animation = null;

    const beobachter = new IntersectionObserver(
      ([eintrag]) => {
        // Schon oberhalb des Bildschirms (z.B. nach einem Sprung ueber die
        // Kopfleiste): sofort sichtbar, ohne Animation - sonst bliebe die
        // Section leer, bis man zurueckscrollt.
        if (!eintrag.isIntersecting && eintrag.boundingClientRect.bottom < 0) {
          beobachter.disconnect();
          el.style.opacity = '';
          el.style.transform = '';
          return;
        }
        if (!eintrag.isIntersecting) return;
        beobachter.disconnect();
        animation = el.animate(
          [
            { opacity: 0, transform: `translateY(${y}px)` },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: duration * 1000, delay: delay * 1000, easing: POWER2_OUT, fill: 'backwards' },
        );
        el.style.opacity = '';
        el.style.transform = '';
      },
      { rootMargin: zuRootMargin(start) },
    );
    beobachter.observe(el);

    return () => {
      beobachter.disconnect();
      animation?.cancel();
      el.style.opacity = '';
      el.style.transform = '';
    };
  }, [y, duration, start, delay]);

  return ref;
}
