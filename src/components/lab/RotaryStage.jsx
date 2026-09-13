import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RotatingBackdrop from '@/components/lab/RotatingBackdrop';
import FaceOrnament from '@/components/lab/FaceOrnament';
import FadeIn from '@/components/FadeIn';
import { getLenis } from '@/lib/lenisInstance';

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

// Einrasten. Nach der letzten Eingabe wird auf die naechste ganze Flaeche
// gefahren, damit der Wuerfel nie schraeg zwischen zwei Seiten stehen bleibt.
const SNAP_IDLE_MS = 120;
const SNAP_DURATION = 0.5;
// Unterhalb dieses Abstands zur ganzen Flaeche steht der Wuerfel bereits
// gerade - ein Schnappen waere nur ein sichtbares Zucken.
const SNAP_EPSILON = 0.004;
// Ab dieser Naehe zu einer ganzen Flaeche gilt die Buehne als "im
// Stillstand" und die Frontflaeche darf aufgehen - grosszuegiger als
// SNAP_EPSILON, damit das auch waehrend der letzten Millisekunden der
// animierten Einrast-Fahrt zuverlaessig eintritt statt nur beim exakt
// erreichten Ziel.
const REST_EPSILON = 0.03;
// Anteil einer Flaeche, den man in Scrollrichtung zuruecklegen muss, damit
// weitergeschaltet wird. Ohne diese Schwelle wuerde jeder versehentliche
// Radstups eine ganze Section ueberspringen; ohne Richtungsbias dagegen
// zoege es einen auf die Ausgangsseite zurueck, obwohl man weiterwollte.
const SNAP_THRESHOLD = 0.12;
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

// Bis zu diesem Anteil des Scrollwegs bleibt der Teich unveraendert stehen,
// danach laeuft er in den Grundton der Webseite ueber.
const TEICH_HAELT = 0.6;

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
 * Scroll-getriebener Wuerfel.
 *
 * Der Koerper besteht aus zwei Lagen: einer permanenten Huelle aus vier
 * undurchsichtigen Seiten, die den Wuerfel immer geschlossen haelt, und den
 * Inhaltsseiten darueber. Ohne die Huelle klafft an den Enden des Scrolls ein
 * Loch - bei der ersten Section gibt es noch keine Vorgaengerseite, die von
 * unten nachkommen koennte, und man schaut durch den Koerper hindurch.
 *
 * Inhaltsseiten bleiben deckend statt auszublenden: eine halbtransparente
 * Flaeche laesst den Hintergrund durchscheinen und zerstoert den Eindruck
 * eines massiven Koerpers. Tiefe kommt ueber Helligkeit, nicht ueber Opazitaet.
 */
export default function RotaryStage({
  children,
  axis = 'x',
  sides = 4,
  fill,
  // Achse und Fuellgrad duerfen auf dem Handy abweichen. Seitliche Drehung
  // teilt die Breite auf mehrere Facetten auf - auf einem Geraet, das nur
  // 390px breit ist, bleibt davon nichts Lesbares uebrig.
  mobileAxis,
  mobileFill,
  // Anteil der Buehnenbreite, auf den die vordere Facette aufgeht, sobald der
  // Koerper still steht. Ohne Wert bleibt jede Facette so breit wie sie ist.
  expandTo,
} = {}) {
  // Winkel zwischen zwei benachbarten Flaechen. Vier Seiten geben die harte
  // Wuerfelkante, viele Seiten eine Rolle, die als Zylinder liest.
  const step = 360 / sides;
  const panels = React.Children.toArray(children);
  const rootRef = useRef(null);
  const stickyRef = useRef(null);
  const boxRef = useRef(null);
  const backdropRef = useRef(null);
  const faceRefs = useRef([]);
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
    // Auf dem Handy laeuft die Seite ohne Buehne: kein Pinning, kein
    // Einrasten, keine Skalierung.
    if (reduced || mobile || panels.length === 0) return;
    const root = rootRef.current;
    const sticky = stickyRef.current;
    const box = boxRef.current;
    if (!root || !sticky || !box) return;

    // Ein Schritt je Flaeche, nicht je Uebergang: der letzte Schritt fuehrt
    // von der letzten Section zurueck auf die erste, der Koerper laeuft also
    // einmal ganz herum.
    const anzahl = panels.length;
    const steps = Math.max(1, anzahl);

    // Abstand zur Frontflaeche auf die kuerzeste Strecke um den Koerper
    // bringen.
    //
    // Kein Modulo-Wrap: das war ein Fehler. Er ging davon aus, die
    // Inhaltsflaechen bildeten einen geschlossenen Kreis von genau `anzahl`
    // Positionen - stimmt nur, wenn wirklich jede Seite des Koerpers Inhalt
    // traegt (Wuerfel: sides === anzahl). Bei der Rolle hat der Koerper 12
    // Seiten, aber nur 8 mit Inhalt - der Rest ist leere Huelle. Mit dem
    // Wrap ueber `anzahl` (8) rechnete sich Flaeche 0 kurz vor Scrollende
    // (pos nahe anzahl) faelschlich wieder als "vorne", als läge sie direkt
    // neben der letzten Flaeche - dabei liegen dazwischen vier leere
    // Huellenseiten, an denen nie vorbeigescrollt wird.
    //
    // pos bewegt sich ohnehin nie ausserhalb von [0, anzahl]: ScrollTrigger
    // haelt self.progress fest auf [0, 1] geklemmt. Ein Wrap ist fuer die
    // Distanz zur Front deshalb nie noetig - auch beim Wuerfel nicht, da
    // dort dieselbe Grenze gilt.
    const kuerzesterWeg = (d) => d;
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
      requestAnimationFrame(() => apply(letztePos));
    };

    const apply = (pos) => {
      letztePos = pos;
      const radius = depth / 2;
      // Breite der vorderen Facette im Ruhezustand. Ueberschreitet sie die
      // Schwelle der Container-Query, stellt die Section von selbst auf ihr
      // weites Layout um - genau das, was die laterale Ansicht zeigt.
      const breit = expandTo && !mobile ? Math.round(sticky.clientWidth * expandTo) : 0;
      const vorne = Math.round(pos);
      // Ruht die Buehne? Nicht als Flag gefuehrt, das die Snap-Animation per
      // onComplete umlegt, sondern bei jedem Aufruf direkt aus der Position
      // abgelesen: liegt pos nah genug an einer ganzen Flaeche, gilt das
      // unabhaengig davon, WIE sie dort hingekommen ist.
      //
      // Der Unterschied war genau das Muster "nur erste und letzte Flaeche
      // gehen auf": an den beiden Raendern liegt pos durch die Scroll-Grenze
      // selbst exakt auf der Ganzzahl (0 bzw. steps) - keine Animation
      // noetig, der synchrone "schon angekommen"-Zweig griff sofort. In der
      // Mitte liegt pos beim Anhalten so gut wie nie exakt auf einer
      // Ganzzahl, das lief also immer ueber die animierte Lenis-Fahrt und
      // deren onComplete. Wurde die (durch eine weitere Eingabe, eine
      // Unterbrechung oder eine Eigenheit von Lenis in Produktion)
      // uebersprungen, blieb die Flaeche fuer immer im Rotationszustand
      // haengen - leer, weil nur die aufgegangene Frontflaeche ueberhaupt
      // deckenden Inhalt zeigt. Diese Ableitung braucht keine Bestaetigung
      // von aussen mehr: sie ist bei jedem Frame der Animation selbst schon
      // wahr, sobald die Position nah genug ist.
      const ruht = Math.abs(pos - vorne) < REST_EPSILON;
      // Im Stillstand liegt nur noch die aufgegangene Folie im Bild. Die
      // Nachbarn muessen weg: sie stossen mit ihrer vorderen Kante auf
      // dieselbe Ebene, auf der die Folie liegt, und werden dort ineinander
      // geschnitten - die breite Seite zerfiele in Streifen. Bewegt wird
      // ohnehin nichts, es fehlt also auch nichts.
      const offen = Boolean(breit) && ruht;
      const turn = (deg) => (lateral ? `rotateY(${-deg}deg)` : `rotateX(${deg}deg)`);
      // Den Koerper um seinen halben Durchmesser zuruecksetzen, damit die
      // Frontseite buendig auf z = 0 liegt und nicht vor der Buehne schwebt.
      box.style.transform = `translateZ(${-radius}px)`;

      // Huelle: vier Seiten, immer vorhanden, immer geschlossen. Zwei Pixel
      // nach innen versetzt - lagen Huelle und Inhaltsseite auf exakt
      // derselben Ebene, wuerden sie um die Sichtbarkeit kaempfen und die
      // Huelle schoebe sich in Streifen ueber den Inhalt.
      shellRefs.current.forEach((shell, s) => {
        if (!shell) return;
        // Gleiche Formel wie bei den Inhaltsseiten. Mit s * 90 - pos * 90
        // liefe die Huelle gegenlaeufig und schnitte quer durch den Koerper.
        const deg = (pos - s) * step;
        shell.style.visibility = offen && Math.abs(deg) > 1 ? 'hidden' : 'visible';
        shell.style.transform = `${turn(deg)} translateZ(${radius - 2}px)`;
        applyShade(shell, deg);
      });

      // Inhaltsseiten darueber.
      faceRefs.current.forEach((face, i) => {
        if (!face) return;
        const d = kuerzesterWeg(pos - i);
        const deg = d * step;
        // i !== vorne, NICHT d !== 0: d ist eine Fliesskommazahl (pos - i).
        // Im Ruhezustand liegt pos nur NAH an einer Ganzzahl (siehe
        // REST_EPSILON oben), landet aber praktisch nie exakt darauf - d
        // ist dann fuer die Frontflaeche selbst ein kleiner Wert wie 0.02,
        // niemals exakt 0. d !== 0 war also so gut wie immer wahr, auch
        // fuer die Flaeche, die gerade vorne stehen soll - das versteckte
        // ausnahmslos jede Flaeche, inklusive der Front. vorne = Math.round(pos)
        // ist dagegen immer eine echte Ganzzahl, der Vergleich mit dem
        // ebenfalls ganzzahligen Index i ist deshalb exakt.
        if (offen && i !== vorne) {
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

        if (breit) {
          // Nur die Facette, die frontal steht, und nur im Stillstand.
          const auf = ruht && vorne === i;
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
        backdrop.style.setProperty('--spin', `${pos * 42 + drift}deg`);
        // Der Teich soll bis kurz vor Schluss stehen bleiben und erst dann in
        // den Grundton der Seite laufen. Linear ueber den ganzen Scroll waere
        // er schon zur Haelfte verblasst, bevor man die Mitte erreicht.
        const rest = (pos / steps - TEICH_HAELT) / (1 - TEICH_HAELT);
        backdrop.style.setProperty('--tint', String(Math.min(1, Math.max(0, rest))));
      }
    };

    layout();

    let snapTimer = null;
    let snapping = false;
    let letztePos = 0;

    // Zuletzt beobachtete Scrollrichtung: 1 nach unten, -1 nach oben.
    let dir = 1;

    const snapTarget = (pos) => {
      const unten = Math.floor(pos);
      const rest = pos - unten;
      if (dir > 0) return rest > SNAP_THRESHOLD ? unten + 1 : unten;
      return rest < 1 - SNAP_THRESHOLD ? unten : unten + 1;
    };

    const snapToNearest = () => {
      if (snapping || !st.isActive) return;
      const pos = st.progress * steps;
      const target = Math.min(steps, Math.max(0, snapTarget(pos)));
      if (Math.abs(pos - target) < SNAP_EPSILON) {
        // Steht schon gerade - nichts zu fahren, apply() liest die Ruhe
        // selbst aus der Position ab.
        apply(pos);
        return;
      }

      const y = st.start + ((st.end - st.start) * target) / steps;
      snapping = true;
      // onUpdate laeuft waehrend dieser Fahrt ohnehin bei jedem Frame und
      // ruft apply() mit der jeweils aktuellen Position auf - die naehert
      // sich der Ganzzahl kontinuierlich an, "Ruhe" stellt sich also von
      // selbst ein, sobald sie nah genug ist. done() muss dafuer nichts
      // mehr umschalten; es hebt nur die Sperre auf, die eine zweite
      // Einrastfahrt waehrend dieser verhindert. Bleibt der Aufruf aus (eine
      // weitere Eingabe unterbricht, Lenis meldet sich nicht zurueck), war
      // die Facette trotzdem schon offen, sobald sie nah genug war - sie
      // haengt nicht mehr im Rotationszustand fest.
      const done = () => {
        snapping = false;
      };

      const lenis = getLenis();
      if (lenis) {
        // lock verhindert, dass Lenis' eigener Nachlauf gegen das Einrasten
        // arbeitet und der Wuerfel wieder aus der Geraden gezogen wird.
        lenis.scrollTo(y, { duration: SNAP_DURATION, lock: true, onComplete: done });
      } else {
        window.scrollTo({ top: y, behavior: 'smooth' });
        setTimeout(done, SNAP_DURATION * 1000);
      }
    };

    const scheduleSnap = () => {
      if (snapping) return;
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snapToNearest, SNAP_IDLE_MS);
    };

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        apply(self.progress * steps);
        // Waehrend des Einrastens nicht mitschreiben: die Schnappfahrt laeuft
        // sonst als Gegenrichtung ein und kippt das Ziel der naechsten Geste.
        if (!snapping && self.direction) dir = self.direction;
        // Faengt Ziehen am Scrollbalken und alles, was kein Rad-Ereignis
        // ausloest. Waehrend des Einrastens laeuft es ins Leere, weil
        // scheduleSnap dann sofort zurueckkehrt.
        scheduleSnap();
      },
      onRefresh: (self) => {
        layout();
        apply(self.progress * steps);
      },
    });

    // Direkt an der Eingabe haengen, nicht nur am Scroll-Ereignis: Lenis
    // laesst die Seite nach dem Loslassen noch ausrollen. Wer bis zum Ende
    // dieses Nachlaufs wartet, rastet spuerbar zu spaet ein.
    const onInput = () => scheduleSnap();
    window.addEventListener('wheel', onInput, { passive: true });
    window.addEventListener('touchend', onInput, { passive: true });
    window.addEventListener('keyup', onInput);

    const tick = () => {
      drift += 0.035;
      const backdrop = backdropRef.current;
      if (backdrop) {
        backdrop.style.setProperty('--spin', `${st.progress * steps * 42 + drift}deg`);
      }
    };
    gsap.ticker.add(tick);

    apply(0);
    ScrollTrigger.refresh();

    // Beobachtung, die den eigentlichen Fehler entlarvt hat: die Flaechen
    // bleiben leer - bis man die DevTools-Konsole aufklappt. Das aendert
    // nichts an unserem Code, es loest nur ein echtes 'resize'-Ereignis aus
    // (das Dokument wird durch die andockende Konsole schmaler). Danach
    // steht sofort alles richtig da. Der Fehler liegt also nicht an fehlender
    // Nachkalibrierung bei spaet ladendem Inhalt (das war die vorherige,
    // falsche Spur), sondern daran, dass die erste Berechnung - Zoom pro
    // Flaeche, ScrollTrigger-Grenzen - beim initialen Laden im Zusammenspiel
    // mit dem 3D-Kontext der Buehne verlaesslich NICHT greift, und nur ein
    // echtes 'resize' sie zuverlaessig nachzieht.
    //
    // Statt weiter zu raten, WARUM die erste Berechnung im Livebetrieb
    // ausbleibt, wird genau das nachgestellt, was nachweislich hilft: kurz
    // nach dem Aufbau ein synthetisches 'resize' feuern. Das ruft sowohl
    // ScrollTrigger.refresh() (ScrollTrigger haengt selbst an 'resize') als
    // auch jeden anderen resize-gebundenen Code auf - inklusive der
    // ResizeObserver in FitToFace, deren Zoom-Messung genau daran haengt.
    // Mehrfach gestaffelt, weil ein einzelner Zeitpunkt wieder zu frueh oder
    // zu spaet relativ zu Bildern/Fonts/Iframes sein kann.
    const stoss = () => window.dispatchEvent(new Event('resize'));
    const stoesse = [
      requestAnimationFrame(stoss),
      setTimeout(stoss, 60),
      setTimeout(stoss, 300),
      setTimeout(stoss, 1000),
      setTimeout(stoss, 2500),
    ];

    let refreshTimer = null;
    const nachkalibrieren = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(stoss, 120);
    };
    const hoehenBeobachter = new ResizeObserver(nachkalibrieren);
    hoehenBeobachter.observe(document.body);
    window.addEventListener('load', nachkalibrieren);
    if (document.fonts?.ready) {
      document.fonts.ready.then(nachkalibrieren);
    }

    return () => {
      clearTimeout(snapTimer);
      clearTimeout(refreshTimer);
      cancelAnimationFrame(stoesse[0]);
      stoesse.slice(1).forEach(clearTimeout);
      window.removeEventListener('wheel', onInput);
      window.removeEventListener('touchend', onInput);
      window.removeEventListener('keyup', onInput);
      window.removeEventListener('load', nachkalibrieren);
      hoehenBeobachter.disconnect();
      gsap.ticker.remove(tick);
      st.kill();
    };
  }, [reduced, panels.length, mobile, lateral, sides, step, fuellung]);

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
  // Uebergang darauf liefe der Scroll-Position hinterher.
  const inhaltStyle = expandTo
    ? { ...faceStyle, transformStyle: 'preserve-3d', transition: 'width 420ms cubic-bezier(0.4, 0, 0.2, 1), margin-left 420ms cubic-bezier(0.4, 0, 0.2, 1)' }
    : { ...faceStyle, transformStyle: 'preserve-3d' };

  return (
    // data-rotary-root/-steps: Ankerlinks in der Kopfzeile (#process, #beratung
    // etc.) muessen ihre Zielflaeche finden koennen. Die Flaechen liegen
    // absolut positioniert uebereinander, ihr eigenes offsetTop ist bedeutungslos
    // - scrollToSection() liest stattdessen diese Attribute direkt aus dem DOM,
    // um die Scrollposition der jeweiligen Flaeche zu berechnen.
    <div
      ref={rootRef}
      data-rotary-root=""
      data-rotary-steps={panels.length}
      style={{ height: `${(panels.length + 1) * 100}vh` }}
    >
      <div
        ref={stickyRef}
        // pt haelt den fixierten Header frei. Der Koerper zentriert sich damit
        // im Raum darunter, statt halb hinter dem Header zu liegen - sonst
        // sind die beiden oberen Eckverzierungen nie zu sehen.
        className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden pt-16 lg:pt-20"
        style={{
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
