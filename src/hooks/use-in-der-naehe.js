import { useEffect, useState } from 'react';

/**
 * true, sobald das Element auf `abstand` Pixel an den Bildschirm herankommt -
 * und bleibt dann true. Fuer schwere Inhalte, die erst geladen werden sollen,
 * wenn sie gleich gebraucht werden.
 */
export function useInDerNaehe(ref, abstand = 600) {
  const [nah, setNah] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || nah) return undefined;
    const beobachter = new IntersectionObserver(
      ([eintrag]) => { if (eintrag.isIntersecting) setNah(true); },
      { rootMargin: `${abstand}px 0px` },
    );
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, [ref, nah, abstand]);
  return nah;
}
