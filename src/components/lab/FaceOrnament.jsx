import React from 'react';

/**
 * Eckmarkierung im Stil eines klassischen Architektur-Passepartouts:
 * ein schlichtes doppeltes Winkelmass, keine Ornamentik. Ersetzt die
 * fruehere Verzierung im Stil persischer Buchmalerei (Palmette, Perlenreihe,
 * Ranken) - die passte weder zur "europaeisch-klassisch + 1980er
 * Corporate"-Bildsprache noch zur Vorgabe "sehr wenige dekorative
 * Elemente". Ein Eckmotiv, viermal gespiegelt.
 */
const GOLD = 'hsl(42 58% 51%)';

function Corner() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="absolute h-[clamp(30px,5.5%,56px)] w-[clamp(30px,5.5%,56px)]"
      fill="none"
      aria-hidden="true"
    >
      {/* Doppelte Winkellinie: aussen kraeftig, innen sehr fein. */}
      <path d="M2 2 H60 M2 2 V60" stroke={GOLD} strokeWidth="2" opacity="0.8" />
      <path d="M10 10 H40 M10 10 V40" stroke={GOLD} strokeWidth="0.75" opacity="0.5" />
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
