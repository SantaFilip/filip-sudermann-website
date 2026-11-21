// Oeffentliche Daten, Stand 21.11.2026. Linktree: Telegram "Dein Safe Space",
// YouTube @neda.rezawi, Podcast "Higher Self" (Spotify), Instagram, TikTok.
// VidIQ: Instagram 21,8K / 199 Beitraege, TikTok 30,2K / 996 Videos,
// YouTube 4,4K Abos. Staerkstes Video: "Wie du lernst, diszipliniert zu
// sein" mit 65,6K Views. Themen: Disziplin, Journaling, Selbstliebe,
// Zukunftsaengste, Mobbing, Selbstbild.
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
  highlights: ['Outfits', 'Queen mindset', 'YouTube', 'Deep Talk Q&A', 'Health', 'Podcast', 'Inner child'],

  // Instagram steht im Profil-Mockup; alle Plattformen mit Followern zaehlen
  // in die Reichweite der Potenzial-Rechnung.
  instagram: { followers: 21800, following: 108, posts: 199 },
  reach: [
    { platform: 'Instagram', followers: 21800 },
    { platform: 'TikTok', followers: 30200 },
    { platform: 'YouTube', followers: 4400 },
  ],
  // Fuer den Rechner: Hauptplattform = hoechste Ø Views. Instagram, 12 Reels
  // vom 16.-20.11.2026 (TikTok ohne angepinnte: Ø 2,1K Views).
  kennzahlen: { hauptplattform: 'Instagram', likes: 160.5, kommentare: 4.2, views: 8275, posts: 12, stand: '21.11.2026' },
  channelsLeft: ['Instagram', 'YouTube', 'TikTok'],
  channelsRight: ['Podcast „Higher Self“', 'Telegram „Safe Space“'],

  strengths: [
    'Du hast über 56.000 Follower auf drei Plattformen, die mit dir interagieren',
    'Dein Disziplin-Video hat 65.000 Views, 15× deine Abozahl: die Nachfrage nach deinen Mindset-Themen ist da',
  ],
  opportunities: [
    'Dein Telegram „Safe Space“ ist kostenlos: es fehlt eine interaktive Community-Plattform',
    'Ein VIP-Programm wäre phänomenal effektiv',
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
    headline: ['Selbstliebe leben.', 'Disziplin aufbauen.', 'Strahlen.'],
    sub: 'Mindset, Journaling und Routinen, die dich wirklich verändern, mit Neda und einer Community, die dich trägt.',
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
    features: ['Disziplin & Routinen', 'Journaling-Impulse', 'Dein Safe Space mit Gleichgesinnten', 'Live-Sessions, Q&As und Challenges'],
    eyebrow: 'Neda Rezawi',
    tagline: 'Mindset · Selbstbewusstsein · Wachstum',
    price: 30,
    kurse: ['Start hier', 'Selbstliebe', 'Disziplin', 'Journaling', 'Komfortzone', 'VIP-Bereich'],
    members: 305,
    online: 8,
  },
  emailLabel: 'E-Mail Newsletter / Podcast Higher Self',
  // Erstes Angebot = High-Ticket im Rechner
  premium: [
    { title: 'VIP-Programm', price: 299, unit: '3 Monate' },
    { title: 'Group Retreats', price: 1000, unit: 'Weekend' },
  ],
  // Stufenbasierte Strategie, passend zum Diagramm
  gruende: [
    'Basic: Reels & TikToks zu Selbstliebe und Komfortzone holen täglich neue Menschen in deinen Safe Space',
    'Advanced: Die Skool-Community für 30 €/Monat macht aus dem kostenlosen Telegram ein Abo-Einkommen',
    'Premium: VIP-Programm und Retreats für alle, die tiefer an ihrer Identität arbeiten wollen',
  ],
};
