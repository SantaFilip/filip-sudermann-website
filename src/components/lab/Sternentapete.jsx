import React, { useMemo } from 'react';

/*
 * Sternentapete
 * -------------
 * Halbtransparente Sterne als TAPETE, nicht als Galaxie: ein gezeichnetes,
 * sich wiederholendes Ornament im Halbversatz (half drop), wie es klassische
 * Wandbespannungen verwenden - nur dass das Motiv hier aus Gestirnen besteht.
 * Alles ist Vektor und wird prozedural als echte Geometrie erzeugt (Strahlen,
 * Ringe, Bahnen, Sternstaub), nicht als vereinfachtes Pixelmuster oder
 * CSS-Punktraster: dadurch ist es bei jeder Aufloesung und jedem Zoom scharf.
 *
 * Das Muster traegt zwei Farben des Hauses - Gold (--accent) fuer die
 * Gestirne, Nachtblau (--foreground) fuer die feinen Hilfslinien - und bleibt
 * durchgehend so transparent, dass der cremefarbene Grund und der Text
 * darueber ungestoert bleiben.
 */

// Fester Zufall: dieselbe Tapete bei jedem Rendern, jedem Build, auf jedem
// Geraet. Ein echtes Math.random() wuerde bei jedem Mount ein anderes Muster
// zeichnen - eine Tapete, die sich beim Neuladen aendert, waere keine.
function zufall(saat) {
  let a = saat >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Zackenstern mit n Spitzen. innen = Verhaeltnis des inneren zum aeusseren
// Radius; je kleiner, desto schlanker und schaerfer die Strahlen.
function sternPfad(cx, cy, aussen, innen, spitzen, drehung = 0) {
  const punkte = [];
  const schritt = Math.PI / spitzen;
  for (let i = 0; i < spitzen * 2; i += 1) {
    const r = i % 2 === 0 ? aussen : aussen * innen;
    const w = drehung + i * schritt - Math.PI / 2;
    punkte.push(`${(cx + Math.cos(w) * r).toFixed(2)},${(cy + Math.sin(w) * r).toFixed(2)}`);
  }
  return `M${punkte.join('L')}Z`;
}

// Vierstrahliger Funken: die schlanke Form, die ein Lichtpunkt in einer
// Optik erzeugt. Mit Bezierkurven statt Geraden, damit die Strahlen nach
// aussen duenn auslaufen statt als Dreieck zu enden.
function funkePfad(cx, cy, r, quer = 0.3) {
  const q = r * quer;
  return [
    `M${cx.toFixed(2)},${(cy - r).toFixed(2)}`,
    `C${(cx + q * 0.35).toFixed(2)},${(cy - q).toFixed(2)} ${(cx + q).toFixed(2)},${(cy - q * 0.35).toFixed(2)} ${(cx + r).toFixed(2)},${cy.toFixed(2)}`,
    `C${(cx + q).toFixed(2)},${(cy + q * 0.35).toFixed(2)} ${(cx + q * 0.35).toFixed(2)},${(cy + q).toFixed(2)} ${cx.toFixed(2)},${(cy + r).toFixed(2)}`,
    `C${(cx - q * 0.35).toFixed(2)},${(cy + q).toFixed(2)} ${(cx - q).toFixed(2)},${(cy + q * 0.35).toFixed(2)} ${(cx - r).toFixed(2)},${cy.toFixed(2)}`,
    `C${(cx - q).toFixed(2)},${(cy - q * 0.35).toFixed(2)} ${(cx - q * 0.35).toFixed(2)},${(cy - q).toFixed(2)} ${cx.toFixed(2)},${(cy - r).toFixed(2)}`,
    'Z',
  ].join('');
}

// Kachelmass. Der Halbversatz betraegt genau die halbe Hoehe - dadurch
// laeuft das Muster diagonal weiter und zeigt nicht die Reihen-und-Spalten-
// Strenge, an der man eine billige Kachel sofort erkennt.
const KACHEL_B = 420;
const KACHEL_H = 560;

function grossesMotiv(cx, cy, schluessel) {
  const r = 46;
  return (
    <g key={schluessel}>
      {/* Zwei gegeneinander geneigte Bahnen: die Ellipsen geben dem Motiv
          Tiefe, ohne dass ein einziger gefuellter Flaechenton noetig waere. */}
      <ellipse cx={cx} cy={cy} rx={r * 2.25} ry={r * 0.82} className="tapete-bahn" transform={`rotate(-21 ${cx} ${cy})`} />
      <ellipse cx={cx} cy={cy} rx={r * 2.25} ry={r * 0.82} className="tapete-bahn" transform={`rotate(21 ${cx} ${cy})`} />
      <ellipse cx={cx} cy={cy} rx={r * 1.52} ry={r * 1.52} className="tapete-bahn-fein" />
      <circle cx={cx} cy={cy} r={r * 1.18} className="tapete-ring" />
      <circle cx={cx} cy={cy} r={r * 1.1} className="tapete-ring-fein" />

      {/* Hauptgestirn: acht lange Strahlen, darunter um 22.5 Grad versetzt
          acht kuerzere - das ist die Kompassrose, nicht der simple Stern. */}
      <path d={sternPfad(cx, cy, r * 0.62, 0.3, 8, Math.PI / 8)} className="tapete-stern-schwach" />
      <path d={sternPfad(cx, cy, r, 0.17, 8)} className="tapete-stern" />
      <circle cx={cx} cy={cy} r={r * 0.17} className="tapete-kern" />

      {/* Trabanten auf dem Ring: abwechselnd Funke und Punkt. */}
      {Array.from({ length: 12 }, (_, i) => {
        const w = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(w) * r * 1.52;
        const py = cy + Math.sin(w) * r * 1.52;
        return i % 2 === 0 ? (
          <path key={i} d={funkePfad(px, py, 7, 0.26)} className="tapete-funke" />
        ) : (
          <circle key={i} cx={px} cy={py} r={1.7} className="tapete-staub-hell" />
        );
      })}

      {/* Vier Eckfunken auf den Diagonalen - sie binden das Motiv an das
          umgebende Feld, sonst stuende es als Insel fuer sich. */}
      {[45, 135, 225, 315].map((grad) => {
        const w = (grad * Math.PI) / 180;
        return (
          <path
            key={grad}
            d={funkePfad(cx + Math.cos(w) * r * 2.45, cy + Math.sin(w) * r * 2.45, 11, 0.2)}
            className="tapete-funke-gross"
          />
        );
      })}
    </g>
  );
}

function kleinesMotiv(cx, cy, schluessel) {
  const r = 21;
  return (
    <g key={schluessel}>
      <circle cx={cx} cy={cy} r={r * 1.75} className="tapete-bahn-fein" />
      <path d={sternPfad(cx, cy, r, 0.2, 6)} className="tapete-stern" />
      <path d={sternPfad(cx, cy, r * 0.58, 0.32, 6, Math.PI / 6)} className="tapete-stern-schwach" />
      <circle cx={cx} cy={cy} r={2.1} className="tapete-kern" />
      {Array.from({ length: 6 }, (_, i) => {
        const w = (i / 6) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(w) * r * 1.75}
            cy={cy + Math.sin(w) * r * 1.75}
            r={1.4}
            className="tapete-staub-hell"
          />
        );
      })}
    </g>
  );
}

// Sternstaub zwischen den Motiven. Punkte nahe am Kachelrand werden auf der
// Gegenseite wiederholt, sonst schneidet die Kachelgrenze sie durch und man
// sieht die Naht - genau das, was eine gute Tapete nicht zeigt.
function staubFeld() {
  const w = zufall(20261110);
  const punkte = [];
  const rand = 14;
  for (let i = 0; i < 230; i += 1) {
    const x = w() * KACHEL_B;
    const y = w() * KACHEL_H;
    const r = 0.45 + w() * w() * 1.5;
    const hell = w() > 0.72;
    const versatz = [[0, 0]];
    if (x < rand) versatz.push([KACHEL_B, 0]);
    if (x > KACHEL_B - rand) versatz.push([-KACHEL_B, 0]);
    if (y < rand) versatz.push([0, KACHEL_H]);
    if (y > KACHEL_H - rand) versatz.push([0, -KACHEL_H]);
    versatz.forEach(([dx, dy], k) => {
      punkte.push(
        <circle
          key={`${i}-${k}`}
          cx={+(x + dx).toFixed(2)}
          cy={+(y + dy).toFixed(2)}
          r={+r.toFixed(2)}
          className={hell ? 'tapete-staub-hell' : 'tapete-staub'}
        />
      );
    });
  }
  // Ein paar groessere, einzelne Funken im Feld - sie brechen die
  // Gleichmaessigkeit des Staubs auf.
  for (let i = 0; i < 9; i += 1) {
    punkte.push(
      <path
        key={`f${i}`}
        d={funkePfad(40 + w() * (KACHEL_B - 80), 40 + w() * (KACHEL_H - 80), 4.5 + w() * 3.5, 0.24)}
        className="tapete-funke"
      />
    );
  }
  return punkte;
}

export default function Sternentapete({ className = '' }) {
  const staub = useMemo(staubFeld, []);
  const kachel = useMemo(
    () => [
      ...staub,
      grossesMotiv(KACHEL_B / 2, KACHEL_H * 0.27, 'gross-1'),
      // Halbversatz: dasselbe Motiv noch einmal, um eine halbe Kachel nach
      // rechts UND nach unten - erst dadurch laeuft das Muster diagonal.
      grossesMotiv(0, KACHEL_H * 0.77, 'gross-2'),
      grossesMotiv(KACHEL_B, KACHEL_H * 0.77, 'gross-3'),
      kleinesMotiv(0, KACHEL_H * 0.27, 'klein-1'),
      kleinesMotiv(KACHEL_B, KACHEL_H * 0.27, 'klein-2'),
      kleinesMotiv(KACHEL_B / 2, KACHEL_H * 0.77, 'klein-3'),
      kleinesMotiv(KACHEL_B * 0.25, KACHEL_H * 0.52, 'klein-4'),
      kleinesMotiv(KACHEL_B * 0.75, KACHEL_H * 0.02, 'klein-5'),
      kleinesMotiv(KACHEL_B * 0.75, KACHEL_H * 1.02, 'klein-6'),
    ],
    [staub]
  );

  return (
    <div className={`sternentapete pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern
            id="sternentapete-kachel"
            width={KACHEL_B}
            height={KACHEL_H}
            patternUnits="userSpaceOnUse"
          >
            {kachel}
          </pattern>
          {/* Der Flor nimmt dem Muster an den Raendern die Haerte: oben und
              unten laeuft es aus, statt an der Sektionskante abzubrechen. */}
          <linearGradient id="sternentapete-flor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.14" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.86" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="sternentapete-maske">
            <rect width="100%" height="100%" fill="url(#sternentapete-flor)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#sternentapete-kachel)" mask="url(#sternentapete-maske)" />
      </svg>
    </div>
  );
}
