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
// Anteil einer Flaeche, den man in Scrollrichtung zuruecklegen muss, damit
// weitergeschaltet wird. Ohne diese Schwelle wuerde jeder versehentliche
// Radstups eine ganze Section ueberspringen; ohne Richtungsbias dagegen
// zoege es einen auf die Ausgangsseite zurueck, obwohl man weiterwollte.
const SNAP_THRESHOLD = 0.12;
// Ab diesem Winkel zur Blickrichtung liegt eine Flaeche hinter der Kante und
// wird nicht mehr gezeichnet. Knapp ueber 90 Grad, damit sie nicht schon
// verschwindet, waehrend ihre Kante noch sichtbar ist.
const CULL_DEG = 92;

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
 * Skaliert seinen Inhalt auf eine Wuerfelseite. Eine Seite kann nicht
 * scrollen - passt der Inhalt nicht, muss er kleiner werden.
 */
function FitToFace({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const cs = getComputedStyle(outer);
      const available =
        outer.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const needed = inner.scrollHeight;
      if (available <= 0 || !needed) return;
      setScale(Math.min(MAX_SCALE, available / needed));
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
      <div
        ref={innerRef}
        className="w-full"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
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
    // bringen. Ohne das waere die erste Section vom Ende aus betrachtet acht
    // Flaechen entfernt statt einer und kaeme nie ins Bild.
    const kuerzesterWeg = (d) => {
      let x = ((d % anzahl) + anzahl) % anzahl;
      if (x > anzahl / 2) x -= anzahl;
      return x;
    };
    let depth = 0;
    let drift = 0;

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
      setCube({ w, h });
    };

    const apply = (pos) => {
      const radius = depth / 2;
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
        shell.style.transform = `${turn(deg)} translateZ(${radius - 2}px)`;
        shell.style.filter = `brightness(${shade(deg)})`;
      });

      // Inhaltsseiten darueber.
      faceRefs.current.forEach((face, i) => {
        if (!face) return;
        const d = kuerzesterWeg(pos - i);
        const deg = d * step;
        if (Math.abs(deg) > CULL_DEG) {
          face.style.visibility = 'hidden';
          return;
        }
        face.style.visibility = 'visible';
        face.style.transform = `${turn(deg)} translateZ(${radius}px)`;
        face.style.filter = `brightness(${shade(deg)})`;
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
      if (Math.abs(pos - target) < SNAP_EPSILON) return;

      const y = st.start + ((st.end - st.start) * target) / steps;
      snapping = true;
      const done = () => { snapping = false; };

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

    return () => {
      clearTimeout(snapTimer);
      window.removeEventListener('wheel', onInput);
      window.removeEventListener('touchend', onInput);
      window.removeEventListener('keyup', onInput);
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

  return (
    <div ref={rootRef} style={{ height: `${(panels.length + 1) * 100}vh` }}>
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
              className="absolute left-0 top-0 overflow-hidden"
              style={{ ...faceStyle, transformStyle: 'preserve-3d' }}
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
