import { getLenis } from './lenisInstance';

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = getLenis();
  if (lenis) {
    // Ueber Lenis scrollen, sonst kennt es die neue Position nicht und
    // zieht die Seite beim naechsten Frame wieder zurueck.
    // Ohne eigenen Offset: Lenis wertet scroll-padding-top (5rem, index.css)
    // selbst aus - ein zusaetzliches -80 wuerde den Abstand verdoppeln.
    lenis.scrollTo(el);
    return;
  }

  // window.scrollTo mit Koordinaten ignoriert scroll-padding, hier also
  // die 5rem von Hand abziehen.
  const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  html.style.scrollBehavior = prev;
}
