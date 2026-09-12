import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RotatingBackdrop from '@/components/lab/RotatingBackdrop';

gsap.registerPlugin(ScrollTrigger);

// Winkel zwischen zwei benachbarten Flaechen. 90 Grad gibt die harte
// Wuerfelkante; flachere Werte wirken weicher, lassen aber die Nachbarflaeche
// staendig mit im Bild stehen.
const STEP_DEG = 90;
// Ab diesem Abstand zur Frontflaeche wird eine Flaeche aus dem DOM-Layout
// genommen. 1.15 statt 1.0, damit die wegkippende Flaeche nicht schon
// verschwindet, waehrend ihre Kante noch sichtbar ist.
const CULL = 1.15;

/**
 * Skaliert seinen Inhalt so weit herunter, dass er auf eine Trommelflaeche
 * passt. Die echten Sections der Seite sind fuer eine Trommel zu hoch - eine
 * Flaeche kann nicht scrollen, sonst bricht die Rotation.
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
      // clientHeight schliesst das Padding mit ein. Das muss raus, sonst
      // skaliert der Inhalt auf die volle Flaeche und schiebt sich unter den
      // fixierten Header.
      const cs = getComputedStyle(outer);
      const available =
        outer.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const needed = inner.scrollHeight;
      if (available <= 0 || !needed) return;
      setScale(Math.min(1, available / needed));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    // pt-20 haelt die Flaeche unter dem fixierten Header frei.
    <div
      ref={outerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden pb-8 pt-20"
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
 * Scroll-getriebene 3D-Trommel.
 *
 * Jedes Kind wird zu einer Flaeche. Beim Scrollen kippt die aktuelle Flaeche
 * nach oben weg und die naechste von unten herein. Statt eines geschlossenen
 * Prismas mit fester Flaechenzahl werden immer nur die Nachbarn der aktuellen
 * Flaeche gerendert - so bleibt die harte 90-Grad-Kante erhalten, egal wie
 * viele Sections dranhaengen.
 */
export default function RotaryStage({ children }) {
  const panels = React.Children.toArray(children);
  const rootRef = useRef(null);
  const stickyRef = useRef(null);
  const drumRef = useRef(null);
  const backdropRef = useRef(null);
  const faceRefs = useRef([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useLayoutEffect(() => {
    if (reduced || panels.length === 0) return;
    const root = rootRef.current;
    const sticky = stickyRef.current;
    const drum = drumRef.current;
    if (!root || !sticky || !drum) return;

    const steps = Math.max(1, panels.length - 1);
    let radius = sticky.clientHeight / 2;
    let drift = 0;

    const apply = (pos) => {
      // Halber Flaechenabstand als Tiefe: bei 90 Grad liegt die Frontflaeche
      // damit exakt buendig auf z = 0.
      drum.style.transform = `translateZ(${-radius}px)`;

      faceRefs.current.forEach((face, i) => {
        if (!face) return;
        const d = pos - i;
        if (Math.abs(d) > CULL) {
          face.style.visibility = 'hidden';
          return;
        }
        face.style.visibility = 'visible';
        face.style.transform = `rotateX(${d * STEP_DEG}deg) translateZ(${radius}px)`;
        // Wegkippende Flaechen werden abgedunkelt statt nur transparent:
        // eine halbtransparente Flaeche laesst den Hintergrund durchscheinen
        // und der Text darunter wird unlesbar.
        const f = Math.min(1, Math.abs(d));
        face.style.opacity = String(1 - f * 0.65);
        face.style.filter = `brightness(${1 - f * 0.35})`;
      });

      const backdrop = backdropRef.current;
      if (backdrop) {
        backdrop.style.setProperty('--spin', `${pos * 42 + drift}deg`);
        backdrop.style.setProperty('--tint', String(pos / steps));
      }
    };

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => apply(self.progress * steps),
      onRefresh: (self) => {
        radius = sticky.clientHeight / 2;
        apply(self.progress * steps);
      },
    });

    // Eigenlauf des Hintergrunds: dreht auch dann weiter, wenn nicht
    // gescrollt wird, sonst wirkt die Seite im Stillstand tot.
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
  }, [reduced, panels.length]);

  // Ohne Bewegung: schlichter Stapel, keine Trommel, kein Pinning.
  if (reduced) {
    return <div>{panels.map((p, i) => <div key={i}>{p}</div>)}</div>;
  }

  return (
    <div ref={rootRef} style={{ height: `${panels.length * 100}vh` }}>
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ perspective: '1600px', perspectiveOrigin: '50% 50%' }}
      >
        <div ref={backdropRef} className="absolute inset-0">
          <RotatingBackdrop />
        </div>

        <div
          ref={drumRef}
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              ref={(el) => { faceRefs.current[i] = el; }}
              className="absolute inset-0"
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
              }}
            >
              <FitToFace>{panel}</FitToFace>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
