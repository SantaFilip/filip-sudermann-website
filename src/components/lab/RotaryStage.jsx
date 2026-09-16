import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X } from 'lucide-react';
import RotatingBackdrop from '@/components/lab/RotatingBackdrop';
import FaceOrnament from '@/components/lab/FaceOrnament';
import FadeIn from '@/components/FadeIn';
import ArchitectureGL, { ArchitectureBackGL } from '@/components/lab/ArchitectureGL';

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
// Das gesamte Gebaeude (Saeulen/Dach/Sockel/Inhalt zusammen) kleiner als
// die eigentliche Fuellung - schafft zusaetzlichen Luftraum rundum, allen
// voran ueber der Kuppel, die sonst bei einer steileren Kuppelhoehe an der
// Buehnenoberkante anstossen kann. Wirkt auf `cube.w`/`cube.h` (also auf
// die gesamte davon abgeleitete Geometrie), NICHT auf `stageW`/`stageH`
// (die Buehnen-/Kameragroesse bleibt gleich - nur das Gebaeude darin wird
// kleiner gezeichnet). Von 0.95 auf 0.9 verstaerkt, nachdem ein separater
// Versuch (Buehne per CSS-Padding nach unten schieben) einen sichtbaren
// Farbbruch zwischen Buehnenblau und Seitenhintergrund erzeugte - dieser
// Weg bleibt INNERHALB der Buehne, also durchgehend vom blauen
// Atmosphaeren-Hintergrund gedeckt.
const GEBAEUDE_SKALIERUNG = 0.9;
const MOBILE_MAX = 767;

// Hochskalieren ist keine Option: der Inhalt liegt bereits auf voller
// Flaechenbreite, ein Faktor ueber 1 schiebt ihn seitlich aus der Flaeche
// heraus und die Kanten werden abgeschnitten. Die Flaeche wird stattdessen
// ueber die CSS-Regeln in index.css gefuellt, die dem Inhalt die ueberfluessige
// Hoehe nehmen.
const MAX_SCALE = 1;

// Ab diesem Winkel zur Blickrichtung liegt eine Flaeche hinter der Kante und
// wird nicht mehr gezeichnet. War zwischenzeitlich bei 80 (zu frueh, Inhalt
// noch lesbar beim Verschwinden) und danach bei 105 (laut Rueckmeldung
// wiederum spuerbar zu spaet) - jetzt naeher an der theoretischen 90-Grad-
// Kante (Flaeche exakt auf der Kante des Koerpers), mit nur wenig Puffer.
const CULL_DEG = 98;

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
  // Anteil der Buehne quer zur Drehachse (bei liegender Drehung also die
  // Hoehe), den der Koerper einnimmt. Ohne Wert wie bisher CUBE_FILL_DESKTOP
  // (0.86) - der schmale Rest dient Sockel/Dach als Ansatzflaeche, direkt an
  // der Facettenkante positioniert (siehe unten), nicht als freischwebende
  // Elemente mit Abstand.
  crossFill,
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
  const glWrapRef = useRef(null);
  const architectureRef = useRef(null);
  // Flaechenmasse. Breite und Hoehe getrennt: der Verkleinerungsfaktor
  // wirkt nur auf die Ausdehnung in Drehrichtung. stageW/stageH sind die
  // volle Buehnengroesse (sticky.clientWidth/-Height) - fuer die echte
  // WebGL-Kamera in ArchitectureGL, deren Sichtfeld exakt dem CSS
  // perspective-Wert der Buehne entsprechen muss, damit Dach und Sockel bei
  // jedem Rotationswinkel korrekt zur drehenden Facetten-Trommel passen
  // (eine flache 2D-Naeherung kann das nur fuer die Frontflaeche - siehe
  // Architecture.jsx-Kommentar; die neue WebGL-Version ersetzt sie).
  const [cube, setCube] = useState({ w: 0, h: 0, stageW: 0, stageH: 0 });
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
      // crossFill ersetzt vorgabe nur auf dem Desktop - auf dem Handy bleibt
      // die Flaeche bildschirmfuellend (Sockel/Dach werden dort ohnehin
      // nicht gerendert, siehe Mobile-Fallback weiter unten).
      const querFuellung = mobile ? vorgabe : crossFill ?? vorgabe;
      const w = Math.round((lateral
        ? sticky.clientWidth * laengs
        : sticky.clientWidth * quer) * GEBAEUDE_SKALIERUNG);
      const h = Math.round(sticky.clientHeight * (lateral ? querFuellung : laengs) * GEBAEUDE_SKALIERUNG);

      // Die Tiefe des Koerpers spannt die Kante in Drehrichtung auf: bei
      // senkrechter Drehachse die Breite, sonst die Hoehe.
      depth = bodyRadius(lateral ? w : h, sides) * 2;
      flaecheW = w;
      setCube({ w, h, stageW: sticky.clientWidth, stageH: sticky.clientHeight });

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

      // Dach/Sockel gehoeren zum geschlossenen Baukoerper - steht eine
      // Facette einzeln aufgeklappt (volle Breite, kein Gebaeude-Kontext
      // mehr sichtbar), stoeren sie nur und werden ausgeblendet.
      if (glWrapRef.current) glWrapRef.current.style.visibility = offen ? 'hidden' : 'visible';

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

      // Saeulen: eine je Nahtstelle zwischen zwei Facetten, auf halbem Winkel
      // zwischen den Nachbarn positioniert (Versatz 0.5 Schritt). Sie drehen
      // sich mit dem Koerper mit - anders als Sockel/Dach, die fest stehen -
      // und markieren so visuell, wo eine Facette endet und die naechste
      // beginnt. Beim Aufklappen ausgeblendet: nur eine Facette ist dann
      // sichtbar, eine einzelne Saeule daneben wuerde verloren wirken.
      //
      // `radius` ist der Apothem (Abstand Zentrum-Flaechenmitte), an dem die
      // Facetten kantengenau aneinanderstossen. Der Punkt, an dem sich zwei
      // Facetten beruehren, liegt aber nicht auf diesem Kreis, sondern auf
      // dem groesseren Umkreis durch die Eckpunkte (Umkreisradius = Apothem /
      // cos(halber Aussenwinkel)) - stuende die Saeule nur beim Apothem-
      // Radius, laege sie hinter der tatsaechlichen Kante und waere von der
      // Kamera aus verdeckt. Ein minimaler Vorsprung (3%) reicht gegen
      // Z-Fighting an der Kante - 12% (voriger Wert) liess die Saeule
      // sichtbar vor der Wand schweben statt darin zu sitzen.
      // Saeulen sind echte WebGL-Geometrie (ArchitectureGL) - dieselbe
      // Rechnung wie vorher fuer die CSS-transforms, nur als Argumente an
      // die imperative setColumns()-Methode statt als style.transform. Das
      // Aus-/Einblenden beim Aufklappen (offen) passiert schon eine Ebene
      // hoeher ueber glWrapRef.style.visibility, siehe oben - hier nur noch
      // die Kantenabschneidung (CULL_DEG) je Saeule.
      const colRadius = (radius / Math.cos(Math.PI / sides)) * 1.03;
      const colDegs = Array.from({ length: sides }, (_, s) => kuerzesterWeg(p - s + 0.5) * step);
      // faceDegs: derselbe Winkel wie fuer Huelle/Inhaltsflaeche je Seite
      // (siehe shellRefs/faceRefs weiter unten) - ArchitectureGL braucht sie,
      // um unsichtbare Wand-Ebenen an genau denselben Stellen zu platzieren,
      // damit Saeulen/Rippen dahinter echt (pixelgenau) verdeckt werden
      // koennen, siehe setColumns() in ArchitectureGL.jsx.
      const faceDegs = Array.from({ length: sides }, (_, s) => kuerzesterWeg(p - s) * step);
      architectureRef.current?.setColumns(colDegs, colRadius, -radius, radius, faceDegs);

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
        // KEIN applyShade hier (anders als shell): der brightness()-Filter
        // erzwingt eine eigene Rasterisierungs-Ebene (siehe Kommentar bei
        // applyShade oben) - auf Lesetext las sich das als leichte
        // Unschaerfe, kombiniert mit dem abgedunkelten Ton an den Raendern
        // wirkten die Randfolien dadurch "blasser" als die Frontflaeche.
        // Inhalt muss ueberall gleich scharf/lesbar bleiben.

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
      // Programmatisches Oeffnen von aussen (Kopfzeilen-Anker, siehe
      // scrollToSection.js). Kein synthetisches 'click' auf dem Overlay mehr:
      // der reagiert seit dem Ziehen-Feature nur noch auf Pointer-Events
      // (pointerdown/-move/-up), ein echtes 'click' dort loest nichts mehr
      // aus. Ein eigenes Event auf der Flaeche selbst umgeht das sauber.
      const onExternOeffnen = () => klickAuf(i);

      overlay.addEventListener('pointerdown', onPointerDown);
      overlay.addEventListener('pointermove', ziehBewegen);
      overlay.addEventListener('pointerup', onPointerUp);
      overlay.addEventListener('pointercancel', onPointerCancel);
      closeBtn?.addEventListener('click', onClose);
      face.addEventListener('rotary-open', onExternOeffnen);
      abmeldeliste.push(() => {
        overlay.removeEventListener('pointerdown', onPointerDown);
        overlay.removeEventListener('pointermove', ziehBewegen);
        overlay.removeEventListener('pointerup', onPointerUp);
        overlay.removeEventListener('pointercancel', onPointerCancel);
        closeBtn?.removeEventListener('click', onClose);
        face.removeEventListener('rotary-open', onExternOeffnen);
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

  // Saeulenbreite: deutlich kraeftiger als der erste Versuch. Schmale
  // Saeulen trafen die Nahtstelle nur an einem mathematischen Punkt - bei
  // jedem Blickwinkel abseits der exakten Front klaffte eine sichtbare
  // Luecke zur Wand (Parallaxe zwischen der flachen Facette und der
  // ebenfalls flachen Saeule an ihrer Kante). Eine breite Saeule ueberdeckt
  // die Nahtstelle stattdessen grosszuegig auf beiden Seiten.
  //
  // Saeulen selbst sind jetzt echte WebGL-Geometrie (siehe ArchitectureGL),
  // nicht mehr eigene CSS-3D-Elemente - nur die Masse (in denselben CSS-
  // Pixel-Einheiten wie der Rest der Buehne) werden hier noch gebraucht, um
  // die Saeulen-Meshes in passender Groesse aufzubauen.
  // Schlanker als zuvor (0.095 -> 0.08), damit die Saeule als elegantes
  // Architekturelement liest statt als "oversized golden pillar" - aber
  // nicht duenner: unter diesem Wert klafft bei Nicht-Frontblickwinkeln
  // wieder die oben beschriebene Nahtstelle sichtbar auf.
  const colW = Math.max(30, Math.round((cube.w || 0) * 0.08));
  // Kapitell nur noch dezent ausgestellt (1.3 -> 1.16) - Messing bleibt so
  // auf "Details an Basis/Kapitell" beschraenkt statt eine breite goldene
  // Kappe zu bilden.
  const colCapW = Math.round(colW * 1.16);
  const colCapH = Math.max(12, Math.round(colW * 0.32));

  // Dach und Sockel: echtes WebGL statt flacher SVG-Naeherung (siehe
  // ArchitectureGL.jsx). perspektivePx muss exakt dem CSS perspective-Wert
  // von sticky (weiter unten) entsprechen, circumRadius dem tatsaechlichen
  // 3D-Umkreisradius der Trommel (derselbe Wert, der auch die Saeulen
  // positioniert) - nur so projiziert die WebGL-Kamera deckungsgleich mit
  // der CSS-3D-Buehne.
  const perspektivePx = lateral ? 2600 : 1250;
  const facettenRadius = cube.w && cube.h ? bodyRadius(lateral ? cube.w : cube.h, sides) : 0;
  const circumRadius = facettenRadius / Math.cos(Math.PI / sides);
  const drumHalfHeight = cube.h / 2;
  // Der Koerper (boxRef) traegt selbst translateZ(-facettenRadius), damit
  // seine Frontflaeche auf z = 0 zu liegen kommt - die eigentliche
  // Drehachse aller Facetten/Saeulen sitzt also nicht bei z = 0, sondern
  // bei z = -facettenRadius. Dach und Sockel sitzen jetzt auf DERSELBEN
  // Achse mit DEMSELBEN Radius wie die Saeulen (ringRadius, siehe unten,
  // identische Formel wie colRadius in apply()) - dadurch sind es in
  // echten 3D-Weltkoordinaten dieselben Punkte, an denen Saeulenkopf/-fuss
  // und Dach-/Sockelrand zusammentreffen. Das ist projektions-unabhaengig:
  // zwei identische 3D-Punkte fallen auf JEDER Kamera/Perspektive exakt
  // zusammen, nicht nur zufaellig aus einem bestimmten Blickwinkel wie bei
  // der vorherigen, nur ueber den Radius empirisch angenaeherten Loesung
  // (domeBaseRadius = circumRadius * 0.62, zentriert auf z = 0) - die sah
  // von vorne meist passend aus, klaffte aber bei anderen Rotationswinkeln
  // wieder, weil Saeule und Dach/Sockel schlicht verschiedene Kreise waren.
  const centerOffsetZ = -facettenRadius;
  const ringRadius = circumRadius * 1.03;
  // Verschiebt man Dach/Sockel/Saeulen auf die tatsaechliche Drehachse
  // (centerOffsetZ statt 0), sitzen sie weiter von der Kamera entfernt als
  // die jeweils aktive Frontflaeche (die exakt auf z = 0 faellt und deshalb
  // unverzerrt/1:1 projiziert). Dieselbe Welt-Hoehe (drumHalfHeight) wirkt
  // dadurch auf dem Bildschirm KLEINER als auf der Wand - das Dach ragte
  // sichtbar in die Anzeigetafel hinein, obwohl Saeule und Dachrand in
  // echten 3D-Koordinaten exakt zusammenfielen. Kompensiert durch eine
  // Hochskalierung der Hoehe um genau den Faktor, den die groessere Distanz
  // an Projektionsgroesse kostet (perspectivePx zu perspectivePx+Distanz) -
  // damit landet die Kante auf dem Bildschirm wieder da, wo sie bei
  // unverzerrter (1:1) Projektion waere. Radius (X/Z) bleibt unangetastet:
  // die Beruehrung Saeule/Dach/Sockel haengt nur von Y und Radius ab, beide
  // fuer alle drei gemeinsam skaliert/gleich - die Einheit bleibt exakt
  // verschweisst, nur insgesamt sichtbar "hochskaliert".
  // +4% Sicherheitsspanne: die Kompensation ist exakt fuer Punkte auf der
  // Kamera-Blickachse (x = 0), Text sitzt aber nicht immer exakt dort -
  // ohne Puffer blieb ein Haarriss-Ueberlapp an den hoechsten Buchstaben.
  const drumHeightScale = ((perspektivePx + facettenRadius) / perspektivePx) * 1.04;
  const effectiveDrumHalfHeight = drumHalfHeight * drumHeightScale;

  // Der Kompensations-Trick oben gleicht nur EINEN Fall exakt aus: die
  // Frontflaeche bei deg = 0 (z = 0, unverzerrte 1:1-Projektion). Jede
  // andere sichtbare Flaeche steht bereits selbst schraeg (z < 0, durch die
  // eigene Rotation), ihre projizierte Hoehe schrumpft dadurch natuerlich
  // mit dem Drehwinkel - waehrend Dach/Sockel als feste Geometrie konstant
  // gross bleiben. Ergebnis: an der Frontflaeche schliesst alles buendig,
  // an den Seitenflaechen oeffnet sich eine Luecke zwischen Folienkante und
  // Dach-/Sockelrand, die mit dem Winkel waechst (Hintergrund blitzt durch).
  // Da Y-Rotation die Hoehe eines Punkts nicht veraendert, nur seine Tiefe,
  // gilt fuer JEDE Flaeche bei JEDEM Winkel: ihre Tiefe liegt IMMER
  // zwischen z = 0 (Front) und z = -facettenRadius (90 Grad - exakt die
  // Tiefe, auf der auch Dach/Sockel sitzen). Skaliert man die Folienhoehe
  // selbst um denselben Faktor wie Dach/Sockel (drumHeightScale), erreicht
  // ihre Projektion bei 90 Grad exakt die von Dach/Sockel (beide auf
  // derselben Tiefe) - und uebertrifft sie bei jedem flacheren Winkel, weil
  // die Folie dort naeher an der Kamera liegt als Dach/Sockel. Die Luecke
  // ist damit fuer den gesamten sichtbaren Drehbereich geschlossen, nicht
  // nur zufaellig an einem Punkt. FitToFace schneidet ueberschuessige Hoehe
  // nie zu (MAX_SCALE = 1, skaliert nur runter) - der Inhalt bleibt also
  // unverzerrt, die Flaeche bekommt nur mehr Luft oben/unten.
  const faceHeightBoost = drumHeightScale;
  const boostedFaceH = cube.h ? Math.round(cube.h * faceHeightBoost) : cube.h;
  const faceVOffset = cube.h ? -(boostedFaceH - cube.h) / 2 : 0;


  const faceStyle = {
    width: cube.w ? `${cube.w}px` : '100%',
    height: cube.h ? `${cube.h}px` : '94vh',
    background: 'hsl(var(--card))',
    // Auf dem Handy fuellt die Seite den Bildschirm - ein Rahmen waere dort
    // nur eine Linie am Displayrand und kostet sichtbare Flaeche.
    //
    // Rahmenfarbe auf den Gold-Ton der Architektur (--accent, dieselbe
    // Farbe wie Saeulenkapitell/Gebaelk und die Eckmarkierung in
    // FaceOrnament) statt des neutralen --border - die Flaeche liest damit
    // leichter als in den Baukoerper eingesetzte Tafel statt als
    // eigenstaendige, nur zufaellig davorschwebende Karte. Die beiden
    // inset-Schatten (oben/unten) deuten eine leichte Fassung/Nische an -
    // bewusst sehr sparsam (kurze, weiche Verlaeufe), nur ein Hauch mehr
    // Integration, keine neue Rahmen-Optik.
    border: mobile ? 'none' : '1px solid hsl(var(--accent) / 0.3)',
    boxShadow: mobile
      ? 'none'
      : [
          '0 0 0 1px hsl(var(--accent) / 0.22)',
          '0 30px 70px -30px hsl(217 62% 12% / 0.45)',
          'inset 0 14px 20px -22px hsl(217 62% 12% / 0.4)',
          'inset 0 -10px 16px -20px hsl(217 62% 12% / 0.28)',
        ].join(', '),
    backfaceVisibility: 'hidden',
    willChange: 'transform, filter',
  };

  // Nur Breite und Versatz animieren. Die Drehung wird pro Frame gesetzt; ein
  // Uebergang darauf liefe der Position hinterher.
  //
  // Hoehe/marginTop ueberschreiben faceStyle bewusst: die Inhaltsflaeche
  // braucht die hochskalierte (boostedFaceH) Hoehe, um bei jedem
  // Rotationswinkel bis an Dach/Sockel zu reichen (siehe Kommentar bei
  // faceHeightBoost oben) - die Huelle (shell, nutzt faceStyle direkt)
  // bleibt bei cube.h, sie hat keine Lesbarkeits-/Anschluss-Anforderung.
  // marginTop haelt die vergroesserte Flaeche exakt um dieselbe Mitte
  // zentriert wie zuvor (die auch fuer Saeulen/Dach/Sockel gilt).
  const inhaltBase = {
    ...faceStyle,
    height: cube.h ? `${boostedFaceH}px` : faceStyle.height,
    marginTop: `${faceVOffset}px`,
    transformStyle: 'preserve-3d',
  };
  const inhaltStyle = expandTo
    ? { ...inhaltBase, transition: 'width 420ms cubic-bezier(0.4, 0, 0.2, 1), margin-left 420ms cubic-bezier(0.4, 0, 0.2, 1)' }
    : inhaltBase;

  return (
    // data-rotary-root/-index: Ankerlinks in der Kopfzeile (#process,
    // #beratung etc.) muessen ihre Zielflaeche finden koennen, um sie per
    // Klick zu oeffnen - siehe scrollToSection().
    // pt-16/lg:pt-20 gleicht exakt die Hoehe des fixierten Headers aus
    // (h-16/lg:h-20, siehe Header.jsx). Ein frueherer Versuch vergroesserte
    // dies auf pt-24/lg:pt-28, um der Kuppelspitze/UN-Flagge mehr Luft zu
    // geben - erzeugte dabei aber einen sichtbaren Farbbruch: der
    // zusaetzliche Abstand liegt AUSSERHALB der Buehne (stickyRef), zeigt
    // also den normalen Seitenhintergrund (cremeweiss), nicht den
    // atmosphaerischen blauen Buehnenhintergrund - direkt ueber der Kuppel
    // hoerte das Blau dadurch sichtbar hart auf. Zurueck auf den exakten
    // Header-Ausgleich; mehr Luftraum kommt stattdessen ueber
    // GEBAEUDE_SKALIERUNG (siehe unten) - der bleibt INNERHALB der Buehne,
    // vom blauen Hintergrund gedeckt.
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
          perspective: `${perspektivePx}px`,
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div ref={backdropRef} className="absolute inset-0">
          <RotatingBackdrop />
        </div>

        {/* Dach+Sockel: eigener, statischer WebGL-Layer VOR der Trommel im
            DOM - liegt damit HINTER dem Inhalt. Der undurchsichtige
            Facetten-Hintergrund deckt ihn dadurch immer vollstaendig ab,
            unabhaengig davon, was auf dieser Ebene passiert (siehe
            ArchitectureGL.jsx). Nur die Saeulen (weiter unten, NACH der
            Trommel) duerfen vor dem Inhalt liegen - sie markieren die
            Nahtstelle zwischen zwei Facetten. */}
        {cube.h > 0 && ringRadius > 0 && (
          <ArchitectureBackGL
            stageW={cube.stageW}
            stageH={cube.stageH}
            perspectivePx={perspektivePx}
            ringRadius={ringRadius}
            drumHalfHeight={effectiveDrumHalfHeight}
            centerOffsetZ={centerOffsetZ}
            sides={sides}
            colCapWidth={colCapW}
          />
        )}

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

        {/* Echtes 3D-Rahmengeruest: nur noch Saeulen+Rippen, eigener WebGL-
            Layer NACH box im DOM (siehe ArchitectureGL.jsx - Dach/Sockel
            sitzen als eigener Layer VOR box, siehe oben). Saeulen sitzen an
            der Nahtstelle zwischen zwei Facetten und muessen praktisch immer
            vor dem Inhalt liegen - anders als Dach/Sockel, die nichts vor
            dem Inhalt zu suchen haben. Wird wie die Huelle ausgeblendet,
            wenn eine Facette einzeln aufgeklappt ist. */}
        {cube.h > 0 && ringRadius > 0 && (
          // pointer-events-none: ohne das faengt dieser volle Wrapper (liegt
          // ueber der gesamten Buehne, spaeter im DOM als der Klick-Faenger
          // der Facetten) jeden Klick/Drag ab, bevor er das Overlay
          // erreicht - Rotation per Drag liess sich dadurch gar nicht mehr
          // auslösen (elementFromPoint traf immer diesen Wrapper statt
          // [data-rotary-overlay]).
          <div ref={glWrapRef} className="pointer-events-none absolute inset-0">
            <ArchitectureGL
              ref={architectureRef}
              stageW={cube.stageW}
              stageH={cube.stageH}
              perspectivePx={perspektivePx}
              ringRadius={ringRadius}
              drumHalfHeight={effectiveDrumHalfHeight}
              centerOffsetZ={centerOffsetZ}
              sides={sides}
              colWidth={colW}
              colCapWidth={colCapW}
              colCapHeight={colCapH}
            />
          </div>
        )}
      </div>
    </div>
  );
}
