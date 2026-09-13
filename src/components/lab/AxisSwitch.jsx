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
  // Auf dem Handy kippt die Rolle auf die Waagerechte: seitlich teilt sie die
  // Breite auf, und davon hat ein Telefon zu wenig. Ueber die Waagerechte
  // teilt sie die Hoehe, und die ist reichlich da.
  rolle: {
    label: 'Rolle',
    axis: 'y',
    sides: 12,
    fill: 0.42,
    mobileAxis: 'x',
    mobileFill: 0.5,
    // Im Stillstand geht die vordere Facette auf dieselbe Breite auf wie
    // der Wuerfel (CUBE_WIDTH_DESKTOP) - nicht nur, damit sie die Schwelle
    // der Container-Query ueberschreitet und deren weites Layout uebernimmt,
    // sondern auch, damit der Zoom-Faktor identisch ausfaellt. Bei 0.86
    // (statt 0.93) war die Flaeche knapp schmaler, Text brach frueher um,
    // und die dadurch groessere natuerliche Hoehe zwang den Zoom sichtbar
    // niedriger - selbst nach dem Schaerfe-Fix blieb die Rolle so minimal
    // weicher als der Wuerfel bei sonst identischem Inhalt.
    expandTo: 0.93,
  },
};

export default function AxisSwitch({ preset, onChange }) {
  // Auf dem Handy laeuft die Seite ohne Buehne - ein Formwaehler waere dort
  // ohne Wirkung und nur irrefuehrend.
  return (
    <div className="fixed bottom-4 left-4 z-50 hidden items-center gap-1 rounded border border-accent bg-card/90 p-1 backdrop-blur md:flex">
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
