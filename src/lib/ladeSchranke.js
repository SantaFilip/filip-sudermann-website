/**
 * Die Seite erscheint auf einen Schlag statt Stueck fuer Stueck: bis alles
 * Sichtbare fertig ist, liegt der Ladevorhang aus index.html darueber.
 *
 * main.jsx legt beim Start fest, worauf gewartet wird (erwarte), die Teile
 * melden sich fertig (erledigt). Ist die Liste leer, faellt der Vorhang.
 * index.html hat eigene Notausgaenge (Zeitlimit, reine CSS-Absicherung) -
 * niemand bleibt vor einem leeren Bildschirm haengen, falls etwas nie meldet.
 */
let offen = null;
let freigegeben = false;

function zeigen() {
  if (freigegeben) return;
  freigegeben = true;
  window.__seiteZeigen?.();
}

export function erwarte(namen) {
  offen = new Set(namen);
  if (offen.size === 0) zeigen();
}

export function erledigt(name) {
  if (!offen || freigegeben) return;
  // Sichtbar in den DevTools (Performance) - zeigt, welches Teil am
  // laengsten auf sich warten laesst.
  if (offen.has(name)) performance.mark(`bereit:${name}`);
  offen.delete(name);
  if (offen.size === 0) zeigen();
}
