import React from 'react';

/**
 * Rotierendes Hintergrund-Objekt hinter der Trommel.
 *
 * Zwei ueberlagerte Ringsysteme, die sich gegenlaeufig drehen: das aeussere
 * folgt dem Scroll-Fortschritt, das innere laeuft langsam von allein weiter.
 * Dadurch steht das Bild nie still, auch wenn der Nutzer nicht scrollt, und
 * reagiert trotzdem sichtbar auf jede Scroll-Bewegung.
 *
 * Gesteuert wird es ueber CSS-Variablen statt React-State: der Stage-Loop
 * schreibt --spin/--tint pro Frame direkt ins DOM, ein Re-Render pro Frame
 * waere bei 60fps deutlich zu teuer.
 */
export default function RotatingBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ '--spin': '0deg', '--tint': '0' }}
    >
      {/* Grundflaeche: faerbt sich ueber --tint von Creme nach Navy ein. */}
      <div
        className="absolute inset-0 transition-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--card)) 0%, hsl(var(--background)) 55%, hsl(40 30% 88%) 100%)',
        }}
      />

      <svg
        className="absolute left-1/2 top-1/2 h-[170vmax] w-[170vmax] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 1000 1000"
        style={{ transform: 'translate(-50%, -50%) rotate(var(--spin))' }}
        data-backdrop-outer
      >
        <defs>
          <radialGradient id="lab-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(42 58% 51%)" stopOpacity="0.30" />
            <stop offset="55%" stopColor="hsl(42 58% 51%)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(42 58% 51%)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Speichen: 24 Strahlen, die beim Drehen den Trommel-Eindruck tragen. */}
        <g stroke="url(#lab-fade)" strokeWidth="1.5">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI * 2) / 24;
            return (
              <line
                key={i}
                x1={500 + Math.cos(a) * 120}
                y1={500 + Math.sin(a) * 120}
                x2={500 + Math.cos(a) * 480}
                y2={500 + Math.sin(a) * 480}
              />
            );
          })}
        </g>

        {[180, 260, 340, 420].map((r) => (
          <circle
            key={r}
            cx="500"
            cy="500"
            r={r}
            fill="none"
            stroke="hsl(42 58% 51%)"
            strokeOpacity={0.16}
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Innerer Ring, gegenlaeufig und langsamer. */}
      <svg
        className="absolute left-1/2 top-1/2 h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 1000 1000"
        style={{ transform: 'translate(-50%, -50%) rotate(calc(var(--spin) * -0.45))' }}
        data-backdrop-inner
      >
        <circle
          cx="500"
          cy="500"
          r="300"
          fill="none"
          stroke="hsl(217 62% 12%)"
          strokeOpacity="0.10"
          strokeWidth="1"
          strokeDasharray="14 26"
        />
        <circle
          cx="500"
          cy="500"
          r="210"
          fill="none"
          stroke="hsl(42 58% 51%)"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          strokeDasharray="60 40"
        />
      </svg>

      {/* Vignette: nimmt den Raendern Schaerfe, damit die Kanten der
          wegkippenden Flaechen nicht hart auf dem Muster aufliegen. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, hsl(var(--background) / 0.85) 100%)',
        }}
      />
    </div>
  );
}
