import { getLenis } from './lenisInstance';

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const lenis = getLenis();
  if (lenis) {
    // Ueber Lenis scrollen, sonst kennt es die neue Position nicht und
    // zieht die Seite beim naechsten Frame wieder zurueck.
    //
    // Bewusst die offsetTop-Kette statt getBoundingClientRect: Sections, die
    // noch nicht eingeblendet sind, tragen den translateY des Fade-ins. Der
    // steckt in getBoundingClientRect mit drin, und das Ziel laege dann um
    // genau diesen Versatz daneben. offsetTop kennt nur die Layout-Position
    // und ist von Transforms unabhaengig.
    let y = 0;
    for (let node = el; node; node = node.offsetParent) y += node.offsetTop;
    lenis.scrollTo(y - 80);
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
