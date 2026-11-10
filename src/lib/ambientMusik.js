/**
 * Ruhige, technische Hintergrundmusik, vollstaendig im Browser erzeugt
 * (Web Audio API) - keine Audiodatei, keine Lizenzfrage, kein Download.
 *
 * Aufbau:
 * - Flaechen: vier Akkorde in A-Aeolisch, je 8 Sekunden, aus leicht
 *   verstimmten Saegezahn-Paaren hinter einem langsam atmenden Tiefpass.
 * - Arpeggio: weiche Sinus-Pluck-Toene aus den Akkordtoenen, mit
 *   punktiertem Echo - das "Technische".
 * - Ein sehr leises, gefiltertes Ticken auf den Offbeats.
 * - Alles laeuft durch einen kuenstlichen Hall (selbst erzeugte
 *   Impulsantwort), einen Hochpass und einen Kompressor. Bewusst ohne
 *   Bass: der Hochpass nimmt auch das Wummern, das der Hall aus den
 *   Flaechen zieht.
 *
 * Takt-Planung nach dem ueblichen Lookahead-Muster: ein Timer plant alle
 * 25 ms die Noten der naechsten 200 ms auf der Audio-Uhr ein. So bleibt das
 * Timing exakt, auch wenn der Haupt-Thread kurz haengt.
 */

const BPM = 84;
const ACHTEL = 60 / BPM / 2;
const ACHTEL_PRO_AKKORD = 24;

const midiZuHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Am9 - Fmaj7 - Cmaj7 - G6sus, als MIDI-Noten.
const AKKORDE = [
  { toene: [57, 60, 64, 67, 71] },
  { toene: [57, 60, 64, 65, 69] },
  { toene: [55, 59, 60, 64, 67] },
  { toene: [55, 59, 62, 64, 67] },
];

// Arpeggio-Muster als Index in die Akkordtoene (+5 = eine Oktave hoeher),
// null = Pause. Wiederholt sich je Akkord, wirkt aber durch die Pausen und
// das Echo nicht mechanisch.
const MUSTER = [0, null, 2, 4, null, 3, 5, null, 2, null, 4, 6, null, 3, null, 1];

function erzeugeHall(ctx, sekunden) {
  const laenge = Math.floor(ctx.sampleRate * sekunden);
  const puffer = ctx.createBuffer(2, laenge, ctx.sampleRate);
  for (let kanal = 0; kanal < 2; kanal += 1) {
    const daten = puffer.getChannelData(kanal);
    for (let i = 0; i < laenge; i += 1) {
      daten[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / laenge, 3.2);
    }
  }
  const hall = ctx.createConvolver();
  hall.buffer = puffer;
  return hall;
}

function erzeugeRauschen(ctx) {
  const puffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < daten.length; i += 1) daten[i] = Math.random() * 2 - 1;
  return puffer;
}

export function erzeugeAmbientMusik() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  const ctx = new AudioCtx();

  const master = ctx.createGain();
  master.gain.value = 0;
  const hochpass = ctx.createBiquadFilter();
  hochpass.type = 'highpass';
  hochpass.frequency.value = 120;
  hochpass.Q.value = 0.6;
  const kompressor = ctx.createDynamicsCompressor();
  kompressor.threshold.value = -18;
  kompressor.ratio.value = 3;
  // Ausgleich fuer den entfernten Sub-Bass: der trug viel Pegel, ohne ihn
  // laege dieselbe Reglerstellung rund 13 dB leiser.
  const ausgleich = ctx.createGain();
  ausgleich.gain.value = 3.2;
  master.connect(ausgleich).connect(hochpass).connect(kompressor).connect(ctx.destination);

  const hall = erzeugeHall(ctx, 4.5);
  const hallPegel = ctx.createGain();
  hallPegel.gain.value = 0.55;
  hall.connect(hallPegel).connect(master);

  const trocken = ctx.createGain();
  trocken.gain.value = 0.7;
  trocken.connect(master);

  // Echo fuer das Arpeggio: punktiertes Achtel, Rueckkopplung leicht gedaempft.
  const echo = ctx.createDelay(2);
  echo.delayTime.value = ACHTEL * 3;
  const echoRueck = ctx.createGain();
  echoRueck.gain.value = 0.38;
  const echoFilter = ctx.createBiquadFilter();
  echoFilter.type = 'lowpass';
  echoFilter.frequency.value = 2600;
  echo.connect(echoFilter).connect(echoRueck).connect(echo);
  echoFilter.connect(hall);
  echoFilter.connect(trocken);

  // Gemeinsamer Tiefpass der Flaechen, von einem sehr langsamen LFO bewegt.
  const flaechenFilter = ctx.createBiquadFilter();
  flaechenFilter.type = 'lowpass';
  flaechenFilter.frequency.value = 900;
  flaechenFilter.Q.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoTiefe = ctx.createGain();
  lfoTiefe.gain.value = 420;
  lfo.connect(lfoTiefe).connect(flaechenFilter.frequency);
  lfo.start();
  const flaechenPegel = ctx.createGain();
  flaechenPegel.gain.value = 0.11;
  flaechenFilter.connect(flaechenPegel);
  flaechenPegel.connect(hall);
  flaechenPegel.connect(trocken);

  const rauschen = erzeugeRauschen(ctx);

  const spieleFlaeche = (akkord, start, dauer) => {
    const anschlag = 2.6;
    const ausklang = 3.2;
    akkord.toene.forEach((note, i) => {
      [-6, 6].forEach((cent) => {
        const osz = ctx.createOscillator();
        osz.type = 'sawtooth';
        osz.frequency.value = midiZuHz(note);
        osz.detune.value = cent + (i % 2 ? 2 : -2);
        const huelle = ctx.createGain();
        huelle.gain.setValueAtTime(0, start);
        huelle.gain.linearRampToValueAtTime(0.09, start + anschlag);
        huelle.gain.setValueAtTime(0.09, start + dauer);
        huelle.gain.linearRampToValueAtTime(0, start + dauer + ausklang);
        osz.connect(huelle).connect(flaechenFilter);
        osz.start(start);
        osz.stop(start + dauer + ausklang + 0.1);
      });
    });
  };

  const spielePluck = (note, zeit, staerke) => {
    const osz = ctx.createOscillator();
    osz.type = 'triangle';
    osz.frequency.value = midiZuHz(note);
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0, zeit);
    huelle.gain.linearRampToValueAtTime(0.11 * staerke, zeit + 0.008);
    huelle.gain.exponentialRampToValueAtTime(0.0008, zeit + 0.9);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, zeit);
    filter.frequency.exponentialRampToValueAtTime(700, zeit + 0.5);
    osz.connect(filter).connect(huelle);
    huelle.connect(trocken);
    huelle.connect(echo);
    huelle.connect(hall);
    osz.start(zeit);
    osz.stop(zeit + 1);
  };

  const spieleTick = (zeit) => {
    const quelle = ctx.createBufferSource();
    quelle.buffer = rauschen;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 7200;
    filter.Q.value = 6;
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.05, zeit);
    huelle.gain.exponentialRampToValueAtTime(0.0005, zeit + 0.05);
    quelle.connect(filter).connect(huelle);
    huelle.connect(trocken);
    huelle.connect(hall);
    quelle.start(zeit, Math.random() * 0.5, 0.06);
  };

  let schritt = 0;
  let naechsteZeit = 0;
  let timer = null;
  let stoppTimer = null;
  let zielPegel = 0.3;
  let aktiv = false;

  const planen = () => {
    while (naechsteZeit < ctx.currentTime + 0.2) {
      const akkordIndex = Math.floor(schritt / ACHTEL_PRO_AKKORD) % AKKORDE.length;
      const akkord = AKKORDE[akkordIndex];
      const imAkkord = schritt % ACHTEL_PRO_AKKORD;

      if (imAkkord === 0) spieleFlaeche(akkord, naechsteZeit, ACHTEL * ACHTEL_PRO_AKKORD);

      // Arpeggio setzt im ersten Takt jedes Akkords aus: die Flaeche darf
      // erst einschwingen, das gibt der Musik Atem.
      if (imAkkord >= 4) {
        const stufe = MUSTER[imAkkord % MUSTER.length];
        if (stufe !== null) {
          const oktave = stufe >= 5 ? 12 : 0;
          const note = akkord.toene[stufe % 5] + 12 + oktave;
          spielePluck(note, naechsteZeit, imAkkord % 4 === 0 ? 1 : 0.7);
        }
      }

      if (schritt % 2 === 1 && schritt % 8 !== 7) spieleTick(naechsteZeit);

      naechsteZeit += ACHTEL;
      schritt += 1;
    }
  };

  const blende = (ziel, sekunden) => {
    const jetzt = ctx.currentTime;
    master.gain.cancelScheduledValues(jetzt);
    master.gain.setValueAtTime(master.gain.value, jetzt);
    master.gain.linearRampToValueAtTime(ziel, jetzt + sekunden);
  };

  return {
    async start() {
      clearTimeout(stoppTimer);
      if (ctx.state === 'suspended') await ctx.resume();
      if (!timer) {
        naechsteZeit = ctx.currentTime + 0.1;
        timer = setInterval(planen, 25);
        planen();
      }
      aktiv = true;
      blende(zielPegel, 4);
    },
    // Pegel 0..1 (linear). Waehrend die Musik laeuft, kurz nachgefuehrt
    // statt hart gesetzt - sonst knackt es beim Ziehen des Reglers.
    setzePegel(pegel) {
      zielPegel = pegel;
      if (aktiv) blende(pegel, 0.12);
    },
    stop() {
      aktiv = false;
      blende(0, 1.2);
      clearTimeout(stoppTimer);
      stoppTimer = setTimeout(() => {
        clearInterval(timer);
        timer = null;
        ctx.suspend();
      }, 1300);
    },
    pausieren() {
      clearInterval(timer);
      timer = null;
      return ctx.suspend();
    },
    async fortsetzen() {
      await ctx.resume();
      if (!timer) {
        naechsteZeit = ctx.currentTime + 0.1;
        timer = setInterval(planen, 25);
      }
    },
    schliessen() {
      clearTimeout(stoppTimer);
      clearInterval(timer);
      timer = null;
      ctx.close();
    },
  };
}
