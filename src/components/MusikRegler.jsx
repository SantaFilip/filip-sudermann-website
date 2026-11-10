import React from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useMusik } from '@/lib/MusikContext';

/**
 * Lautsprecher-Knopf (an/aus) plus Lautstaerkeregler fuer die
 * Hintergrundmusik. variante="leiste" fuer die Kopfleiste (Regler erst ab
 * sm, darunter nur der Knopf), "breit" fuer das aufgeklappte Handy-Menue.
 */
export default function MusikRegler({ variante = 'leiste' }) {
  const musik = useMusik();
  const { lang } = useLanguage();
  if (!musik) return null;
  const { spielt, lautstaerke, umschalten, setzeLautstaerke } = musik;

  const de = lang === 'de';
  const stumm = !spielt || lautstaerke === 0;
  const Icon = stumm ? VolumeX : lautstaerke < 50 ? Volume1 : Volume2;
  const knopfLabel = spielt
    ? (de ? 'Hintergrundmusik ausschalten' : 'Turn background music off')
    : (de ? 'Hintergrundmusik einschalten' : 'Turn background music on');
  const breit = variante === 'breit';

  return (
    <div data-musik-regler="" className={`flex items-center gap-1.5 ${breit ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={umschalten}
        aria-label={knopfLabel}
        aria-pressed={spielt}
        title={knopfLabel}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon size={18} aria-hidden="true" />
      </button>
      {breit && <span className="text-sm text-muted-foreground">{de ? 'Musik' : 'Music'}</span>}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={lautstaerke}
        onChange={(e) => setzeLautstaerke(Number(e.target.value))}
        aria-label={de ? 'Lautstärke der Hintergrundmusik' : 'Background music volume'}
        aria-valuetext={`${lautstaerke} %`}
        className={`musik-schieber ${breit ? 'ml-auto w-40' : 'hidden w-16 sm:block lg:w-20'} ${spielt ? '' : 'opacity-50'}`}
        style={{ '--wert': `${lautstaerke}%` }}
      />
    </div>
  );
}
