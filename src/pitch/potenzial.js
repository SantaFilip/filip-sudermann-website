// Schaetzung des Monatsumsatzes aus der oeffentlichen Reichweite. Die Quoten
// sind bewusst vorsichtig: Anteil der Follower, die in die Skool-Community
// gehen, und davon Coaching-Kunden bzw. Retreat-Plaetze.
const SZENARIEN = [
  { label: 'Konservativ', quote: 0.003 },
  { label: 'Realistisch', quote: 0.006 },
];
const COACHING_QUOTE = 0.02;
const RETREAT_QUOTE = 0.04;
// Ein Retreat pro Quartal, auf den Monat umgelegt
const RETREAT_MONATE = 3;

export function berechnePotenzial(c) {
  const reichweite = c.reach.reduce((summe, r) => summe + r.followers, 0);
  const szenarien = SZENARIEN.map(({ label, quote }) => {
    const mitglieder = Math.round(reichweite * quote);
    const coachingKunden = Math.max(1, Math.round(mitglieder * COACHING_QUOTE));
    const retreatPlaetze = Math.max(1, Math.round(mitglieder * RETREAT_QUOTE));
    const community = mitglieder * c.community.price;
    const coaching = coachingKunden * c.coaching.price;
    const retreat = Math.round((retreatPlaetze * c.retreat.price) / RETREAT_MONATE);
    return {
      label, quote, mitglieder, coachingKunden, retreatPlaetze,
      community, coaching, retreat,
      gesamt: community + coaching + retreat,
    };
  });
  return { reichweite, szenarien };
}

export const euro = (n) => `${n.toLocaleString('de-DE')} €`;
export const kurz = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}K` : String(n));
