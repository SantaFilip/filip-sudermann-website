import React from 'react';

/**
 * Umschalter fuer die Drehachse der Buehne. Gehoert zur Testversion und
 * fliegt raus, sobald die Richtung entschieden ist.
 */
export default function AxisSwitch({ axis, onChange }) {
  const Option = ({ value, label }) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={axis === value}
      className={`px-3 py-1.5 text-xs font-mono transition-colors ${
        axis === value
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded border border-accent bg-card/90 p-1 backdrop-blur">
      <span className="px-2 font-mono text-xs text-muted-foreground">Achse</span>
      <Option value="x" label="kippend" />
      <Option value="y" label="lateral" />
    </div>
  );
}
