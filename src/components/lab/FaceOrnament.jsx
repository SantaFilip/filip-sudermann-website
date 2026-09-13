import React from 'react';

/**
 * Eckverzierung im Stil persischer Buchmalerei.
 *
 * Ein einziges Eckmotiv, viermal gespiegelt - so bleibt die Zeichnung an
 * allen vier Ecken identisch, ohne sie vier Mal zu zeichnen. Die Kurven sind
 * bewusst als Pfade gesetzt und nicht als Bild: sie sollen bei jeder
 * Flaechengroesse scharf bleiben und die Farben aus dem Theme ziehen.
 */
const GOLD = 'hsl(42 58% 51%)';
const GOLD_TIEF = 'hsl(36 52% 40%)';

function Corner() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="absolute h-[clamp(48px,9%,110px)] w-[clamp(48px,9%,110px)]"
      fill="none"
      aria-hidden="true"
    >
      {/* Doppelte Randlinie: aussen kraeftig, innen fein - der klassische
          Buchrahmen lebt vom ungleichen Linienpaar. */}
      <path d="M2 2 H120 M2 2 V120" stroke={GOLD} strokeWidth="2.5" />
      <path d="M9 9 H120 M9 9 V120" stroke={GOLD} strokeWidth="0.9" opacity="0.75" />

      {/* Eckzwickel: Viertelbogen, der die beiden Raender verbindet. */}
      <path d="M9 58 A49 49 0 0 1 58 9" stroke={GOLD_TIEF} strokeWidth="1.4" opacity="0.9" />
      <path d="M9 44 A35 35 0 0 1 44 9" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />

      {/* Palmette: das Blattmotiv, das aus der Ecke in den Bogen waechst. */}
      <path
        d="M14 14 C30 18 40 28 44 44 C40 34 32 26 22 22 C30 30 34 40 33 51
           C29 38 22 28 14 22 Z"
        fill={GOLD}
        opacity="0.85"
      />
      <path
        d="M14 14 C18 30 28 40 44 44 C34 40 26 32 22 22 C30 30 40 34 51 33
           C38 29 28 22 22 14 Z"
        fill={GOLD}
        opacity="0.55"
      />

      {/* Drei Punkte entlang der Diagonale - in persischen Rahmen sitzt fast
          immer eine solche Perlenreihe im Zwickel. */}
      <circle cx="60" cy="24" r="2.6" fill={GOLD} opacity="0.8" />
      <circle cx="24" cy="60" r="2.6" fill={GOLD} opacity="0.8" />
      <circle cx="41" cy="41" r="1.8" fill={GOLD_TIEF} opacity="0.9" />

      {/* Ranken, die den Rahmen zur Seite hin auslaufen lassen. */}
      <path d="M60 9 C74 9 86 13 96 21" stroke={GOLD} strokeWidth="0.8" opacity="0.45" />
      <path d="M9 60 C9 74 13 86 21 96" stroke={GOLD} strokeWidth="0.8" opacity="0.45" />
    </svg>
  );
}

export default function FaceOrnament() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {/* Ein Motiv, vier Lagen: Spiegelung statt vier Zeichnungen. */}
      <div className="absolute left-0 top-0"><Corner /></div>
      <div className="absolute right-0 top-0 -scale-x-100"><Corner /></div>
      <div className="absolute bottom-0 left-0 -scale-y-100"><Corner /></div>
      <div className="absolute bottom-0 right-0 -scale-100"><Corner /></div>
    </div>
  );
}
