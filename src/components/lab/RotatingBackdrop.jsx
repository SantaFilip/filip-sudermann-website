import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import mondKarte from '@/assets/moon-map.jpg';

/**
 * Nachthimmel hinter dem Gebaeude.
 *
 * Der Himmel dreht mit dem Gebaeude, als kreiste die Kamera um den Bau: er
 * liegt unendlich weit hinter dem Gebaeude und laeuft deshalb gegen die
 * Frontflaeche. Ein Grad Drehung verschiebt ihn um perspektive * pi / 180
 * Pixel - dieselbe Brennweite, mit der die Buehne (CSS perspective) und
 * ArchitectureGL rechnen. Ein voller Umlauf ist damit ein 360-Grad-Rundhimmel,
 * auf dem Mond und Milchstrasse genau einmal vorkommen; die Sterne liegen auf
 * einer bildschirmbreiten Kachel, die sich nahtlos wiederholt.
 *
 * Gesteuert wird ueber setDreh(grad) per ref, pro Frame von der Buehne
 * aufgerufen. --tint (0 bis 1, von der Buehne auf das Elternelement
 * geschrieben) blendet am Ende in den Grundton der Seite ueber.
 */

// Position bei Drehwinkel 0: oben rechts neben dem rechten Turm, auf der
// Seite, von der das Hauptlicht in ArchitectureGL kommt.
const MOND_X = 0.93;
// Der Himmel reicht bis hinter die Kopfleiste - 0.18 haelt den Mond
// darunter im freien Himmel.
const MOND_Y = 0.18;
const MILCHSTRASSE_X = 0.32;

// Deterministischer Zufall: jede Seite zeigt denselben Sternenhimmel.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Feiner Sternenstaub: viele kleine, schwache, nicht funkelnde Punkte - gibt
// dem Himmel Tiefe, ohne unruhig zu werden.
function erzeugeStaub(anzahl) {
  const rnd = mulberry32(7331);
  return Array.from({ length: anzahl }, () => {
    const x = rnd() * 100;
    const y = Math.pow(rnd(), 1.4) * 90;
    return { x, y, r: 0.35 + rnd() * 0.35, hell: (0.18 + rnd() * 0.3) * (1 - (y / 90) * 0.6) };
  });
}

function erzeugeSterne(anzahl) {
  const rnd = mulberry32(20260915);
  return Array.from({ length: anzahl }, () => {
    const x = rnd() * 100;
    // Nach oben gewichtet: zum Horizont hin weniger und schwaechere Sterne.
    const y = Math.pow(rnd(), 1.7) * 92;
    const horizontDaempfung = 1 - Math.pow(y / 92, 2) * 0.75;
    const gross = rnd() > 0.93;
    return {
      x,
      y,
      r: gross ? 1.3 + rnd() * 0.9 : 0.5 + rnd() * 0.7,
      hell: Math.max(0.12, (0.35 + rnd() * 0.65) * horizontDaempfung),
      // Leicht gefaerbt: die meisten weiss, einige blaeulich, wenige warm.
      farbe: rnd() > 0.82 ? '#cfdcff' : rnd() > 0.9 ? '#ffe9c4' : '#ffffff',
      dauer: 2.8 + rnd() * 4.5,
      verzug: -rnd() * 7,
      funkelt: gross || rnd() > 0.55,
    };
  });
}

const STERNE = erzeugeSterne(230);
const STAUB = erzeugeStaub(420);

/**
 * Rendert den Mond einmalig als beleuchtete Kugel mit echter Mondtextur und
 * gibt das Ergebnis als Bild zurueck. Der WebGL-Kontext wird danach sofort
 * freigegeben - der Mond dreht sich von der Erde aus nie, ein stehendes Bild
 * reicht und belegt keinen dauerhaften Kontext neben Gebaeude und Globus.
 */
function rendereMond(pixel) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      mondKarte,
      (karte) => {
        if ('colorSpace' in karte) karte.colorSpace = THREE.SRGBColorSpace;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1);
        renderer.setSize(pixel, pixel, false);

        const szene = new THREE.Scene();
        // Enges Sichtfeld wie bei einem Teleobjektiv: kaum perspektivische
        // Verzerrung, die Kugel fuellt das Bild knapp.
        const kamera = new THREE.PerspectiveCamera(12, 1, 0.1, 100);
        kamera.position.z = 9.8;

        const geo = new THREE.SphereGeometry(1, 96, 64);
        const mat = new THREE.MeshStandardMaterial({ map: karte, roughness: 1, metalness: 0 });
        const kugel = new THREE.Mesh(geo, mat);
        // Mitte der Karte (Laenge 0) zur Kamera drehen: die vertraute
        // Vorderseite mit den Mondmeeren.
        kugel.rotation.y = -Math.PI / 2;
        szene.add(kugel);

        // Sonnenlicht von rechts oben, fast aus Blickrichtung: kurz vor
        // Vollmond, nur eine schmale Schattensichel links unten.
        // Die Mondtextur ist dunkel (Albedo wie Asphalt) - erst mit viel
        // Licht erscheint der Mond so hell, wie er am Nachthimmel wirkt.
        const sonne = new THREE.DirectionalLight(0xfffaf0, 7.5);
        sonne.position.set(1.1, 0.55, 2.4);
        szene.add(sonne);
        // Erdschein: die Nachtseite ist nie ganz schwarz.
        szene.add(new THREE.AmbientLight(0x8fa3c8, 0.05));

        renderer.render(szene, kamera);
        const bild = renderer.domElement.toDataURL('image/png');

        geo.dispose();
        mat.dispose();
        karte.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        resolve(bild);
      },
      undefined,
      reject,
    );
  });
}

// Bringt eine Verschiebung auf den kuerzesten Weg innerhalb eines Umlaufs.
const umbrechen = (wert, umlauf) => {
  const x = ((wert % umlauf) + umlauf) % umlauf;
  return x > umlauf / 2 ? x - umlauf : x;
};

function Sternkachel() {
  return (
    <svg className="h-full w-1/2 shrink-0 overflow-visible" preserveAspectRatio="none">
      {STAUB.map((s, i) => (
        <circle key={`d${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#dfe6ff" opacity={s.hell} />
      ))}
      {STERNE.map((s, i) => (
        <g
          key={i}
          className={s.funkelt ? 'rb-stern' : undefined}
          style={{
            opacity: s.hell,
            '--hell': s.hell,
            '--dauer': `${s.dauer}s`,
            '--verzug': `${s.verzug}s`,
          }}
        >
          {s.r > 1.2 && (
            <circle cx={`${s.x}%`} cy={`${s.y}%`} r={s.r * 3.2} fill="url(#rb-glanz)" opacity="0.35" />
          )}
          <circle cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={s.farbe} />
        </g>
      ))}
    </svg>
  );
}

const RotatingBackdrop = forwardRef(function RotatingBackdrop({ perspektive = 2600 }, ref) {
  const wurzelRef = useRef(null);
  const sterneRef = useRef(null);
  const mondRef = useRef(null);
  const milchstrasseRef = useRef(null);
  const breiteRef = useRef(0);
  const drehRef = useRef(0);
  const [mondBild, setMondBild] = useState(null);

  const anwenden = () => {
    const breite = breiteRef.current;
    if (!breite) return;
    const umlauf = 2 * Math.PI * perspektive;
    // Positiv: laeuft die Frontflaeche nach links, wandert der Himmel nach
    // rechts - wie die Rueckseite der Trommel.
    const versatz = drehRef.current * ((perspektive * Math.PI) / 180);

    const kachel = ((versatz % breite) + breite) % breite;
    if (sterneRef.current) sterneRef.current.style.transform = `translate3d(${kachel - breite}px, 0, 0)`;

    // Objekte auf dem Rundhimmel: so umbrechen, dass sie immer auf der Seite
    // des Umlaufs stehen, die der Bildmitte am naechsten liegt.
    const setze = (el, startX) => {
      if (!el) return;
      const zurMitte = breite * (0.5 - startX);
      const x = umbrechen(versatz - zurMitte, umlauf) + zurMitte;
      el.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    setze(mondRef.current, MOND_X);
    setze(milchstrasseRef.current, MILCHSTRASSE_X);
  };

  useImperativeHandle(ref, () => ({
    setDreh(grad) {
      drehRef.current = grad;
      anwenden();
    },
  }));

  useEffect(() => {
    const wurzel = wurzelRef.current;
    if (!wurzel) return undefined;
    const messen = () => {
      breiteRef.current = wurzel.clientWidth;
      anwenden();
    };
    messen();
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(wurzel);
    return () => beobachter.disconnect();
  }, [perspektive]);

  useEffect(() => {
    let aktiv = true;
    const pixel = Math.round(72 * Math.min(window.devicePixelRatio || 1, 2));
    rendereMond(pixel)
      .then((bild) => { if (aktiv) setMondBild(bild); })
      .catch(() => {});
    return () => { aktiv = false; };
  }, []);

  return (
    // KEINE Startwerte fuer --tint hier setzen: die Buehne schreibt sie auf
    // das Elternelement, eine eigene Deklaration wuerde den geerbten Wert
    // ueberschatten.
    <div
      ref={wurzelRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{`
        @keyframes rb-funkeln {
          0%, 100% { opacity: var(--hell); }
          50% { opacity: calc(var(--hell) * 0.35); }
        }
        .rb-stern { animation: rb-funkeln var(--dauer) ease-in-out var(--verzug) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rb-stern { animation: none; }
        }
      `}</style>
      <svg className="absolute h-0 w-0">
        <defs>
          <radialGradient id="rb-glanz">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Himmelsverlauf: tiefes Navy im Zenit, zum Horizont heller. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            hsl(222 58% 5%) 0%,
            hsl(220 55% 8%) 35%,
            hsl(218 48% 13%) 70%,
            hsl(216 40% 19%) 100%)`,
        }}
      />

      {/* Milchstrasse: ein schwaches, schraeges Band an fester Stelle des Rundhimmels. */}
      <div ref={milchstrasseRef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${MILCHSTRASSE_X * 100 - 70}%`,
            width: '140%',
            opacity: 0.24,
            background: `linear-gradient(118deg,
              transparent 22%,
              hsl(220 40% 70% / 0.18) 38%,
              hsl(230 35% 80% / 0.28) 46%,
              hsl(220 40% 70% / 0.16) 54%,
              transparent 70%)`,
            maskImage: 'radial-gradient(ellipse 50% 70% at 50% 25%, #000 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 70% at 50% 25%, #000 30%, transparent 100%)',
          }}
        />
      </div>

      {/* Sterne: zwei identische Kacheln nebeneinander, nahtlos umgebrochen. */}
      <div ref={sterneRef} className="absolute inset-y-0 left-0 flex w-[200%] will-change-transform">
        <Sternkachel />
        <Sternkachel />
      </div>

      {/* Strahlerschein am Horizont: die Fassadenbeleuchtung von unten wirft
          warmes Licht in den Dunst hinter dem Sockel. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '55%',
          background: `radial-gradient(ellipse 60% 85% at 50% 100%,
            hsl(38 65% 62% / 0.32) 0%,
            hsl(34 50% 40% / 0.16) 38%,
            transparent 75%)`,
        }}
      />

      {/* Dunst am Horizont: schluckt die untersten Sterne und laesst den
          Uebergang zum Boden weich statt als harte Kante enden. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '22%',
          background: 'linear-gradient(0deg, hsl(216 35% 16% / 0.9) 0%, transparent 100%)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, hsl(222 60% 4% / 0.55) 100%)',
        }}
      />

      {/* Mond ueber der Vignette: eine Lichtquelle wird nicht abgedunkelt.
          Hof und Scheibe wandern gemeinsam mit dem Himmel. */}
      <div ref={mondRef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute"
          style={{
            left: `${MOND_X * 100}%`,
            top: `${MOND_Y * 100}%`,
            width: 'clamp(240px, 26vw, 420px)',
            height: 'clamp(240px, 26vw, 420px)',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle,
              hsl(215 40% 85% / 0.18) 0%,
              hsl(215 45% 65% / 0.07) 30%,
              transparent 70%)`,
          }}
        />
        {mondBild && (
          <img
            src={mondBild}
            alt=""
            className="absolute"
            style={{
              left: `${MOND_X * 100}%`,
              top: `${MOND_Y * 100}%`,
              width: 'clamp(40px, 4.2vw, 72px)',
              height: 'clamp(40px, 4.2vw, 72px)',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              // Leuchtsaum nur auf der beleuchteten Seite, wie Streulicht in
              // duenner Luft - keine gleichmaessige Neon-Korona.
              filter: 'drop-shadow(2px -1px 6px hsl(45 50% 92% / 0.45))',
            }}
          />
        )}
      </div>

      {/* Grundton der Seite, ueber den Scroll-Fortschritt eingeblendet. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 'var(--tint, 0)',
          background: `radial-gradient(ellipse 130% 100% at 50% 50%,
            hsl(var(--card)) 0%, hsl(var(--background)) 60%, hsl(40 30% 88%) 100%)`,
        }}
      />
    </div>
  );
});

export default RotatingBackdrop;
