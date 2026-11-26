# Filip Sudermann – Website & Creator Decks

Projektwissen für jede neue Claude-Session. Filip ist Growth Operator: Er baut
für deutschsprachige Spiritualitäts-, Mindset- und Bewusstseins-Creator
Skool-Community, Website und Funnel auf Gewinnbeteiligung. Antworte auf
Deutsch, direkt und ohne Floskeln.

## Was es gibt

- **Website** (React, Vite, Tailwind) unter filip-sudermann.com, Hosting auf
  Cloudflare Pages. Das Projekt ist mit GitHub verbunden: jeder Push auf einen
  Branch baut eine Vorschau, `main` ist live.
- **Creator Decks** unter `/pitch/<slug>`: personalisierte Pitch-Seiten, nur
  per Link (noindex, nicht verlinkt, nicht in der Sitemap), mit Impressum- und
  Datenschutz-Link. Sie kosten nichts extra.
  - Template: `src/pages/Pitch.jsx`, Mockups in `src/pitch/`
  - Ein Creator = eine Datendatei in `src/pitch/creators/`, eingetragen in
    `index.js`
- **Rechner** `src/pitch/potenzial.js`: 1:1 Filips Excel „Creator Revenue
  Rechner“. Nur ändern, wenn sich das Excel ändert. Test:
  `node scripts/pitch-rechner-test.mjs`.
- **Agent** `.claude/agents/creator-deck.md`: baut ein Deck vom Handle bis zum
  Push, inklusive Outreach-Mail, Follow-ups und Instagram-DM. Das ist die
  verbindliche Anleitung; dieses Dokument fasst sie nur zusammen.

## Skripte

- `node scripts/creator-daten.mjs --instagram … --tiktok … --youtube @… --linktree …`:
  öffentliche Daten ohne VidIQ.
- `node scripts/youtube-kommentare.mjs @handle 20`: Kommentare unter dem
  stärksten YouTube-Video über die offizielle API. Der Schlüssel liegt als
  Network secret der Umgebung (Host `www.googleapis.com`, Header
  `x-goog-api-key`). Bei „Permission denied“ fehlt er.
- `npx vite preview --port 4173` starten, dann
  `PLAYWRIGHT_PATH=$(npm root -g)/playwright node scripts/pitch-screenshot.cjs <slug> <ordner>`
  prüft Desktop und Handy auf Fehler und Überlauf.
- `… scripts/pitch-export.cjs <slug> export/<slug>` exportiert die Bausteine
  als PNG.

## Regeln für Creator (Filips Vorgaben)

- Deutschsprachig, Spiritualität, Mindset oder Bewusstsein, **10.000–100.000
  Instagram-Follower**. Es zählt nur Instagram, Plattformen werden nie addiert.
- **Creator mit und ohne bestehendes Angebot** sind willkommen. Raus nur, wer
  schon ein komplettes System hat: bezahlte Community, Website und
  High-Ticket-Angebot.
- **Mindestens 5.000 € Launch netto** laut Rechner, sonst kein Deck.
- Nie jemanden, den Filip schon kontaktiert hat. Die führende Liste ist Filips
  Notion-Datenbank „Alle Leads“. Kontaktdaten nie ins Repo; Outreach-Texte und
  Lead-Listen liegen in `export/`, und das ist gitignored.
- Texte im Tonfall und mit den Begriffen des Creators.

## Deck-Design (von Filip abgenommen, nicht eigenmächtig ändern)

- **Reihenfolge der Spalten:** Portfolio (gelb), „Wer ist Filip?“ (grün),
  „Das Beste System“, Funnel (Skool) mit Fulfillment, rechte Spalte.
- **Gelbe und grüne Box** sind gleich hoch. Der Instagram-Kopf ist im
  Desktop-Stil, mit der Bio neben dem Profilbild.
- **Filip-Box:**
  - Fotos Bühne und Strand (`public/pitch/filip/`)
  - Belege: Phil und Jonas, Manifestation Masterclass, Leaderboard mit Marcin
    Teodoru
  - Rechner kompakt
- **System-Diagramm:** quadratische Kästen mit runden Ecken.
- **Fulfillment:** 3 gleich große Kacheln im Skool-Stil. Classroom mit
  eigenem Bild und Text pro Kurs, Kalender-Termine in den Feldern.
- **Co-op Roadmap:**
  - 4 Phasen in 2×2 mit Pfeilen, Titel zentriert. Neda behält die Liste.
  - Steht direkt unter dem Website-Entwurf; ohne Website-Entwurf auf halber
    Höhe neben dem Skool-Mockup.
  - Fußzeile zur Gewinnbeteiligung: 80 % der Arbeit bei Filip, 70 % des
    Gewinns beim Creator.
- **Board:** Auf dem Desktop wird das ganze Board auf die Fensterbreite
  skaliert.

## Outreach (siehe Agent, Schritt 6b)

- **Einstieg:** ein echtes Kommentar-Zitat oder das Reel-Muster. Keine nackten
  Viewzahlen als Einstieg.
- **Danach:**
  - Marketinglücke: warum die Top-Reels laufen
  - Zeitgewinn
  - finanzielle Freiheit (Launch und MRR)
  - Beleg Jake Whan: rund 10.000 $ im Monat mit rund 300 Mitgliedern à 47 $
- **Links:** zuerst Loom, direkt dahinter der Deck-Link.
- **Rahmen:** Gewinnbeteiligung, keine Kosten vorab, alles gehört dem Creator.
- **Abschluss:** eine Ja/Nein-Frage.
- **Dazu:** 2 Follow-ups und eine Instagram-DM.

## Daten und Kosten

- **VidIQ** (Free-Plan, 150 Credits im Monat, Reset am 21.): pro Deck nur
  `vidiq_ig_profile` und `vidiq_ig_profile_reels` (10 Credits). Kein KI-Banner,
  keine VidIQ-Kommentare.
- **Kommentare kostenlos:** YouTube über die API, Instagram nur in Filips
  lokaler Desktop-Session über Claude in Chrome. Pro Creator ein Reel, nur
  lesen, bei Login-Abfrage abbrechen.
- **Freigegebene Hosts der Umgebung:** linktr.ee, www.instagram.com,
  i.instagram.com, www.tiktok.com, www.youtube.com, Instagram-CDN.
  Instagrams interne API nicht nutzen, die Login-Wand nie umgehen.

## Stand (25.11.2026)

- **Decks:** Neda Rezawi, Jessica Lenz, Nicole Frizler, Anna Kluger, Denise
  Lembrecht. Anna und Denise liegen unter 5.000 €.
- **Branch:** `claude/admiring-pasteur-rm6vep`. PR SantaFilip/filip-sudermann-website#15
  ist offen; erst nach Merge und Deploy laufen die Decks unter
  filip-sudermann.com.
- **Tagesrunde:** täglich 15:06 Uhr (Europe/Berlin). Sie baut bis zu 2 Decks
  aus Handles, die Filip schickt, und sucht nicht selbst.
- **Outreach v3** für Jessica und Nicole steht (26.11.2026, lokal in
  `export/outreach/`). YouTube-Schlüssel greift. Jessicas Kanal heißt
  @jessica-lenz, Nicoles @nicolespov.
- **Offen:** Größerer VidIQ-Plan für
  10 Decks am Tag: Boost (2.000 Credits) reicht für etwa 6–7, Max (6.000) für
  10.
