import { useEffect } from 'react';
import 'lenis/dist/lenis.css';
import { setLenis } from '@/lib/lenisInstance';

// Lenis glaettet nur das Mausrad - Touch scrollt ohnehin nativ. Handys laden
// Lenis und GSAP deshalb gar nicht erst; auf Geraeten mit Maus kommen beide
// als eigenes Paket nach.
const MIT_MAUS = '(hover: hover) and (pointer: fine)';

export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Wer reduzierte Bewegung eingestellt hat, bekommt natives Scrollen.
    // scrollToSection faellt dann automatisch auf window.scrollTo zurueck.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!window.matchMedia(MIT_MAUS).matches) return undefined;

    let abgebrochen = false;
    let aufraeumen = null;

    Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: Lenis }, { default: gsap }, { ScrollTrigger }]) => {
        if (abgebrochen) return;
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
          duration: 1.1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });
        setLenis(lenis);

        // ScrollTrigger rechnet sonst mit dem nativen Scroll-Offset und laeuft
        // dem von Lenis animierten Wert hinterher.
        lenis.on('scroll', ScrollTrigger.update);

        // Lenis an den GSAP-Ticker haengen statt an ein eigenes requestAnimationFrame:
        // eine Schleife statt zwei, dadurch keine Frame-Versaetze zwischen beiden.
        const raf = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        // GSAPs Lag-Smoothing wuerde bei Frame-Einbruechen die Zeit anhalten und
        // Lenis damit aus dem Tritt bringen.
        gsap.ticker.lagSmoothing(0);

        ScrollTrigger.refresh();

        aufraeumen = () => {
          gsap.ticker.remove(raf);
          gsap.ticker.lagSmoothing(500, 33); // GSAP-Standardwerte
          lenis.destroy();
          setLenis(null);
        };
      },
    );

    return () => {
      abgebrochen = true;
      aufraeumen?.();
    };
  }, []);

  return <>{children}</>;
}
