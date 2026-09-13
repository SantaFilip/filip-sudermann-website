import { getLenis } from './lenisInstance';

/**
 * Zielposition fuer eine Flaeche innerhalb einer RotaryStage berechnen.
 *
 * Die Flaechen liegen absolut positioniert uebereinander (jede dreht sich
 * per CSS-Transform an ihren Platz) - ihr eigenes offsetTop im Dokument ist
 * bedeutungslos, es sagt nichts darueber aus, wie weit man scrollen muss, um
 * sie nach vorn zu drehen. Die Buehne selbst ist aber ein normales
 * Fluss-Element mit echter Hoehe: ScrollTrigger mappt den Scrollfortschritt
 * linear von "root.top erreicht Viewport-Oberkante" (0) bis
 * "root.bottom erreicht Viewport-Unterkante" (1) auf die Drehung. Aus dieser
 * Formel laesst sich die Scrollposition fuer eine bestimmte Flaeche exakt
 * zurueckrechnen, ohne dass die Buehne selbst etwas exportieren muss.
 */
function rotaryTarget(el) {
  const root = el.closest('[data-rotary-root]');
  // data-rotary-index sitzt auf dem Panel, das die Flaeche traegt - nicht
  // auf el selbst. el ist typischerweise die Section mit der Ziel-ID, die
  // innerhalb dieses Panels liegt, nicht das Panel selbst.
  const panel = el.closest('[data-rotary-index]');
  if (!root || !panel) return null;

  const steps = Number(root.dataset.rotarySteps);
  const index = Number(panel.dataset.rotaryIndex);
  if (!steps || Number.isNaN(index)) return null;

  const rect = root.getBoundingClientRect();
  const rootTop = window.scrollY + rect.top;
  const rootHeight = root.offsetHeight;
  const viewportH = window.innerHeight;

  return rootTop + (index / steps) * (rootHeight - viewportH);
}

/**
 * Nach einem Sprung per Anker steht die Buehne zwar auf der richtigen
 * Flaeche, aber "ruht" (der Zustand, der eine breite Folie aufgehen laesst)
 * wird nur durch echte Nutzereingaben gesetzt - ein programmatischer Sprung
 * ist keine. Ein synthetisches wheel-Ereignis stoesst genau die gleiche
 * Pruefung an, die auch nach echtem Scrollen laeuft: liegt die Position
 * schon nahe an einer ganzen Flaeche, wird direkt "ruht" gesetzt, ohne
 * weiterzufahren.
 */
function stoseRuhepruefungAn() {
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const rotaryY = rotaryTarget(el);
  const lenis = getLenis();

  if (rotaryY !== null) {
    if (lenis) {
      lenis.scrollTo(rotaryY, { onComplete: stoseRuhepruefungAn });
    } else {
      window.scrollTo(0, rotaryY);
      stoseRuhepruefungAn();
    }
    return;
  }

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
