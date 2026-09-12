import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RotatingBackdrop from '@/components/lab/RotatingBackdrop';

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
const CUBE_FILL_DESKTOP = 0.94;
const MOBILE_MAX = 767;

// Hochskalieren ist keine Option: der Inhalt liegt bereits auf voller
// Flaechenbreite, ein Faktor ueber 1 schiebt ihn seitlich aus der Flaeche
// heraus und die Kanten werden abgeschnitten. Die Flaeche wird stattdessen
// ueber die CSS-Regeln in index.css gefuellt, die dem Inhalt die ueberfluessige
// Hoehe nehmen.
const MAX_SCALE = 1;
// Vier Seiten bilden den geschlossenen Koerper. Jede Seite steht 90 Grad zur
// naechsten, die Tiefe entspricht damit exakt der Hoehe.
const SIDES = 4;

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
    // pt haelt den fixierten Header frei (h-16 mobil, h-20 ab lg), der Rest
    // ist bewusst knapp - die Section bringt ihre eigenen Seitenabstaende mit.
    <div
      ref={outerRef}
      className="rotary-face flex h-full w-full items-center justify-center overflow-hidden pb-4 pt-16 lg:pt-20"
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
export default function RotaryStage({ children }) {
  const panels = React.Children.toArray(children);
  const rootRef = useRef(null);
  const stickyRef = useRef(null);
  const boxRef = useRef(null);
  const backdropRef = useRef(null);
  const faceRefs = useRef([]);
  const shellRefs = useRef([]);
  const [cube, setCube] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

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
    if (reduced || panels.length === 0) return;
    const root = rootRef.current;
    const sticky = stickyRef.current;
    const box = boxRef.current;
    if (!root || !sticky || !box) return;

    const steps = Math.max(1, panels.length - 1);
    let size = 0;
    let drift = 0;

    const layout = () => {
      const fill = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches
        ? CUBE_FILL_MOBILE
        : CUBE_FILL_DESKTOP;
      size = Math.round(sticky.clientHeight * fill);
      setCube(size);
    };

    const apply = (pos) => {
      const radius = size / 2;
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
        const deg = (pos - s) * 90;
        shell.style.transform = `rotateX(${deg}deg) translateZ(${radius - 2}px)`;
        shell.style.filter = `brightness(${shade(deg)})`;
      });

      // Inhaltsseiten darueber.
      faceRefs.current.forEach((face, i) => {
        if (!face) return;
        const d = pos - i;
        const deg = d * 90;
        // Knapp ueber 90 Grad halten, damit die Seite erst verschwindet,
        // wenn sie wirklich hinter der Kante liegt.
        if (Math.abs(d) > 1.02) {
          face.style.visibility = 'hidden';
          return;
        }
        face.style.visibility = 'visible';
        face.style.transform = `rotateX(${deg}deg) translateZ(${radius}px)`;
        face.style.filter = `brightness(${shade(deg)})`;
      });

      const backdrop = backdropRef.current;
      if (backdrop) {
        backdrop.style.setProperty('--spin', `${pos * 42 + drift}deg`);
        backdrop.style.setProperty('--tint', String(pos / steps));
      }
    };

    layout();

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => apply(self.progress * steps),
      onRefresh: (self) => {
        layout();
        apply(self.progress * steps);
      },
    });

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
      gsap.ticker.remove(tick);
      st.kill();
    };
  }, [reduced, panels.length, mobile]);

  if (reduced) {
    return <div>{panels.map((p, i) => <div key={i}>{p}</div>)}</div>;
  }

  const faceStyle = {
    width: '100%',
    height: cube ? `${cube}px` : '94vh',
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
    <div ref={rootRef} style={{ height: `${panels.length * 100}vh` }}>
      <div
        ref={stickyRef}
        className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden"
        style={{ perspective: '1250px', perspectiveOrigin: '50% 50%' }}
      >
        <div ref={backdropRef} className="absolute inset-0">
          <RotatingBackdrop />
        </div>

        <div
          ref={boxRef}
          className="relative w-full"
          style={{
            height: cube ? `${cube}px` : '94vh',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Huelle: haelt den Koerper geschlossen, auch wo keine Section liegt. */}
          {Array.from({ length: SIDES }, (_, s) => (
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
              <FitToFace>{panel}</FitToFace>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
