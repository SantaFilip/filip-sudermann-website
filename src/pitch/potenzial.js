// Basis ist der "Creator Revenue Rechner" (Excel, Blatt "Creator Pitch Kalkulator").
// Zellbezuege in Klammern. Aenderungen hier nur, wenn Filip sie vorgibt;
// scripts/pitch-rechner-test.mjs prueft gegen das Beispiel im Excel.
//
// Abweichung vom Excel seit 26.11.2026 (Filips Vorgabe): Das VIP-Programm ist
// persoenlich und zeitintensiv, deshalb hoechstens 15 VIP-Kaeufer pro Launch,
// und der VIP-Preis haengt am Score (vipPreis). Im Excel nachziehen.

// Annahmen (C21:D23), Preise kommen pro Creator aus den Daten
export const ANNAHMEN = {
  convLow: 0.0075,
  convHigh: 0.0025,
  churn: 0.15,
  gebuehren: 0.1,
  realismus: 0.7,
  maxVip: 15,
};

// VIP-Preis (Filips Vorgabe 26.11.2026): Standard 1.000 €. 2.000 € nur, wenn
// die Datendatei `vipHoch` mit Begruendung setzt: sehr engagierte, kaufbereite
// Community (Engagement-Rate ab 3 %) oder der Creator verkauft schon Kurse bzw.
// Programme ab ca. 300 €. Schwache Metrics (Score unter 25): 500 €.
// In der Datendatei als premium[0].price eintragen.
export function vipPreis(score, hoch = false) {
  if (score < 25) return 500;
  return hoch ? 2000 : 1000;
}

// Excel-ROUND: kaufmaennisch, auch bei Gleitkomma-Resten wie 189.4999999
const runde = (x) => Math.sign(x) * Math.round(Math.abs(x) + 1e-9);

// Bedeutung des Scores (B17)
export function scoreLabel(score) {
  if (score >= 70) return '🔥 Heiß – sehr kaufbereite Audience';
  if (score >= 45) return '✅ Gut – solide Basis für Launch';
  if (score >= 25) return '⚠️ Mittel – Launch möglich, mehr Aufwand';
  if (score >= 10) return '🔴 Schwach – Audience kaum monetarisierbar';
  return '❌ Zu wenig Daten';
}

/**
 * @param {object} e
 * @param {number} e.follower  Follower gesamt ueber alle Plattformen (C8)
 * @param {number} e.likes     Ø Likes pro Post der Hauptplattform (C12)
 * @param {number} e.kommentare Ø Kommentare pro Post (C13)
 * @param {number} e.views     Ø Views pro Post (C14)
 * @param {number} e.preisLow  Low-Ticket-Preis (C21)
 * @param {number} e.preisHigh High-Ticket-Preis (D21)
 */
export function rechne({ follower, likes, kommentare, views, preisLow, preisHigh }) {
  const a = ANNAHMEN;
  const engagementRate = follower > 0 ? (likes + kommentare) / follower : 0; // C15
  const score = follower > 0 // C16
    ? Math.min(100, runde((likes / follower * 40 + kommentare / follower * 50 + views / follower * 10) / 0.05))
    : 0;
  const faktor = Math.min(1.4, Math.max(0.4, score / 50));
  const kaeuferLow = Math.max(1, runde(follower * a.convLow * faktor * a.realismus)); // C27
  const kaeuferHigh = Math.min(a.maxVip, Math.max(0, runde(follower * a.convHigh * faktor * a.realismus))); // D27, gedeckelt
  const bruttoLow = kaeuferLow * preisLow; // C28
  const bruttoHigh = kaeuferHigh * preisHigh;
  const nettoLow = bruttoLow * (1 - a.gebuehren); // C30
  const nettoHigh = bruttoHigh * (1 - a.gebuehren);
  const mrr = kaeuferLow * preisLow * (1 - a.churn); // C31, High-Ticket hat kein Abo
  return {
    engagementRate, score, label: scoreLabel(score), faktor,
    kaeufer: { low: kaeuferLow, high: kaeuferHigh, gesamt: kaeuferLow + kaeuferHigh },
    brutto: { low: bruttoLow, high: bruttoHigh, gesamt: bruttoLow + bruttoHigh },
    gebuehren: { low: bruttoLow * a.gebuehren, high: bruttoHigh * a.gebuehren, gesamt: (bruttoLow + bruttoHigh) * a.gebuehren },
    netto: { low: nettoLow, high: nettoHigh, gesamt: nettoLow + nettoHigh },
    mrr,
  };
}

// Rechnet aus einer Creator-Datei mit Followern und Engagement derselben
// Hauptplattform. Plattformen nicht addieren: das Publikum ueberschneidet sich,
// und die Ø-Werte gehoeren nur zu dieser einen Plattform.
// Low-Ticket = Skool-Preis, High-Ticket = erstes Premium-Angebot.
export function berechnePotenzial(c) {
  const k = c.kennzahlen;
  const follower = c.reach.find((r) => r.platform === k.hauptplattform).followers;
  return {
    follower,
    ...rechne({
      follower,
      likes: k.likes,
      kommentare: k.kommentare,
      views: k.views,
      preisLow: c.community.price,
      preisHigh: c.premium[0].price,
    }),
  };
}

export const euro = (n) => `${Math.round(n).toLocaleString('de-DE')} €`;
export const kurz = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}K` : String(Math.round(n)));
