import React, { useMemo } from 'react';

/*
 * Sternentapete
 * -------------
 * Halbtransparente Gestirne als Wandbespannung, im Halbversatz (half drop)
 * wie eine klassische Tapete. Alles ist Vektor und wird prozedural als echte
 * Geometrie erzeugt, nicht als Pixelmuster - dadurch bei jeder Aufloesung
 * und jedem Zoom scharf.
 *
 * Zweiter Entwurf. Der erste war zu laut: grosse, voll ausgefuellte
 * Strahlensterne mit Hof, gestrichelte Bahnen, zwoelf Trabanten auf einem
 * Ring, dazu viel Sternstaub - das las sich wie ein Aufkleberbogen, nicht
 * wie eine Bespannung. Vier Stellschrauben dagegen:
 *   - Massstab: Kachel von 420x560 auf 252x348, Motive deutlich kleiner.
 *     Ein feines Rapport liest als Stoff, ein grobes als Illustration.
 *   - Strich statt Flaeche: die Strahlen sind schlanke Nadeln, die Ringe
 *     durchgezogene Haarlinien (0.35) statt gestrichelter Bahnen.
 *   - Kontrast: alle Deckkraefte etwa halbiert, der hellste Wert liegt bei
 *     0.26 statt 0.46.
 *   - Weniger Teile: kein Trabantenring, keine Eckfunken, ein Drittel so
 *     viel Staub. Zurueckhaltung ist hier das ganze Mittel.
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

// Eine Nadel: schlanke Raute von der Mitte nach aussen. Aus vier bis acht
// davon entsteht der Stern - schlanker und ruhiger als ein Zackenpolygon,
// weil die Spitze spitz ausläuft statt in einer Kante zu enden.
function nadel(cx, cy, laenge, breite, winkel) {
  const sin = Math.sin(winkel);
  const cos = Math.cos(winkel);
  const sp = [cx + cos * laenge, cy + sin * laenge];
  const gp = [cx - cos * laenge, cy - sin * laenge];
  const qa = [cx - sin * breite, cy + cos * breite];
  const qb = [cx + sin * breite, cy - cos * breite];
  const f = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  return `M${f(sp)}L${f(qa)}L${f(gp)}L${f(qb)}Z`;
}

function nadelstern(cx, cy, laenge, breite, strahlen, kurz = 0.44) {
  const teile = [];
  for (let i = 0; i < strahlen; i += 1) {
    const w = (i / strahlen) * Math.PI;
    teile.push(nadel(cx, cy, laenge, breite, w));
  }
  // Die Zwischenstrahlen deutlich kuerzer: so hat der Stern eine Haupt- und
  // eine Nebenachse, statt als gleichmaessiges Rad zu liegen.
  for (let i = 0; i < strahlen; i += 1) {
    const w = ((i + 0.5) / strahlen) * Math.PI;
    teile.push(nadel(cx, cy, laenge * kurz, breite * 0.7, w));
  }
  return teile.join('');
}

// Kachelmass. Der Halbversatz betraegt genau die halbe Hoehe - dadurch
// laeuft das Muster diagonal weiter und zeigt nicht die Reihen-und-Spalten-
// Strenge, an der man eine billige Kachel sofort erkennt.
const KACHEL_B = 252;
const KACHEL_H = 348;

function hauptmotiv(cx, cy, schluessel) {
  const r = 21;
  return (
    <g key={schluessel}>
      {/* Zwei durchgezogene Haarlinien, konzentrisch - der ruhige Rahmen,
          der das Gestirn in das Rapport einbindet. */}
      <circle cx={cx} cy={cy} r={r * 1.62} className="tapete-ring-fein" />
      <circle cx={cx} cy={cy} r={r * 1.52} className="tapete-ring" />
      <path d={nadelstern(cx, cy, r, 1.15, 2)} className="tapete-stern" />
      <path d={nadelstern(cx, cy, r * 0.66, 0.8, 2, 0.5)} className="tapete-stern-schwach" transform={`rotate(45 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={1.5} className="tapete-kern" />
      {/* Vier Punkte auf den Hauptachsen, direkt auf dem Ring: setzt das
          Mass des Rings fort, ohne ihn mit Trabanten zu besetzen. */}
      {[0, 90, 180, 270].map((grad) => {
        const w = (grad * Math.PI) / 180;
        return (
          <circle
            key={grad}
            cx={cx + Math.cos(w) * r * 1.52}
            cy={cy + Math.sin(w) * r * 1.52}
            r={0.95}
            className="tapete-staub-hell"
          />
        );
      })}
    </g>
  );
}

function nebenmotiv(cx, cy, schluessel) {
  return (
    <g key={schluessel}>
      <path d={nadelstern(cx, cy, 7.5, 0.6, 2, 0.42)} className="tapete-stern-schwach" />
      <circle cx={cx} cy={cy} r={0.8} className="tapete-staub-hell" />
    </g>
  );
}

// Sternstaub zwischen den Motiven. Punkte nahe am Kachelrand werden auf der
// Gegenseite wiederholt, sonst schneidet die Kachelgrenze sie durch und man
// sieht die Naht - genau das, was eine gute Tapete nicht zeigt.
function staubFeld() {
  const w = zufall(20261111);
  const punkte = [];
  const rand = 8;
  for (let i = 0; i < 78; i += 1) {
    const x = w() * KACHEL_B;
    const y = w() * KACHEL_H;
    const r = 0.3 + w() * w() * 0.75;
    const hell = w() > 0.78;
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
  return punkte;
}

export default function Sternentapete({ className = '' }) {
  const staub = useMemo(staubFeld, []);
  const kachel = useMemo(
    () => [
      ...staub,
      hauptmotiv(KACHEL_B / 2, KACHEL_H * 0.25, 'haupt-1'),
      // Halbversatz: dasselbe Motiv noch einmal, um eine halbe Kachel nach
      // rechts UND nach unten - erst dadurch laeuft das Muster diagonal.
      hauptmotiv(0, KACHEL_H * 0.75, 'haupt-2'),
      hauptmotiv(KACHEL_B, KACHEL_H * 0.75, 'haupt-3'),
      nebenmotiv(0, KACHEL_H * 0.25, 'neben-1'),
      nebenmotiv(KACHEL_B, KACHEL_H * 0.25, 'neben-2'),
      nebenmotiv(KACHEL_B / 2, KACHEL_H * 0.75, 'neben-3'),
      nebenmotiv(KACHEL_B * 0.25, KACHEL_H * 0.5, 'neben-4'),
      nebenmotiv(KACHEL_B * 0.75, KACHEL_H * 0, 'neben-5'),
      nebenmotiv(KACHEL_B * 0.75, KACHEL_H, 'neben-6'),
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
            <stop offset="0.16" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.84" stopColor="#fff" stopOpacity="1" />
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
