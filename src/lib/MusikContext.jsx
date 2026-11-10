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
 * Haelt die Hintergrundmusik ueber Seitenwechsel hinweg. Browser lassen Ton
 * erst nach einer Nutzeraktion zu: die Musik startet beim ersten Klick oder
 * Tastendruck irgendwo auf der Seite, es sei denn, der Besucher hat sie
 * frueher ausgeschaltet. Klicks auf den Regler selbst (data-musik-regler)
 * zaehlen dabei nicht - der regelt sein Verhalten allein. Im Hintergrund-Tab
 * pausiert die Musik.
 */
export function MusikProvider({ children }) {
  const [spielt, setSpielt] = useState(false);
  const [lautstaerke, setLautstaerke] = useState(() => {
    const gespeichert = lesen(LAUTSTAERKE);
    const zahl = Number(gespeichert);
    if (gespeichert === null || !Number.isFinite(zahl)) return STANDARD_LAUTSTAERKE;
    return Math.min(100, Math.max(0, zahl));
  });
  const musikRef = useRef(null);
  const spieltRef = useRef(false);
  const lautstaerkeRef = useRef(lautstaerke);
  const gesteRef = useRef(null);

  const gesteAbmelden = useCallback(() => {
    if (!gesteRef.current) return;
    ['click', 'keydown', 'touchend'].forEach((typ) => window.removeEventListener(typ, gesteRef.current, true));
    gesteRef.current = null;
  }, []);

  const starten = useCallback(async () => {
    gesteAbmelden();
    if (!musikRef.current) musikRef.current = erzeugeAmbientMusik();
    const musik = musikRef.current;
    if (!musik) return;
    musik.setzePegel(zuPegel(lautstaerkeRef.current));
    spieltRef.current = true;
    setSpielt(true);
    try {
      await musik.start();
    } catch {
      spieltRef.current = false;
      setSpielt(false);
    }
  }, [gesteAbmelden]);

  const stoppen = useCallback(() => {
    gesteAbmelden();
    musikRef.current?.stop();
    spieltRef.current = false;
    setSpielt(false);
  }, [gesteAbmelden]);

  useEffect(() => {
    if (lesen(WAHL) !== 'aus') {
      gesteRef.current = (e) => {
        if (e.target instanceof Element && e.target.closest('[data-musik-regler]')) return;
        starten();
      };
      ['click', 'keydown', 'touchend'].forEach((typ) => window.addEventListener(typ, gesteRef.current, true));
    }

    const sichtbarkeit = () => {
      const musik = musikRef.current;
      if (!musik || !spieltRef.current) return;
      if (document.hidden) musik.pausieren();
      else musik.fortsetzen();
    };
    document.addEventListener('visibilitychange', sichtbarkeit);

    return () => {
      gesteAbmelden();
      document.removeEventListener('visibilitychange', sichtbarkeit);
      musikRef.current?.schliessen();
      musikRef.current = null;
    };
  }, [starten, gesteAbmelden]);

  const umschalten = useCallback(() => {
    if (spieltRef.current) {
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
    if (prozent > 0 && !spieltRef.current) {
      schreiben(WAHL, 'an');
      starten();
    }
  }, [starten]);

  const wert = useMemo(
    () => ({ spielt, lautstaerke, umschalten, setzeLautstaerke }),
    [spielt, lautstaerke, umschalten, setzeLautstaerke],
  );

  return <MusikContext.Provider value={wert}>{children}</MusikContext.Provider>;
}

export function useMusik() {
  return useContext(MusikContext);
}
