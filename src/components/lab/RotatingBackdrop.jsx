import React from 'react';

/**
 * Nachthimmel hinter dem Gebaeude.
 *
 * Die Lichtfuehrung folgt der Szene in ArchitectureGL: das Hauptlicht kommt
 * von oben rechts (dort steht der Mond, kuehl-silbern), das Aufhelllicht von
 * unten (warme Fassadenstrahler - als Lichtschein am Horizont hinter dem
 * Sockel). Sterne sind oben am dichtesten und duennen zum Horizont, um den
 * Mond und ueber dem Strahlerschein aus, wie bei echtem Himmel.
 *
 * Der Himmel steht still: nur das Gebaeude dreht sich, --spin wird hier
 * bewusst nicht verwendet. --tint (0 bis 1, von der Buehne gesetzt) blendet
 * am Ende in den Grundton der Seite ueber.
 */

// Oben rechts im freien Himmel neben dem rechten Turm - dieselbe Seite, von
// der das Hauptlicht in ArchitectureGL kommt.
const MOND_X = 93;
const MOND_Y = 11;

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
  const staub = [];
  while (staub.length < anzahl) {
    const x = rnd() * 100;
    const y = Math.pow(rnd(), 1.4) * 90;
    const mondAbstand = Math.hypot((x - MOND_X) * 1.6, y - MOND_Y);
    if (mondAbstand < 14) continue;
    staub.push({ x, y, r: 0.35 + rnd() * 0.35, hell: (0.18 + rnd() * 0.3) * (1 - (y / 90) * 0.6) });
  }
  return staub;
}

function erzeugeSterne(anzahl) {
  const rnd = mulberry32(20260915);
  const sterne = [];
  while (sterne.length < anzahl) {
    const x = rnd() * 100;
    // Quadratisch nach oben gewichtet: zum Horizont hin weniger Sterne.
    const y = Math.pow(rnd(), 1.7) * 92;
    const mondAbstand = Math.hypot((x - MOND_X) * 1.6, y - MOND_Y);
    // Mondglanz ueberstrahlt schwache Sterne in seiner Naehe.
    if (mondAbstand < 9) continue;
    const mondDaempfung = Math.min(1, (mondAbstand - 9) / 22);
    const horizontDaempfung = 1 - Math.pow(y / 92, 2) * 0.75;

    const gross = rnd() > 0.93;
    const hell = (0.35 + rnd() * 0.65) * mondDaempfung * horizontDaempfung;
    sterne.push({
      x,
      y,
      r: gross ? 1.3 + rnd() * 0.9 : 0.5 + rnd() * 0.7,
      hell: Math.max(0.12, hell),
      // Leicht gefaerbt: die meisten weiss, einige blaeulich, wenige warm.
      farbe: rnd() > 0.82 ? '#cfdcff' : rnd() > 0.9 ? '#ffe9c4' : '#ffffff',
      dauer: 2.8 + rnd() * 4.5,
      verzug: -rnd() * 7,
      funkelt: gross || rnd() > 0.55,
    });
  }
  return sterne;
}

const STERNE = erzeugeSterne(230);
const STAUB = erzeugeStaub(420);

export default function RotatingBackdrop() {
  return (
    // KEINE Startwerte fuer --tint hier setzen: die Buehne schreibt sie auf
    // das Elternelement, eine eigene Deklaration wuerde den geerbten Wert
    // ueberschatten.
    <div
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

      {/* Milchstrasse: ein schwaches, schraeges Band, kein Effekt-Nebel. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.22,
          background: `linear-gradient(118deg,
            transparent 22%,
            hsl(220 40% 70% / 0.18) 38%,
            hsl(230 35% 80% / 0.28) 46%,
            hsl(220 40% 70% / 0.16) 54%,
            transparent 70%)`,
          maskImage: 'linear-gradient(180deg, #000 0%, #000 55%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 55%, transparent 90%)',
        }}
      />

      {/* Sterne */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <radialGradient id="rb-glanz">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
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

      {/* Mond liegt ueber der Vignette: eine Lichtquelle wird nicht abgedunkelt.
          Mondhof: weiter, kuehler Schein, der den Himmel um den Mond aufhellt. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${MOND_X}% ${MOND_Y}%,
            hsl(215 40% 85% / 0.20) 0%,
            hsl(215 45% 60% / 0.08) 14%,
            transparent 38%)`,
        }}
      />

      {/* Mond: leicht von unten links beschattet, weil das Licht von rechts oben kommt. */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${MOND_X}%`,
          top: `${MOND_Y}%`,
          width: 'clamp(34px, 3.6vw, 58px)',
          height: 'clamp(34px, 3.6vw, 58px)',
          transform: 'translate(-50%, -50%)',
          overflow: 'hidden',
          // Selbstleuchtend hell mit Randverdunklung, Lichtschwerpunkt oben
          // rechts - derselbe Einfall wie das Hauptlicht auf dem Gebaeude.
          background: `radial-gradient(circle at 60% 38%,
            #fffef8 0%, #f7f3e6 40%, #e6e0cc 75%, #cfc8b2 100%)`,
          boxShadow: `0 0 14px 3px hsl(45 60% 96% / 0.55),
                      0 0 46px 14px hsl(215 50% 85% / 0.22),
                      0 0 120px 40px hsl(215 50% 75% / 0.10)`,
        }}
      >
        {/* Mondmeere: weiche, unscharfe Flaechen statt harter Krater. */}
        {[
          { l: '18%', t: '22%', w: '34%', h: '28%', o: 0.2 },
          { l: '44%', t: '16%', w: '22%', h: '20%', o: 0.16 },
          { l: '30%', t: '52%', w: '30%', h: '24%', o: 0.14 },
          { l: '58%', t: '50%', w: '18%', h: '16%', o: 0.12 },
        ].map((m, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{ left: m.l, top: m.t, width: m.w, height: m.h, background: `rgba(128, 124, 110, ${m.o})`, filter: 'blur(1.5px)' }}
          />
        ))}
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
}
