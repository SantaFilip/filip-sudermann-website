import React from 'react';

/**
 * Kristallblauer Teich unter den Folien.
 *
 * Drei Lagen uebereinander: das tiefe Wasser als Grund, darueber Ringe, die
 * sich mit dem Scroll drehen und die Wasseroberflaeche andeuten, und ganz
 * oben die Farbe der Webseite, die ueber --tint langsam eingeblendet wird.
 * Am Ende der Folien steht damit nicht mehr der Teich, sondern der Grundton
 * der Seite - der Uebergang in den Footer bleibt fugenlos.
 *
 * Gesteuert wird alles ueber CSS-Variablen, die die Buehne pro Frame setzt:
 * --spin fuer die Drehung, --tint fuer den Fortschritt von 0 bis 1. React
 * bei 60fps neu zu rendern waere um ein Vielfaches teurer.
 */
const TIEF = 'hsl(203 72% 22%)';
const MITTE = 'hsl(196 76% 38%)';
const HELL = 'hsl(187 74% 62%)';
const SCHAUM = 'hsl(184 80% 84%)';

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
      {/* Wasser: hell in der Mitte, zu den Raendern hin tief. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 90% at 50% 42%,
            ${SCHAUM} 0%, ${HELL} 22%, ${MITTE} 55%, ${TIEF} 100%)`,
        }}
      />

      {/* Lichtbrechung: gekreuzte Verlaeufe, die im Wasser als Kaustik lesen. */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          opacity: 0.45,
          background: `repeating-linear-gradient(58deg, transparent 0 38px, ${SCHAUM}22 38px 41px),
                       repeating-linear-gradient(-47deg, transparent 0 52px, ${HELL}1f 52px 56px)`,
        }}
      />

      {/* Wellenringe, die sich mit dem Scroll drehen. */}
      <svg
        className="absolute left-1/2 top-1/2 h-[190vmax] w-[190vmax] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 1000 1000"
        style={{ transform: 'translate(-50%, -50%) rotate(var(--spin, 0deg))' }}
      >
        <defs>
          <radialGradient id="teich-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={SCHAUM} stopOpacity="0.55" />
            <stop offset="45%" stopColor={SCHAUM} stopOpacity="0.22" />
            <stop offset="100%" stopColor={SCHAUM} stopOpacity="0" />
          </radialGradient>
        </defs>

        {[150, 215, 285, 360, 440, 520].map((r, i) => (
          <circle
            key={r}
            cx="500"
            cy="500"
            r={r}
            fill="none"
            stroke="url(#teich-fade)"
            strokeWidth={i % 2 ? 1.2 : 2.4}
            strokeDasharray={i % 3 === 0 ? 'none' : `${18 + i * 9} ${26 + i * 5}`}
          />
        ))}
      </svg>

      {/* Gegenlaeufige Ringe: zwei Drehrichtungen lesen als bewegtes Wasser,
          eine einzelne liest als rotierende Scheibe. */}
      <svg
        className="absolute left-1/2 top-1/2 h-[100vmax] w-[100vmax] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 1000 1000"
        style={{ transform: 'translate(-50%, -50%) rotate(calc(var(--spin, 0deg) * -0.4))' }}
      >
        <circle cx="500" cy="500" r="320" fill="none" stroke={SCHAUM} strokeOpacity="0.20"
                strokeWidth="1" strokeDasharray="10 30" />
        <circle cx="500" cy="500" r="225" fill="none" stroke={SCHAUM} strokeOpacity="0.28"
                strokeWidth="1.6" strokeDasharray="70 46" />
      </svg>

      {/* Vignette: nimmt den Raendern Schaerfe, damit die Kanten der
          wegkippenden Flaechen nicht hart auf dem Wasser aufliegen. Sie liegt
          bewusst UNTER der Einblendung - lag sie darueber, malte sie ihr
          tiefes Blau auch dann noch an die Raender, wenn die Seitenfarbe
          laengst voll eingeblendet war, und der Uebergang blieb blau stehen. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 45%, ${TIEF}66 100%)`,
        }}
      />

      {/*
       * Die Farbe der Webseite, ueber den Fortschritt eingeblendet. Sie liegt
       * zuoberst, damit sie Wasser und Ringe gleichermassen zudeckt - so
       * verschwindet der Teich als Ganzes statt in Einzelteilen.
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
