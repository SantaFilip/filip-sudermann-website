import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import { setLenis } from '@/lib/lenisInstance';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Wer reduzierte Bewegung eingestellt hat, bekommt natives Scrollen.
    // scrollToSection faellt dann automatisch auf window.scrollTo zurueck.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33); // GSAP-Standardwerte
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}
