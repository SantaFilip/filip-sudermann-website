import React, { useEffect, useRef } from 'react';

/*
 * Milchstrasse
 * ------------
 * Das Band der Galaxis hinter dem Fussbereich. Bewusst KEIN Bild: gerechnet
 * auf einer Leinwand in Geraeteaufloesung (devicePixelRatio), also auf einem
 * Retina-Schirm doppelt so fein wie das Layout - ein PNG muesste dafuer
 * mehrere Megabyte wiegen.
 *
 * Aufbau wie am echten Himmel, von hinten nach vorn:
 *   1. Streulicht des Bandes (breiter, sehr schwacher Schein)
 *   2. Nebelfelder in Gold und Blau, unregelmaessig verteilt
 *   3. das Sternfeld selbst - die Dichte faellt mit dem Abstand zur
 *      Bandachse glockenfoermig ab, dazu ein duennes Feld ueber dem
 *      ganzen Bild, damit der Rest nicht leer wirkt
 *   4. die Dunkelwolken: Staubbahnen, die das Band laengs durchschneiden -
 *      sie sind es, die eine Milchstrasse als Milchstrasse lesbar machen
 *   5. einzelne helle Sterne mit Beugungskreuz
 * Alles statisch gezeichnet: ein Bild, kein Animationsloop.
 */

const GRUND = [12, 26, 50]; // hsl(217 62% 12%) - der Ton des Fussbereichs

function zufall(saat) {
  let a = saat >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normalverteilte Zufallszahl (Box-Muller). Gleichverteilte Sterne quer zum
// Band saehen aus wie ein Rechteck voller Punkte; die Glocke erzeugt den
// weichen Rand, den das Band wirklich hat.
function glocke(w) {
  let u = 0;
  let v = 0;
  while (u === 0) u = w();
  while (v === 0) v = w();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function zeichne(ctx, b, h) {
  const w = zufall(884422);
  ctx.clearRect(0, 0, b, h);

  // Bandachse: flach von links unten nach rechts oben, wie die Milchstrasse
  // ueber einem Horizont steht. In Bildkoordinaten beschrieben, damit das
  // Band bei jeder Fussbereichshoehe gleich liegt.
  // Das Band liegt tief, wie ueber einem Horizont. Das ist nicht nur das
  // schoenere Bild: darueber steht die Anschrift, und ein Band quer durch
  // die Textspalten haette sie aufgehellt und schlecht lesbar gemacht.
  const neigung = -0.13;
  const achseY = (x) => h * 0.73 + (x - b * 0.5) * neigung;
  // Die Bandbreite darf NICHT allein an der Hoehe haengen: auf dem Handy ist
  // der Fussbereich schmal und sehr hoch, 15% davon haetten das ganze Feld
  // zum Band gemacht - ein gleichmaessig heller Teppich unter der Anschrift
  // statt eines Bandes. Deshalb gegen die Breite gedeckelt.
  const mass = Math.min(h, b * 0.6);
  const breite = Math.max(mass * 0.16, 46); // Standardabweichung des Bandes

  // --- 1. Streulicht -------------------------------------------------
  const schein = ctx.createLinearGradient(0, achseY(0) - breite * 2.6, 0, achseY(0) + breite * 2.6);
  schein.addColorStop(0, 'rgba(120,150,220,0)');
  schein.addColorStop(0.5, 'rgba(126,152,214,0.17)');
  schein.addColorStop(1, 'rgba(120,150,220,0)');
  ctx.save();
  ctx.translate(b * 0.5, h * 0.56);
  ctx.rotate(Math.atan(neigung));
  ctx.translate(-b * 0.5, -h * 0.56);
  ctx.fillStyle = schein;
  ctx.fillRect(-b, achseY(0) - breite * 2.6 - h, b * 3, breite * 5.2 + h * 2);
  ctx.restore();

  // --- 2. Nebelfelder ------------------------------------------------
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 20; i += 1) {
    const x = w() * b;
    const y = achseY(x) + glocke(w) * breite * 0.85;
    const r = (0.08 + w() * 0.22) * b * 0.5;
    const gold = w() > 0.62;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const ton = gold ? '198,160,96' : '96,128,200';
    g.addColorStop(0, `rgba(${ton},${(0.03 + w() * 0.035).toFixed(3)})`);
    g.addColorStop(0.55, `rgba(${ton},0.018)`);
    g.addColorStop(1, `rgba(${ton},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 3. Sternfeld ---------------------------------------------------
  // Dichte an der Flaeche bemessen, damit ein breiter Fussbereich nicht
  // duenner besetzt ist als ein schmaler.
  // An der Flaeche des BANDES bemessen (rund vier Sigma breit), nicht an der
  // des Fussbereichs - sonst waere ein hoher, schmaler Fussbereich mit
  // Sternen ueberfuellt.
  const bandSterne = Math.round((b * breite * 4) / 215);
  const feldSterne = Math.round((b * h) / 3200);

  const farbe = () => {
    const k = w();
    if (k < 0.62) return [255, 247, 232]; // warmweiss
    if (k < 0.86) return [206, 221, 255]; // blauweiss
    if (k < 0.96) return [247, 214, 150]; // gelb
    return [255, 186, 150]; // rot
  };

  const stern = (x, y, r, a, [sr, sg, sb]) => {
    if (x < -4 || x > b + 4 || y < -4 || y > h + 4) return;
    // Kleine Sterne als Punkt, groessere mit weichem Hof - ein Hof um jeden
    // Punkt waere teuer und wuerde das Feld milchig machen.
    if (r < 0.75) {
      ctx.fillStyle = `rgba(${sr},${sg},${sb},${a.toFixed(3)})`;
      ctx.fillRect(x, y, r * 1.6, r * 1.6);
      return;
    }
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
    g.addColorStop(0, `rgba(${sr},${sg},${sb},${a.toFixed(3)})`);
    g.addColorStop(0.28, `rgba(${sr},${sg},${sb},${(a * 0.35).toFixed(3)})`);
    g.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();
  };

  for (let i = 0; i < bandSterne; i += 1) {
    const x = w() * b;
    const abstand = glocke(w);
    const y = achseY(x) + abstand * breite;
    // Zum Kern hin (rechte Haelfte) heller und dichter besetzt.
    const kern = 0.55 + 0.45 * (x / b);
    const helligkeit = Math.pow(w(), 2.6);
    stern(x, y, 0.3 + helligkeit * 1.8, (0.1 + helligkeit * 0.68) * kern, farbe());
  }

  for (let i = 0; i < feldSterne; i += 1) {
    const helligkeit = Math.pow(w(), 2.2);
    stern(w() * b, w() * h, 0.3 + helligkeit * 1.4, 0.06 + helligkeit * 0.38, farbe());
  }

  // --- 4. Dunkelwolken ------------------------------------------------
  // Mit dem Grundton des Fussbereichs gemalt, damit sie nicht als graue
  // Schleier liegen, sondern das Band wirklich aufreissen.
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 22; i += 1) {
    const x = w() * b;
    const y = achseY(x) + glocke(w) * breite * 0.5;
    const rx = (0.06 + w() * 0.16) * b;
    const ry = rx * (0.1 + w() * 0.22);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    const deck = 0.45 + w() * 0.45;
    g.addColorStop(0, `rgba(${GRUND[0]},${GRUND[1]},${GRUND[2]},${deck.toFixed(3)})`);
    g.addColorStop(0.6, `rgba(${GRUND[0]},${GRUND[1]},${GRUND[2]},${(deck * 0.4).toFixed(3)})`);
    g.addColorStop(1, `rgba(${GRUND[0]},${GRUND[1]},${GRUND[2]},0)`);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan(neigung) + (w() - 0.5) * 0.5);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- 5. Helle Einzelsterne mit Beugungskreuz ------------------------
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 20; i += 1) {
    const x = w() * b;
    const y = w() * h;
    const r = 1.0 + w() * 1.5;
    const [sr, sg, sb] = farbe();
    stern(x, y, r, 0.95, [sr, sg, sb]);
    const laenge = r * (7 + w() * 7);
    [0, Math.PI / 2].forEach((drehung) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(drehung);
      const s = ctx.createLinearGradient(-laenge, 0, laenge, 0);
      s.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
      s.addColorStop(0.5, `rgba(${sr},${sg},${sb},0.4)`);
      s.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
      ctx.fillStyle = s;
      ctx.fillRect(-laenge, -0.45, laenge * 2, 0.9);
      ctx.restore();
    });
  }
  ctx.globalCompositeOperation = 'source-over';
}

export default function Milchstrasse({ className = '' }) {
  const leinwandRef = useRef(null);

  useEffect(() => {
    const leinwand = leinwandRef.current;
    if (!leinwand) return undefined;
    const eltern = leinwand.parentElement;
    let gezeichnet = '';

    const male = () => {
      const b = Math.round(eltern.clientWidth);
      const h = Math.round(eltern.clientHeight);
      if (b < 2 || h < 2) return;
      // Auf Geraeteaufloesung rechnen, aber gedeckelt: auf einem 3x-Schirm
      // waere eine 4000px breite Leinwand reine Verschwendung.
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const marke = `${b}x${h}@${dpr}`;
      if (marke === gezeichnet) return;
      gezeichnet = marke;
      leinwand.width = Math.round(b * dpr);
      leinwand.height = Math.round(h * dpr);
      leinwand.style.width = `${b}px`;
      leinwand.style.height = `${h}px`;
      const ctx = leinwand.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      zeichne(ctx, b, h);
    };

    male();
    const beobachter = new ResizeObserver(male);
    beobachter.observe(eltern);
    return () => beobachter.disconnect();
  }, []);

  return (
    <canvas
      ref={leinwandRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
