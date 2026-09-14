import { getLenis } from './lenisInstance';

/**
 * Ankerlink auf eine Flaeche innerhalb einer RotaryStage.
 *
 * Die Buehne dreht sich von selbst und haengt nicht mehr am Scroll-
 * Fortschritt - ein Sprung auf ihre Section bedeutet deshalb nicht mehr
 * "an eine bestimmte Scrollposition fahren", sondern "die Buehne ins Bild
 * holen und die passende Flaeche oeffnen". Ausgeloest ueber ein eigenes
 * 'rotary-open'-Event auf der Flaeche (siehe RotaryStage.jsx) - nicht per
 * synthetischem 'click' auf dem Overlay: der reagiert seit dem Ziehen-Feature
 * nur noch auf Pointer-Events (pointerdown/-move/-up), ein 'click' dort loest
 * nichts mehr aus.
 */
function tryRotaryExpand(el) {
  const panel = el.closest('[data-rotary-index]');
  if (!panel) return false;
  const root = panel.closest('[data-rotary-root]');
  if (!root) return false;

  const lenis = getLenis();
  const HEADER_OFFSET = 80;
  const y = window.scrollY + root.getBoundingClientRect().top - HEADER_OFFSET;
  if (lenis) {
    lenis.scrollTo(y);
  } else {
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // Schon offen? Dann nur hinscrollen, nicht per Klick wieder schliessen.
  const closeBtn = panel.querySelector('[data-rotary-close]');
  const schonOffen = closeBtn && getComputedStyle(closeBtn).visibility === 'visible';
  if (!schonOffen) {
    panel.dispatchEvent(new CustomEvent('rotary-open'));
  }

  return true;
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (tryRotaryExpand(el)) return;

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
