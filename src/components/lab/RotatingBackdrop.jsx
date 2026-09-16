import React from 'react';

/**
 * Atmosphaerischer Grund hinter der Rolle: warmes Elfenbein zur Mitte,
 * gedeckter Stein im Mittelfeld, ein sehr zurueckhaltender Navy-Schimmer
 * zu den Raendern - keine Wasser-/Teich-Metapher mehr, sondern der
 * Bodeneindruck einer gedaempft beleuchteten Empfangshalle.
 *
 * Struktur bleibt wie zuvor: ein Farbgrund, darueber ein feines Ringmotiv
 * (frueher Wasserringe, jetzt wie polierter Steinboden mit Lichtreflex),
 * zuoberst die Einblendung in den Seitengrundton beim Verlassen der Rolle.
 *
 * Gesteuert weiterhin ueber CSS-Variablen, die die Buehne pro Frame setzt:
 * --spin fuer die Drehung, --tint fuer den Fortschritt von 0 bis 1. React
 * bei 60fps neu zu rendern waere um ein Vielfaches teurer.
 */
const ELFENBEIN = 'hsl(42 40% 97%)';
const STEIN = 'hsl(36 24% 89%)';
const STEIN_TIEF = 'hsl(32 16% 76%)';
const NAVY_FERN = 'hsl(217 38% 26%)';
const GOLD_LEISE = 'hsl(42 45% 62%)';

export default function RotatingBackdrop() {
  return (
    // KEINE Startwerte fuer --spin/--tint hier setzen: die Buehne schreibt sie
    // auf das Elternelement, und eine eigene Deklaration wuerde den geerbten
    // Wert fuer alle Kinder ueberschatten - die Variablen blieben dann fuer
    // immer auf ihrem Startwert stehen. Die Standardwerte stehen stattdessen
    // als Rueckfallwert in jedem var().
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Grund: hell zur Mitte, gedeckter Stein im Mittelfeld, ein sehr
          zurueckhaltender Navy-Ton am aeussersten Rand - "Tiefe", nicht
          Farbflaeche. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 130% 95% at 50% 42%,
            ${ELFENBEIN} 0%, ${STEIN} 48%, ${STEIN_TIEF} 78%, ${NAVY_FERN} 100%)`,
        }}
      />

      {/* Ringmotiv: liest als polierter Steinboden mit feinem Lichtreflex,
          nicht mehr als Wasseroberflaeche - deutlich zurueckhaltender
          (niedrige Opazitaet, warmer Steinton statt hellem Türkis). */}
      <svg
        className="absolute left-1/2 top-1/2 h-[190vmax] w-[190vmax] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 1000 1000"
        style={{ transform: 'translate(-50%, -50%) rotate(var(--spin, 0deg))' }}
      >
        <defs>
          <radialGradient id="boden-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD_LEISE} stopOpacity="0.16" />
            <stop offset="45%" stopColor={GOLD_LEISE} stopOpacity="0.07" />
            <stop offset="100%" stopColor={GOLD_LEISE} stopOpacity="0" />
          </radialGradient>
        </defs>

        {[150, 215, 285, 360, 440, 520].map((r, i) => (
          <circle
            key={r}
            cx="500"
            cy="500"
            r={r}
            fill="none"
            stroke="url(#boden-fade)"
            strokeWidth={i % 2 ? 1 : 1.8}
            strokeDasharray={i % 3 === 0 ? 'none' : `${18 + i * 9} ${26 + i * 5}`}
          />
        ))}
      </svg>

      {/* Vignette: nimmt den Raendern Schaerfe, damit die Kanten der
          wegkippenden Flaechen nicht hart auf dem Grund aufliegen. Sie liegt
          bewusst UNTER der Einblendung - lag sie darueber, malte sie ihr
          Navy auch dann noch an die Raender, wenn die Seitenfarbe laengst
          voll eingeblendet war, und der Uebergang bliebe dunkel stehen. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 45%, ${NAVY_FERN}44 100%)`,
        }}
      />

      {/*
       * Die Farbe der Webseite, ueber den Fortschritt eingeblendet. Sie liegt
       * zuoberst, damit sie Grund und Ringe gleichermassen zudeckt - so
       * verschwindet der Hintergrund als Ganzes statt in Einzelteilen.
       */}
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
