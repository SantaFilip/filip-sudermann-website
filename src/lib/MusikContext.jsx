import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { erzeugeAmbientMusik } from '@/lib/ambientMusik';

const WAHL = 'hintergrundmusik';
const LAUTSTAERKE = 'hintergrundmusik-lautstaerke';
const STANDARD_LAUTSTAERKE = 55;

function lesen(schluessel) {
  try {
    return window.localStorage.getItem(schluessel);
  } catch {
    return null;
  }
}

function schreiben(schluessel, wert) {
  try {
    window.localStorage.setItem(schluessel, String(wert));
  } catch {
    // Privater Modus o.ae.: die Einstellung gilt dann nur fuer diesen Besuch.
  }
}

// Quadratische Kurve: das Ohr hoert logarithmisch, ein linearer Regler
// waere im unteren Drittel fast stumm und oben kaum noch lauter.
const zuPegel = (prozent) => Math.pow(prozent / 100, 2);

const MusikContext = createContext(null);

/**
 * Haelt die Hintergrundmusik ueber Seitenwechsel hinweg.
 *
 * Standard ist "an". Browser geben Ton fuer neue Besucher aber erst nach
 * einer Nutzeraktion frei - das kann keine Seite umgehen. Deshalb zwei
 * Zustaende: `an` (die Einstellung, so zeigt es der Regler) und `hoerbar`
 * (der Browser gibt wirklich Ton aus). Beim Laden wird sofort ein Start
 * versucht; wo der Browser das erlaubt, laeuft die Musik direkt. Sonst
 * startet sie bei der ersten Aktivierung (schon beim Druecken der
 * Maustaste). Klicks auf den Regler selbst (data-musik-regler) zaehlen
 * nicht - der regelt sein Verhalten allein. Wer ausschaltet, bleibt beim
 * naechsten Besuch aus. Im Hintergrund-Tab pausiert die Musik.
 */
const GESTEN = ['pointerdown', 'mousedown', 'click', 'keydown', 'touchend'];

export function MusikProvider({ children }) {
  const [an, setAn] = useState(() => lesen(WAHL) !== 'aus');
  const [hoerbar, setHoerbar] = useState(false);
  const [lautstaerke, setLautstaerke] = useState(() => {
    const gespeichert = lesen(LAUTSTAERKE);
    const zahl = Number(gespeichert);
    if (gespeichert === null || !Number.isFinite(zahl)) return STANDARD_LAUTSTAERKE;
    return Math.min(100, Math.max(0, zahl));
  });
  const musikRef = useRef(null);
  const anRef = useRef(an);
  const hoerbarRef = useRef(false);
  const lautstaerkeRef = useRef(lautstaerke);
  const gesteRef = useRef(null);

  const gesteAbmelden = useCallback(() => {
    if (!gesteRef.current) return;
    GESTEN.forEach((typ) => window.removeEventListener(typ, gesteRef.current, true));
    gesteRef.current = null;
  }, []);

  const starten = useCallback(async () => {
    if (!musikRef.current) musikRef.current = erzeugeAmbientMusik();
    const musik = musikRef.current;
    if (!musik) return;
    anRef.current = true;
    setAn(true);
    musik.setzePegel(zuPegel(lautstaerkeRef.current));
    try {
      // Ohne Freigabe durch den Browser bleibt das haengen, bis eine Geste
      // kommt - die ruft starten() erneut auf und loest es damit auf.
      await musik.start();
    } catch {
      return;
    }
    if (!anRef.current) {
      musik.stop();
      return;
    }
    hoerbarRef.current = true;
    setHoerbar(true);
    gesteAbmelden();
  }, [gesteAbmelden]);

  const stoppen = useCallback(() => {
    gesteAbmelden();
    musikRef.current?.stop();
    anRef.current = false;
    hoerbarRef.current = false;
    setAn(false);
    setHoerbar(false);
  }, [gesteAbmelden]);

  useEffect(() => {
    if (anRef.current) {
      gesteRef.current = (e) => {
        if (e.target instanceof Element && e.target.closest('[data-musik-regler]')) return;
        starten();
      };
      GESTEN.forEach((typ) => window.addEventListener(typ, gesteRef.current, true));
    }
    // Der Startversuch ohne Geste baut die Klang-Engine auf (Hall-Puffer usw.)
    // und kostet spuerbar Rechenzeit - erst, wenn der Browser nach dem Laden
    // Luft hat. Ton waere vorher ohnehin fast nie erlaubt.
    const imLeerlauf = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    const abbrechen = window.cancelIdleCallback || clearTimeout;
    const leerlauf = anRef.current ? imLeerlauf(() => { if (anRef.current && !hoerbarRef.current) starten(); }, { timeout: 4000 }) : null;

    const sichtbarkeit = () => {
      const musik = musikRef.current;
      if (!musik || !hoerbarRef.current) return;
      if (document.hidden) musik.pausieren();
      else musik.fortsetzen();
    };
    document.addEventListener('visibilitychange', sichtbarkeit);

    return () => {
      if (leerlauf !== null) abbrechen(leerlauf);
      gesteAbmelden();
      document.removeEventListener('visibilitychange', sichtbarkeit);
      musikRef.current?.schliessen();
      musikRef.current = null;
    };
  }, [starten, gesteAbmelden]);

  const umschalten = useCallback(() => {
    if (anRef.current) {
      stoppen();
      schreiben(WAHL, 'aus');
    } else {
      schreiben(WAHL, 'an');
      // Steht der Regler auf 0, waere "an" unhoerbar - dann auf den
      // Standard zurueck.
      if (lautstaerkeRef.current === 0) {
        lautstaerkeRef.current = STANDARD_LAUTSTAERKE;
        setLautstaerke(STANDARD_LAUTSTAERKE);
        schreiben(LAUTSTAERKE, STANDARD_LAUTSTAERKE);
      }
      starten();
    }
  }, [starten, stoppen]);

  const setzeLautstaerke = useCallback((prozent) => {
    lautstaerkeRef.current = prozent;
    setLautstaerke(prozent);
    schreiben(LAUTSTAERKE, prozent);
    musikRef.current?.setzePegel(zuPegel(prozent));
    // Am Regler drehen heisst "ich will Musik" - also auch starten, falls
    // sie noch aus ist.
    if (prozent > 0 && !hoerbarRef.current) {
      schreiben(WAHL, 'an');
      starten();
    }
  }, [starten]);

  const wert = useMemo(
    () => ({ an, hoerbar, lautstaerke, umschalten, setzeLautstaerke }),
    [an, hoerbar, lautstaerke, umschalten, setzeLautstaerke],
  );

  return <MusikContext.Provider value={wert}>{children}</MusikContext.Provider>;
}

export function useMusik() {
  return useContext(MusikContext);
}
