import React from 'react';

/**
 * Umschalter fuer die Form der Buehne. Gehoert zur Testversion und fliegt
 * raus, sobald die Richtung entschieden ist.
 */
export const STAGE_PRESETS = {
  wuerfel: { label: 'Würfel', axis: 'x', sides: 4 },
  lateral: { label: 'lateral', axis: 'y', sides: 4 },
  // Deutlich kleinere Flaeche als bei den Wuerfeln: fuellt eine Facette den
  // ganzen Bildschirm, liegt die naechste bei 30 Grad schon ausserhalb des
  // Sichtfelds und von der Kruemmung ist nichts zu sehen. Erst mehrere
  // Facetten gleichzeitig im Bild lesen als Rolle.
  rolle: { label: 'Rolle', axis: 'x', sides: 12, fill: 0.46 },
};

export default function AxisSwitch({ preset, onChange }) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded border border-accent bg-card/90 p-1 backdrop-blur">
      <span className="px-2 font-mono text-xs text-muted-foreground">Form</span>
      {Object.entries(STAGE_PRESETS).map(([key, { label }]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={preset === key}
          className={`px-3 py-1.5 text-xs font-mono transition-colors ${
            preset === key
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
