import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X } from 'lucide-react';
import RotatingBackdrop from '@/components/lab/RotatingBackdrop';
import FaceOrnament from '@/components/lab/FaceOrnament';
import FadeIn from '@/components/FadeIn';

gsap.registerPlugin(ScrollTrigger);

// Anteil der Buehnenhoehe, den der Wuerfel einnimmt.
//
// Handy: eine Seite ist ein Bildschirmsegment, also volle Hoehe. Auf einem
// kleinen Display ist jeder Pixel Rand verschenkter Platz, und die Silhouette
// des Koerpers zeigt sich beim Drehen ohnehin.
//
// Desktop: knapp darunter, damit die Kanten des Koerpers sichtbar bleiben -
// fuellt er den Viewport exakt aus, wirkt er wieder wie eine flache Seite.
const CUBE_FILL_MOBILE = 1;
// Bewusst Luft lassen: der Teich soll als Rand um den Koerper sichtbar sein
// und die Eckverzierungen duerfen nicht am Bildschirmrand kleben. Voll
// ausgefuellt waere beides unsichtbar.
const CUBE_FILL_DESKTOP = 0.86;
// Seitlicher Rand auf dem Desktop, damit der Koerper wie ein Buch auf dem
// Wasser liegt statt bildschirmbreit anzustossen.
const CUBE_WIDTH_DESKTOP = 0.93;
const MOBILE_MAX = 767;

// Hochskalieren ist keine Option: der Inhalt liegt bereits auf voller
// Flaechenbreite, ein Faktor ueber 1 schiebt ihn seitlich aus der Flaeche
// heraus und die Kanten werden abgeschnitten. Die Flaeche wird stattdessen
// ueber die CSS-Regeln in index.css gefuellt, die dem Inhalt die ueberfluessige
// Hoehe nehmen.
const MAX_SCALE = 1;

// Ab diesem Winkel zur Blickrichtung liegt eine Flaeche hinter der Kante und
// wird nicht mehr gezeichnet. Knapp ueber 90 Grad, damit sie nicht schon
// verschwindet, waehrend ihre Kante noch sichtbar ist.
const CULL_DEG = 92;

// Wie weit die aufgegangene Frontflaeche aus dem Koerper heraustritt.
//
// Bei einem geschlossenen Vielflaechner stoesst die Nachbarflaeche mit ihrer
// vorderen Kante genau auf z = 0 - dieselbe Ebene, auf der die Frontflaeche
// liegt. Verbreitert man sie dort, ragt sie in den Raum der Nachbarn und der
// Compositor schneidet beide pixelweise ineinander: die breite Folie wird in
// Streifen zerlegt. Ein kleiner Versatz nach vorn reicht, damit sie
// vollstaendig vor jedem Punkt der Nachbarn liegt.
const EXPAND_LIFT = 60;

// Bis zu diesem Anteil des Scrollwegs, den der Nutzer ueber die Buehne hinweg
// zurueckgelegt hat, bleibt der Teich unveraendert stehen, danach laeuft er
// in den Grundton der Webseite ueber.
const TEICH_HAELT = 0.35;

// Eigengeschwindigkeit der Drehung, in Grad pro Sekunde - unabhaengig von der
// Seitenzahl, damit Wuerfel und Rolle optisch gleich "langsam" wirken, obwohl
// ihre Flaechen unterschiedlich weit auseinander liegen (90 Grad gegen 30).
const AUTOPLAY_DEG_PER_SEC = 3;

// Geschwindigkeit der Fahrt zu einer angeklickten Flaeche - schneller als die
// Eigendrehung, damit ein Klick sich reaktionsschnell anfuehlt, aber weit
// genug entfernte Flaechen trotzdem nicht ruckartig heranspringen.
const SEEK_DEG_PER_SEC = 220;
const SEEK_MIN_DURATION = 0.35;
const SEEK_MAX_DURATION = 1.4;

// Ziehen dreht den Koerper direkt unter dem Zeiger. Unterhalb dieser
// Wegstrecke gilt eine Beruehrung noch als Klick (oeffnet die Flaeche) -
// darueber als Ziehen (dreht). Ohne Schwelle wuerde jeder Klick durch das
// unvermeidliche Zittern der Maus/des Fingers schon als Drehversuch zaehlen.
const DRAG_THRESHOLD_PX = 6;
// Wie viele Grad Drehung ein Pixel Zeigerbewegung ausmacht - die "Griffigkeit"
// des Ziehens. Zu hoch, und die Flaeche schiesst bei der kleinsten Bewegung
// durch; zu niedrig, und man muss quer ueber den Bildschirm ziehen fuer eine
// einzige Flaeche.
const DRAG_DEG_PER_PX = 0.3;

/**
 * Radius eines regelmaessigen Koerpers mit n Seiten der Kantenlaenge a.
 *
 * Nur bei genau diesem Radius stossen benachbarte Flaechen kantengenau
 * aneinander. Ist er zu klein, ueberlappen sie sich; ist er zu gross, klafft
 * zwischen ihnen ein Spalt und der Koerper ist offen. Bei vier Seiten liefert
 * die Formel a/2 - den Wuerfel.
 */
const bodyRadius = (a, n) => a / 2 / Math.tan(Math.PI / n);

/** Beleuchtung: frontal volle Helligkeit, weggedreht abgedunkelt. */
function shade(deg) {
  const lit = Math.max(0, Math.cos((deg * Math.PI) / 180));
  return 0.46 + 0.54 * lit;
}

/**
 * Setzt brightness() nur, wenn sie wirklich etwas veraendert.
 *
 * Ein CSS-filter erzwingt einen eigenen Compositing-Layer, der Inhalt
 * separat gerastert - selbst brightness(1), das visuell ein No-Op ist.
 * Kombiniert mit dem 3D-Kontext der Buehne (preserve-3d, translateZ) liest
 * dieser zusaetzliche Raster-Schritt als leichte Unschaerfe auf Text, exakt
 * auf der Flaeche, die gerade vorne steht und am meisten gelesen wird.
 */
function applyShade(el, deg) {
  const v = shade(deg);
  if (v > 0.995) {
    el.style.filter = '';
  } else {
    el.style.filter = `brightness(${v})`;
  }
}

/**
 * Skaliert seinen Inhalt auf eine Wuerfelseite. Eine Seite kann nicht
 * scrollen - passt der Inhalt nicht, muss er kleiner werden.
 */
function FitToFace({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // zoom statt transform: scale(). transform rendert den Inhalt in voller
    // Groesse und staucht das Ergebnis danach als Bitmap - kombiniert mit dem
    // 3D-Kontext der Buehne (preserve-3d, translateZ) liest das als
    // unscharfer Text, selbst bei einem Faktor nahe 1. zoom aendert
    // stattdessen die tatsaechliche Layout-Groesse: Text wird direkt in der
    // Zielgroesse gesetzt und bleibt scharf.
    //
    // Zoom veraendert dabei - anders als transform - die echte Layout-Groesse
    // von inner. Der naheliegende Ansatz, scrollHeight durch den zuletzt
    // gesetzten Zoom zurueckzurechnen, ist ein Wettlauf: zwischen "Zoom
    // setzen" und "scrollHeight spiegelt ihn wider" liegt ein Layout-Zyklus.
    // Eine Messung, die den neuen Zoom schon kennt, aber noch die alte
    // scrollHeight sieht, verzerrt das Ergebnis um genau das Verhaeltnis aus
    // Ziel- und vorherigem Zoom - bei jedem weiteren Aufruf erneut, sodass der
    // Wert geometrisch gegen null lief (in der Praxis bis auf 0,01).
    //
    // Robuster: bei jeder Messung Zoom auf 1 zuruecksetzen und einen
    // SYNCHRONEN Reflow erzwingen (offsetHeight lesen), bevor scrollHeight
    // gelesen wird. So ist die natuerliche Hoehe immer frisch und unabhaengig
    // vom zuvor gesetzten Wert - kein Wettlauf mehr moeglich. Zwischen den
    // beiden Style-Schreibvorgaengen findet kein Paint statt, es blitzt also
    // nichts sichtbar auf.
    const measure = () => {
      const cs = getComputedStyle(outer);
      const available =
        outer.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (available <= 0) return;

      inner.style.zoom = '1';
      void inner.offsetHeight;
      const natural = inner.scrollHeight;
      if (!natural) return;

      inner.style.zoom = String(Math.min(MAX_SCALE, available / natural));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    // Gleichmaessiger Rand: der Header liegt nicht mehr ueber der Flaeche,
    // dafuer brauchen die Eckverzierungen ringsum Platz.
    <div
      ref={outerRef}
      className="rotary-face flex h-full w-full items-center justify-center overflow-hidden p-10"
    >
      <div ref={innerRef} className="w-full">
        {children}
      </div>
    </div>
  );
}

/**
 * Eigenstaendig rotierender Koerper.
 *
 * Der Koerper besteht aus zwei Lagen: einer permanenten Huelle aus
 * undurchsichtigen Seiten, die ihn immer geschlossen haelt, und den
 * Inhaltsseiten darueber. Ohne die Huelle waeren die leeren Zwischenraeume
 * (bei der Rolle: die Seiten ohne Section) ein Loch, durch das man
 * hindurchsaehe.
 *
 * Die Drehung laeuft von selbst, angetrieben von einem Ticker statt vom
 * Scroll-Fortschritt - der Scrollbalken bewegt nur noch die Seite, nicht den
 * Koerper. Ein Klick auf eine Flaeche dreht sie nach vorn und klappt sie auf;
 * ein zweiter Klick schliesst sie wieder und die Drehung laeuft weiter.
 *
 * Inhaltsseiten bleiben deckend statt auszublenden: eine halbtransparente
 * Flaeche laesst den Hintergrund durchscheinen und zerstoert den Eindruck
 * eines massiven Koerpers. Tiefe kommt ueber Helligkeit, nicht ueber Opazitaet.
 */
export default function RotaryStage({
  children,
  axis = 'x',
  // Optional: mehr Seiten als Inhaltsflaechen, fuer einen runderen Koerper
  // (kleinerer Winkel pro Schritt). Ohne Angabe genau eine Seite je Flaeche -
  // kein Rest, keine leere Huelle im Umlauf.
  //
  // Mit Extra-Seiten lief die alte, scroll-gebundene Drehung nie in sie
  // hinein: pos war auf [0, anzahl] geklemmt, die leere Huelle lag ausserhalb
  // der erreichbaren Strecke. Die jetzige Eigendrehung laeuft dagegen
  // unbegrenzt weiter und durchquert diese Luecke bei jedem Umlauf - sichtbar
  // als leere Flaechen zwischen letzter und erster Section. Deshalb per
  // Default keine Extra-Seiten mehr; wer den runderen Look ausdruecklich
  // will, kann sides weiterhin groesser als die Flaechenzahl angeben.
  sides: sidesProp,
  fill,
  // Achse und Fuellgrad duerfen auf dem Handy abweichen. Seitliche Drehung
  // teilt die Breite auf mehrere Facetten auf - auf einem Geraet, das nur
  // 390px breit ist, bleibt davon nichts Lesbares uebrig.
  mobileAxis,
  mobileFill,
  // Anteil der Buehnenbreite, auf den die vordere Facette aufgeht, sobald sie
  // angeklickt wird. Ohne Wert bleibt jede Facette so breit wie sie ist -
  // Klicks drehen dann nur noch nach vorn, ohne aufzuklappen.
  expandTo,
} = {}) {
  const panels = React.Children.toArray(children);
  const sides = sidesProp ?? panels.length;
  // Winkel zwischen zwei benachbarten Flaechen. Vier Seiten geben die harte
  // Wuerfelkante, viele Seiten eine Rolle, die als Zylinder liest.
  const step = 360 / sides;
  const rootRef = useRef(null);
  const stickyRef = useRef(null);
  const boxRef = useRef(null);
  const backdropRef = useRef(null);
  const faceRefs = useRef([]);
  const overlayRefs = useRef([]);
  const closeRefs = useRef([]);
  const shellRefs = useRef([]);
  // Flaechenmasse. Breite und Hoehe getrennt: der Verkleinerungsfaktor
  // wirkt nur auf die Ausdehnung in Drehrichtung.
  const [cube, setCube] = useState({ w: 0, h: 0 });
  // Synchron initialisieren, nicht erst im Effect: sonst montiert das Handy
  // fuer einen Frame die Buehne, bevor sie wieder abgeschaltet wird.
  const abfrage = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches;
  const [reduced, setReduced] = useState(() => abfrage('(prefers-reduced-motion: reduce)'));
  const [mobile, setMobile] = useState(() => abfrage(`(max-width: ${MOBILE_MAX}px)`));

  // Erst wenn die Breitenklasse feststeht, ist entschieden, welche Achse und
  // welcher Fuellgrad gelten.
  const lateral = (mobile && mobileAxis ? mobileAxis : axis) === 'y';
  const fuellung = mobile && mobileFill != null ? mobileFill : fill;

  // Beim Drehen des Telefons wechselt die Breitenklasse. Ohne Listener bliebe
  // der beim ersten Rendern gemessene Wert stehen und die Seite behielte die
  // Raender der falschen Variante.
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useLayoutEffect(() => {
    // Auf dem Handy laeuft die Seite ohne Buehne: keine Eigendrehung, keine
    // Skalierung.
    if (reduced || mobile || panels.length === 0) return;
    const root = rootRef.current;
    const sticky = stickyRef.current;
    const box = boxRef.current;
    if (!root || !sticky || !box) return;

    // Abstand zur Frontflaeche auf die kuerzeste Strecke um den Koerper
    // bringen - ueber die tatsaechliche Seitenzahl (sides), nicht ueber die
    // Anzahl der Inhaltsflaechen. Die Drehung laeuft unbegrenzt weiter (kein
    // Scroll-Fortschritt mehr, der sie auf [0, anzahl] klemmt), muss also bei
    // jedem vollen Umlauf sauber umbrechen - und der volle Umlauf hat `sides`
    // Schritte, nicht `panels.length`.
    const kuerzesterWeg = (d) => {
      let x = ((d % sides) + sides) % sides;
      if (x > sides / 2) x -= sides;
      return x;
    };
    let depth = 0;
    let drift = 0;
    // Flaechenbreite lokal mitfuehren. Der React-Zustand taugt hier nicht:
    // apply laeuft in der Closure des Effekts und sieht dort noch den Wert
    // von vor dem letzten Rendern - beim Aufbau also 0.
    let flaecheW = 0;

    const layout = () => {
      const vorgabe = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches
        ? CUBE_FILL_MOBILE
        : CUBE_FILL_DESKTOP;

      // Quer zur Drehachse bleibt die Flaeche so gross wie moeglich, laengs
      // wird sie verkleinert. Sonst fuellt eine Facette die Drehrichtung
      // allein aus, die naechste liegt ausserhalb des Sichtfelds und von der
      // Rundung ist nichts zu sehen.
      const laengs = fuellung ?? vorgabe;
      const quer = mobile ? 1 : CUBE_WIDTH_DESKTOP;
      const w = lateral
        ? Math.round(sticky.clientWidth * laengs)
        : Math.round(sticky.clientWidth * quer);
      const h = Math.round(sticky.clientHeight * (lateral ? vorgabe : laengs));

      // Die Tiefe des Koerpers spannt die Kante in Drehrichtung auf: bei
      // senkrechter Drehachse die Breite, sonst die Hoehe.
      depth = bodyRadius(lateral ? w : h, sides) * 2;
      flaecheW = w;
      setCube({ w, h });

      // setCube loest ein Neurendern aus, und das schreibt die Flaechenbreite
      // aus dem Zustand zurueck - also auch ueber eine bereits aufgegangene
      // Frontflaeche. Deshalb im naechsten Frame, nach dem Rendern, erneut
      // anwenden.
      requestAnimationFrame(() => apply(pos));
    };

    // pos: authoritative Drehposition in Flaechen-Schritten, waechst
    // unbegrenzt weiter (kein Scroll-Bezug mehr).
    let pos = 0;
    // modus: 'auto' dreht von selbst, 'seeking' faehrt gerade zu einer
    // angeklickten Flaeche, 'open' steht offen und aufgeklappt.
    let modus = 'auto';
    let offeneFlaeche = null;
    let seekTween = null;

    const apply = (p) => {
      pos = p;
      const radius = depth / 2;
      const breit = expandTo && !mobile ? Math.round(sticky.clientWidth * expandTo) : 0;
      const offen = Boolean(breit) && modus === 'open' && offeneFlaeche !== null;
      const turn = (deg) => (lateral ? `rotateY(${-deg}deg)` : `rotateX(${deg}deg)`);
      // Den Koerper um seinen halben Durchmesser zuruecksetzen, damit die
      // Frontseite buendig auf z = 0 liegt und nicht vor der Buehne schwebt.
      box.style.transform = `translateZ(${-radius}px)`;

      // Huelle: immer vorhanden, immer geschlossen. Zwei Pixel nach innen
      // versetzt - lagen Huelle und Inhaltsseite auf exakt derselben Ebene,
      // wuerden sie um die Sichtbarkeit kaempfen und die Huelle schoebe sich
      // in Streifen ueber den Inhalt.
      shellRefs.current.forEach((shell, s) => {
        if (!shell) return;
        const deg = kuerzesterWeg(p - s) * step;
        shell.style.visibility = offen && Math.abs(deg) > 1 ? 'hidden' : 'visible';
        shell.style.transform = `${turn(deg)} translateZ(${radius - 2}px)`;
        applyShade(shell, deg);
      });

      // Inhaltsseiten darueber.
      faceRefs.current.forEach((face, i) => {
        if (!face) return;
        const d = kuerzesterWeg(p - i);
        const deg = d * step;
        if (offen && i !== offeneFlaeche) {
          face.style.visibility = 'hidden';
          return;
        }
        if (Math.abs(deg) > CULL_DEG) {
          face.style.visibility = 'hidden';
          return;
        }
        face.style.visibility = 'visible';
        face.style.transform = `${turn(deg)} translateZ(${radius}px)`;
        applyShade(face, deg);

        const auf = offen && i === offeneFlaeche;

        // Der Klick-Faenger liegt nur ueber Flaechen, die noch drehen -
        // sobald eine Flaeche offen steht, muss ihr eigener Inhalt (FAQ-
        // Akkordeon, Calendly, Buttons) wieder normal klickbar sein. Schliessen
        // passiert dann ueber den eigenen Schliessen-Knopf, nicht per Klick
        // irgendwo auf die Flaeche.
        const overlay = overlayRefs.current[i];
        if (overlay) overlay.style.pointerEvents = auf ? 'none' : 'auto';
        const closeBtn = closeRefs.current[i];
        if (closeBtn) closeBtn.style.visibility = auf ? 'visible' : 'hidden';

        if (breit) {
          const w = auf ? breit : flaecheW;
          face.style.width = `${w}px`;
          // Links verankert, also den Zuwachs haelftig nach links ziehen,
          // damit die Facette mittig aufgeht statt nach rechts zu wachsen.
          face.style.marginLeft = `${-(w - flaecheW) / 2}px`;
          if (auf) {
            face.style.transform = `${turn(deg)} translateZ(${radius + EXPAND_LIFT}px)`;
          }
        }
      });

      const backdrop = backdropRef.current;
      if (backdrop) {
        backdrop.style.setProperty('--spin', `${p * 42 + drift}deg`);
      }
    };

    layout();

    // Klick auf eine Flaeche: steht schon eine offen und es ist dieselbe,
    // schliessen und weiterdrehen. Sonst zu ihr hindrehen (immer vorwaerts,
    // nie rueckwaerts - das haelt die Drehrichtung durchgehend gleich) und
    // am Ziel aufklappen.
    const klickAuf = (i) => {
      if (modus === 'seeking' || modus === 'dragging') return;
      if (modus === 'open' && offeneFlaeche === i) {
        modus = 'auto';
        offeneFlaeche = null;
        apply(pos);
        return;
      }

      const delta = ((i - pos) % sides + sides) % sides;
      const ziel = pos + delta;
      modus = 'seeking';
      offeneFlaeche = null;
      apply(pos);

      if (seekTween) seekTween.kill();
      const proxy = { v: pos };
      const dauer = Math.min(
        SEEK_MAX_DURATION,
        Math.max(SEEK_MIN_DURATION, (delta * step) / SEEK_DEG_PER_SEC)
      );
      seekTween = gsap.to(proxy, {
        v: ziel,
        duration: dauer,
        ease: 'power2.inOut',
        onUpdate: () => apply(proxy.v),
        onComplete: () => {
          modus = 'open';
          offeneFlaeche = i;
          apply(ziel);
        },
      });
    };

    // Ziehen dreht den Koerper direkt unter dem Zeiger; ein Klick (Bewegung
    // unterhalb der Schwelle) oeffnet stattdessen die Flaeche. Beides liegt
    // auf demselben Overlay, deshalb per Pointer-Events statt 'click' selbst
    // unterschieden - ein natives 'click' kennt den zurueckgelegten Weg nicht.
    let ziehend = false;
    let ziehStartX = 0;
    let ziehStartPos = 0;
    let ziehBewegt = false;
    let ziehZeiger = null;

    const ziehStart = (overlay) => (e) => {
      if (modus === 'seeking') return;
      ziehend = true;
      ziehBewegt = false;
      ziehStartX = e.clientX;
      ziehStartPos = pos;
      ziehZeiger = e.pointerId;
      overlay.setPointerCapture?.(e.pointerId);
    };

    const ziehBewegen = (e) => {
      if (!ziehend || e.pointerId !== ziehZeiger) return;
      const dx = e.clientX - ziehStartX;
      if (!ziehBewegt) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        // Erst jetzt, beim Ueberschreiten der Schwelle, wirklich zum Ziehen
        // wechseln - vorher koennte es noch ein Klick werden.
        ziehBewegt = true;
        if (seekTween) seekTween.kill();
        modus = 'dragging';
        offeneFlaeche = null;
      }
      e.preventDefault();
      // Nach links ziehen bringt die naechste Flaeche herein (wie ein
      // Karussell/Slider), nach rechts die vorherige zurueck - deshalb das
      // Minus.
      apply(ziehStartPos - (dx * DRAG_DEG_PER_PX) / step);
    };

    const ziehEnde = (e) => {
      if (!ziehend || e.pointerId !== ziehZeiger) return;
      ziehend = false;
      if (ziehBewegt) {
        modus = 'auto';
        apply(pos);
      }
    };

    const abmeldeliste = [];
    faceRefs.current.forEach((face, i) => {
      if (!face) return;
      const overlay = overlayRefs.current[i];
      const closeBtn = closeRefs.current[i];
      if (!overlay) return;

      const onPointerDown = ziehStart(overlay);
      const onPointerUp = (e) => {
        const warGezogen = ziehBewegt;
        ziehEnde(e);
        // Kein Klick, wenn die Bewegung schon als Ziehen zaehlte.
        if (!warGezogen) klickAuf(i);
      };
      const onPointerCancel = (e) => ziehEnde(e);
      const onClose = (e) => {
        e.stopPropagation();
        klickAuf(i);
      };

      overlay.addEventListener('pointerdown', onPointerDown);
      overlay.addEventListener('pointermove', ziehBewegen);
      overlay.addEventListener('pointerup', onPointerUp);
      overlay.addEventListener('pointercancel', onPointerCancel);
      closeBtn?.addEventListener('click', onClose);
      abmeldeliste.push(() => {
        overlay.removeEventListener('pointerdown', onPointerDown);
        overlay.removeEventListener('pointermove', ziehBewegen);
        overlay.removeEventListener('pointerup', onPointerUp);
        overlay.removeEventListener('pointercancel', onPointerCancel);
        closeBtn?.removeEventListener('click', onClose);
      });
    });

    const tick = () => {
      drift += 0.035;
      if (modus === 'auto') {
        const dt = gsap.ticker.deltaRatio(60) / 60;
        apply(pos + (AUTOPLAY_DEG_PER_SEC * dt) / step);
      }
    };
    gsap.ticker.add(tick);

    apply(0);

    // Nachkalibrieren, wenn sich die Flaechengroesse aendert - Bild laedt
    // nach, Font-Swap bricht Text anders um, das Fenster wird verschoben.
    // Kein Bezug mehr zu ScrollTrigger-Grenzen noetig: die Drehung haengt
    // nicht mehr am Scroll-Fortschritt, also gibt es auch keine
    // Kalibrierungs-Drift zwischen beiden mehr.
    let layoutTimer = null;
    const nachkalibrieren = () => {
      clearTimeout(layoutTimer);
      layoutTimer = setTimeout(layout, 120);
    };
    const groessenBeobachter = new ResizeObserver(nachkalibrieren);
    groessenBeobachter.observe(sticky);
    window.addEventListener('load', nachkalibrieren);
    if (document.fonts?.ready) {
      document.fonts.ready.then(nachkalibrieren);
    }

    // Der Teich blendet in den Grundton der Seite ein, sobald man an der
    // Buehne vorbeigescrollt hat - unabhaengig von der Drehung, rein an der
    // Scrollposition der (jetzt normal im Fluss liegenden) Section
    // gemessen. scrub ohne pin: nur eine Zahl mitschreiben, nichts anhalten.
    // Von "Buehne komplett im Bild" (bottom bottom) bis "Buehne komplett
    // durchgescrollt" (bottom top) liegt genau eine Viewporthoehe - darueber
    // laeuft der Fortschritt linear 0 bis 1. TEICH_HAELT schiebt den Beginn
    // des Einblendens nach hinten, wie zuvor beim scroll-gekoppelten pos.
    const teichTrigger = ScrollTrigger.create({
      trigger: root,
      start: 'bottom bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const rest = (self.progress - TEICH_HAELT) / (1 - TEICH_HAELT);
        backdropRef.current?.style.setProperty('--tint', String(Math.min(1, Math.max(0, rest))));
      },
    });

    return () => {
      clearTimeout(layoutTimer);
      abmeldeliste.forEach((fn) => fn());
      window.removeEventListener('load', nachkalibrieren);
      groessenBeobachter.disconnect();
      gsap.ticker.remove(tick);
      if (seekTween) seekTween.kill();
      teichTrigger.kill();
    };
  }, [reduced, panels.length, mobile, lateral, sides, step, fuellung, expandTo]);

  // Handy und reduzierte Bewegung bekommen die Seite so, wie sie ohne Buehne
  // war: Sections untereinander im normalen Fluss, eingeblendet beim
  // Reinscrollen. FadeIn haelt sich selbst an prefers-reduced-motion.
  if (reduced || mobile) {
    return (
      <div>
        {panels.map((panel, i) => (
          <FadeIn key={i}>{panel}</FadeIn>
        ))}
      </div>
    );
  }

  const faceStyle = {
    width: cube.w ? `${cube.w}px` : '100%',
    height: cube.h ? `${cube.h}px` : '94vh',
    background: 'hsl(var(--card))',
    // Auf dem Handy fuellt die Seite den Bildschirm - ein Rahmen waere dort
    // nur eine Linie am Displayrand und kostet sichtbare Flaeche.
    border: mobile ? 'none' : '1px solid hsl(var(--border))',
    boxShadow: mobile
      ? 'none'
      : '0 0 0 1px hsl(var(--accent) / 0.18), 0 30px 70px -30px hsl(217 62% 12% / 0.45)',
    backfaceVisibility: 'hidden',
    willChange: 'transform, filter',
  };

  // Nur Breite und Versatz animieren. Die Drehung wird pro Frame gesetzt; ein
  // Uebergang darauf liefe der Position hinterher.
  const inhaltStyle = expandTo
    ? { ...faceStyle, transformStyle: 'preserve-3d', transition: 'width 420ms cubic-bezier(0.4, 0, 0.2, 1), margin-left 420ms cubic-bezier(0.4, 0, 0.2, 1)' }
    : { ...faceStyle, transformStyle: 'preserve-3d' };

  return (
    // data-rotary-root/-index: Ankerlinks in der Kopfzeile (#process,
    // #beratung etc.) muessen ihre Zielflaeche finden koennen, um sie per
    // Klick zu oeffnen - siehe scrollToSection().
    <div ref={rootRef} data-rotary-root="" className="pt-16 lg:pt-20">
      <div
        ref={stickyRef}
        // Normales Fluss-Element, nicht mehr gepinnt: die Buehne dreht sich
        // von selbst, der Scrollbalken bewegt nur noch die Seite an ihr
        // vorbei. Der Abstand zum fixierten Header sitzt auf dem Wrapper
        // aussenrum (pt-16/pt-20), nicht hier - sonst frisst er von den 90vh,
        // die dem Koerper zustehen.
        className="relative flex w-full items-center justify-center overflow-hidden"
        style={{
          height: '90vh',
          // Bewusst NICHT mit dem Radius mitwachsen lassen: die Frontflaeche
          // liegt ohnehin immer auf z = 0, nur die dahinter weichen zurueck.
          // Eine mit dem Radius wachsende Perspektive staucht diese Nachbarn
          // dann kaum noch - die Rolle laege flach wie verschobene Platten
          // statt sich sichtbar zu kruemmen. Massgeblich ist die Flaechen-
          // groesse, und die haengt nur an der Achse.
          perspective: lateral ? '2600px' : '1250px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div ref={backdropRef} className="absolute inset-0">
          <RotatingBackdrop />
        </div>

        <div
          ref={boxRef}
          className="relative"
          style={{
            width: cube.w ? `${cube.w}px` : '100%',
            height: cube.h ? `${cube.h}px` : '94vh',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Huelle: haelt den Koerper geschlossen, auch wo keine Section liegt. */}
          {Array.from({ length: sides }, (_, s) => (
            <div
              key={`shell-${s}`}
              ref={(el) => { shellRefs.current[s] = el; }}
              className="absolute left-0 top-0"
              style={faceStyle}
              aria-hidden="true"
            />
          ))}

          {panels.map((panel, i) => (
            <div
              key={i}
              ref={(el) => { faceRefs.current[i] = el; }}
              data-rotary-index={i}
              className="absolute left-0 top-0 overflow-hidden"
              style={inhaltStyle}
            >
              <FaceOrnament />
              <FitToFace>{panel}</FitToFace>

              {/* Klick-Faenger: solange die Flaeche noch dreht, oeffnet ein
                  Klick sie, ein Ziehen dreht den Koerper direkt mit. Steht
                  sie offen, wird er per pointer-events:none abgeschaltet,
                  damit Buttons, Akkordeons und das Calendly-Widget normal
                  reagieren. touch-action: pan-y laesst vertikales Scrollen
                  der Seite unberuehrt und faengt nur die horizontale Geste. */}
              <div
                ref={(el) => { overlayRefs.current[i] = el; }}
                data-rotary-overlay=""
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ zIndex: 5, touchAction: 'pan-y' }}
                aria-hidden="true"
              />

              {/* Schliessen-Knopf: nur sichtbar, waehrend diese Flaeche
                  offen steht. Eigene Schaltflaeche statt "Klick irgendwo
                  schliesst" - sonst waere jeder Klick auf Inhalt (FAQ,
                  Calendly, Buttons) gleichzeitig ein Schliessen. */}
              <button
                ref={(el) => { closeRefs.current[i] = el; }}
                type="button"
                data-rotary-close=""
                aria-label="Zurueck zur Drehung"
                className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors hover:bg-accent/10"
                style={{
                  visibility: 'hidden',
                  // Ueber der Eckverzierung (z-10, aber pointer-events-none):
                  // die faechert sonst optisch durch den Knopf hindurch.
                  zIndex: 11,
                  borderColor: 'hsl(var(--accent) / 0.4)',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
