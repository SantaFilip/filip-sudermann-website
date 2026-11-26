// Stand 20.11.2026, alle Zahlen aus diesem Lauf.
// Instagram (vidiq_ig_profile + eingeloggter Chrome): 21.763 Follower,
// 108 Gefolgt, 199 Beitraege, Bio und Link wie unten, Highlights aus Chrome.
// Linktree linktr.ee/NedaRezawi: Telegram "Dein Safe Space" (t.me, oeffentlich
// 125 Abonnenten), YouTube @neda.rezawi, Podcast "Higher Self" (Spotify),
// Instagram, TikTok. Keine Website, kein Newsletter, kein bezahltes Angebot
// (auch nicht in den YouTube-Beschreibungen).
// TikTok (Profilseite): 30.200 Follower, 601.700 Likes, 996 Videos.
// YouTube (Kanalseite + RSS): 4.400 Abos, letzte 15 Videos Ø 1.272 Views.
// Staerkstes Stueck: angepinntes TikTok "Koran lernen" mit 322,9K Views
// (10,7x Follower); "Innerer Frieden" 108,2K, "Aura/Selbstbewusstsein" 89,4K.
// Themen: Selbstliebe, Selbstbewusstsein, Komfortzone/Angst, Journaling,
// innerer Frieden.
export default {
  slug: 'neda-rezawi',
  name: 'Neda',
  possessive: 'Nedas',
  fullName: 'Neda Rezawi',
  handle: 'neda.rezawi',
  avatar: '/pitch/neda-rezawi/avatar.webp',
  category: 'Digital Creator',
  bio: ['My Soul: 👩🏻‍🏫📖☕️🎙️✨', 'Ich will dich strahlen sehen 💗'],
  link: 'linktr.ee/NedaRezawi',
  highlights: ['YouTube', 'Outfits', 'Queen mindset', 'Deep Talk Q&A', 'health 💗', 'Podcast', 'inner child', 'books', 'trip'],

  // Instagram steht im Profil-Mockup; alle Plattformen mit Followern zaehlen
  // in die Reichweite der Potenzial-Rechnung.
  instagram: { followers: 21763, following: 108, posts: 199 },
  reach: [
    { platform: 'Instagram', followers: 21763 },
    { platform: 'TikTok', followers: 30200 },
    { platform: 'YouTube', followers: 4400 },
    { platform: 'Telegram', followers: 125 },
  ],
  // Fuer den Rechner: Hauptplattform = hoechste Ø Views. Instagram, 12 Reels
  // vom 16.-20.11.2026, keins angepinnt (TikTok ohne angepinnte: 7 Videos,
  // Ø 2.058 Views; YouTube: 15 Videos, Ø 1.272 Views).
  kennzahlen: { hauptplattform: 'Instagram', likes: 160.5, kommentare: 4.2, views: 7775, posts: 12, stand: '20.11.2026' },
  channelsLeft: ['Instagram', 'YouTube', 'TikTok'],
  channelsRight: ['Podcast', 'Telegram'],

  strengths: [
    'Du erreichst 21.700 Follower auf Instagram und 30.200 auf TikTok, die mit dir interagieren',
    'Dein TikTok über inneren Frieden hat 108.000 Views, 3,6× deine Follower: die Nachfrage nach deinen Mindset-Themen ist da',
  ],
  opportunities: [
    'Dein Telegram „Safe Space“ ist kostenlos und hat 125 Mitglieder: es fehlt eine interaktive Community-Plattform',
    'Es gibt noch kein High-Ticket-Angebot: ein VIP-Programm wäre phänomenal effektiv',
  ],
  improvements: {
    community: 'Eine eigene Community-Plattform mit verschiedenen Lernpaketen, um das wahre Potenzial zu leben',
  },
  // Beleg fuer das zweite Premium-Angebot, siehe src/pitch/referenzen.js
  referenz: 'jake-whan',
  // Eigene Website? URL eintragen, sonst zeigt das Deck einen Entwurf
  website: null,
  webseite: {
    nav: ['Community', 'Kurse', 'Podcast', 'Retreats', 'Über Neda'],
    claim: 'Weil du es verdienst, ein erfülltes Leben zu führen.',
    headline: ['Selbstliebe leben.', 'Mutig wachsen.', 'Strahlen.'],
    sub: 'Selbstliebe, Journaling und der Schritt aus der Komfortzone, mit Neda und einer Community, die dich trägt.',
    cta: 'Finde deinen Einstieg',
    angebotTitel: 'Drei Tage. Zurück zu dir.',
    angebotText: 'Mindset & Identität, live mit Neda',
  },

  // Plattform-Kaesten oben im System-Diagramm
  systemPlatforms: ['YouTube', 'TikTok', 'Instagram'],
  community: {
    name: 'Ich will dich strahlen sehen',
    url: 'skool.com/ich-will-dich-strahlen-sehen',
    description: 'Die Community für mehr Selbstbewusstsein, ein starkes Mindset und persönliches Wachstum – mit Neda.',
    features: ['Selbstliebe & Selbstbewusstsein', 'Raus aus der Komfortzone', 'Journaling-Impulse & Selfcare', 'Innerer Frieden im Hier und Jetzt'],
    eyebrow: 'Neda Rezawi',
    tagline: 'Mindset · Selbstbewusstsein · Wachstum',
    price: 30,
    kurse: ['Start hier', 'Selbstliebe', 'Komfortzone', 'Journaling', 'Innerer Frieden', 'VIP-Bereich'],
    members: 218,
    online: 7,
  },
  emailLabel: 'E-Mail Newsletter / Podcast Higher Self',
  // Erstes Angebot = High-Ticket im Rechner
  premium: [
    { title: 'VIP-Programm', price: 2000, unit: '3 Monate' },
    { title: 'Group Retreats', price: 1000, unit: 'Weekend' },
  ],
  // Stufenbasierte Strategie, passend zum Diagramm
  gruende: [
    'Basic: Reels & TikToks zu Selbstliebe und Komfortzone holen täglich neue Menschen in deinen Safe Space',
    'Advanced: Die Skool-Community für 30 €/Monat macht aus dem kostenlosen Telegram ein Abo-Einkommen',
    'Premium: VIP-Programm und Retreats für alle, die tiefer an ihrer Identität arbeiten wollen',
  ],
  bilder: { instagram: '/pitch/neda-rezawi/instagram.png' },
  // Neda behaelt die schlichte Roadmap-Liste
  roadmapStil: 'liste',
};
