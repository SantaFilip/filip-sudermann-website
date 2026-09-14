import React from 'react';

/**
 * Architektonische Huelle um die rotierende Buehne: Sockel, Kuppeldach und
 * Bekroenung. Alle drei sind statisch (drehen sich NICHT mit dem Koerper) -
 * sie bilden den festen Baukoerper, in dem sich die Facetten-Trommel dreht,
 * wie eine Rotunde mit einer drehbaren Vitrine darin.
 *
 * Bewusst flache SVGs statt echter 3D-Geometrie: der Sockel/das Dach muessen
 * nicht mitdrehen, ein perspektivisch gezeichnetes Oval liest bei fester
 * Kamera genauso "raeumlich" wie eine echte geneigte Flaeche, ist aber robust
 * gegen jede Breitenaenderung (reine SVG-Skalierung statt neuer 3D-Matrix).
 */

const IVORY = 'hsl(42 40% 96%)';
const IVORY_SHADE = 'hsl(38 26% 85%)';
const CREAM_DEEP = 'hsl(35 22% 72%)';
const GOLD = 'hsl(42 58% 51%)';
const GOLD_LIGHT = 'hsl(45 68% 72%)';
const GOLD_DEEP = 'hsl(36 55% 38%)';
const NAVY = 'hsl(217 48% 16%)';

/** Rund-ovaler, gestufter Sockel, auf dem die Saeulen stehen. */
export function BuildingBase({ width, className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${className}`}
      style={{ width: `${width}px`, aspectRatio: '1000 / 200' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1000 200" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <radialGradient id="rs-base-top" cx="50%" cy="25%" r="80%">
            <stop offset="0%" stopColor={IVORY} />
            <stop offset="65%" stopColor={IVORY_SHADE} />
            <stop offset="100%" stopColor={CREAM_DEEP} />
          </radialGradient>
          <linearGradient id="rs-base-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CREAM_DEEP} />
            <stop offset="100%" stopColor={IVORY_SHADE} />
          </linearGradient>
        </defs>
        {/* untere, breiteste Stufe */}
        <ellipse cx="500" cy="158" rx="492" ry="36" fill="url(#rs-base-side)" />
        <ellipse cx="500" cy="140" rx="492" ry="36" fill="url(#rs-base-top)" stroke={GOLD} strokeWidth="1.4" strokeOpacity="0.5" />
        {/* mittlere Stufe */}
        <ellipse cx="500" cy="112" rx="410" ry="28" fill="url(#rs-base-side)" />
        <ellipse cx="500" cy="97" rx="410" ry="28" fill="url(#rs-base-top)" stroke={GOLD} strokeWidth="1.2" strokeOpacity="0.45" />
        {/* obere Plattform, traegt die Saeulen */}
        <ellipse cx="500" cy="68" rx="345" ry="22" fill={NAVY} opacity="0.9" />
        <ellipse cx="500" cy="56" rx="345" ry="22" fill="url(#rs-base-top)" stroke={GOLD_LIGHT} strokeWidth="1.6" />
      </svg>
    </div>
  );
}

/** Flaches Kuppeldach mit Rippen, die auf die Saeulen ausgerichtet sind. */
export function RoofStructure({ width, sides = 8, className = '' }) {
  const ribCount = Math.max(4, Math.min(sides, 12));
  const ribs = Array.from({ length: ribCount }, (_, i) => i / (ribCount - 1));
  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${className}`}
      style={{ width: `${width}px`, aspectRatio: '1000 / 230' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1000 230" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rs-roof-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(206 48% 90%)" stopOpacity="0.92" />
            <stop offset="52%" stopColor={IVORY} stopOpacity="0.97" />
            <stop offset="100%" stopColor={GOLD_LIGHT} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* flache Kuppelflaeche - bewusst niedrig, keine Kathedrale */}
        <path d="M14 215 Q500 18 986 215 Q500 178 14 215 Z" fill="url(#rs-roof-glass)" stroke={GOLD} strokeWidth="2" />
        {/* Rippen entlang der Saeulenpositionen */}
        {ribs.map((t, i) => {
          const x = 14 + t * 972;
          const y = 215 - Math.sin(t * Math.PI) * 197;
          return (
            <path
              key={i}
              d={`M500 34 Q${(500 + x) / 2} ${(34 + y) / 2 - 10} ${x} 215`}
              fill="none"
              stroke={GOLD}
              strokeWidth="1.1"
              opacity="0.45"
            />
          );
        })}
        {/* Traufband am Dachfuss */}
        <ellipse cx="500" cy="215" rx="472" ry="17" fill="none" stroke={GOLD} strokeWidth="2.5" opacity="0.65" />
      </svg>
    </div>
  );
}

/** Kleine Bekroenung: schlanke Laterne mit Ring, sehr kompakt. */
export function RoofCrown({ width, className = '' }) {
  const boxW = Math.max(36, width * 0.075);
  const boxH = Math.max(30, width * 0.065);
  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${className}`}
      style={{ width: `${boxW}px`, height: `${boxH}px` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <line x1="50" y1="98" x2="50" y2="34" stroke={GOLD} strokeWidth="4.5" />
        <circle cx="50" cy="20" r="15" fill="none" stroke={GOLD_LIGHT} strokeWidth="4.5" />
        <circle cx="50" cy="20" r="5" fill={GOLD_DEEP} />
      </svg>
    </div>
  );
}

/** Dezente Lichtstimmung: warmer Schein unterm Dach, sanfter Schein am Sockel. */
export function ArchitecturalLighting({ width, className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: `${width * 0.92}px`,
          height: `${width * 0.3}px`,
          background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${GOLD_LIGHT}2e 0%, transparent 72%)`,
        }}
      />
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2"
        style={{
          width: `${width * 1.05}px`,
          height: `${width * 0.15}px`,
          background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${GOLD}22 0%, transparent 75%)`,
        }}
      />
    </div>
  );
}
