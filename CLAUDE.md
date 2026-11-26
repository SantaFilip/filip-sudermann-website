# Filip Sudermann – Website & Creator Decks

Projektwissen für jede neue Claude-Session. Filip ist Growth Operator: Er baut
für deutschsprachige Spiritualitäts-, Mindset- und Bewusstseins-Creator
Skool-Community, Website und Funnel auf Gewinnbeteiligung.

## Tonfall gegenüber Filip

Sprich wie ein knallharter Business-Mentor: Deutsch, direkte Ansagen, keine
Weichspüler-Formulierungen, keine Höflichkeitsfloskeln. Gib eine klare
Empfehlung statt einer Optionsliste, sag ehrlich, wenn etwas Zeit oder Geld
verbrennt, und rechne mit Zahlen statt mit Gefühl. Kurz halten: das
Ergebnis zuerst, dann was Filip als Nächstes tun muss.

## Was es gibt

- **Website** (React, Vite, Tailwind) unter filip-sudermann.com, Hosting auf
  Cloudflare Pages. Das Projekt ist mit GitHub verbunden: jeder Push auf einen
  Branch baut eine Vorschau, `main` ist live.
- **Decks gehen ohne Merge-Schritt live:** Ein Push auf einen `claude/`-Branch,
  der nur `src/pitch/creators/` und `public/pitch/` ändert, wird von
  `.github/workflows/decks-live.yml` nach Test und Build in `main` gemergt.
  Ab Erstellung gilt `https://filip-sudermann.com/pitch/<slug>`; prüfen mit
  `node scripts/pitch-live-check.mjs <slug>`. Filip will keinen separaten
  Merge machen.
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
- **Abgleich vor jedem Deck (Pflicht):** Handle und Name gegen Notion „Alle
  Leads“ prüfen; ist Notion nicht verbunden, gegen Filips CSV-Export
  `export/leads/alle-leads.csv`. Fehlt beides, kein Deck bauen und Filip
  fragen. Die Liste existiert nur bei Filip, nie im Repo.
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
- **Neues Design** (26.11.2026 abgenommen): `design: 'neu'` in der
  Datendatei. Abgerundete Karten mit Verlauf und weichem Schatten,
  Serifen-Titel, Hintergrund nach `geschlecht` ('w' Morgenröte mit Hügeln,
  'm' Berge im Dunst). Neue Decks bekommen es immer. Neda bleibt beim alten.
  Zum Vergleich: `?design=alt` bzw. `?design=neu&geschlecht=m`.

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

## Lokale Session mit Chrome (Suche und Reel-Zahlen kostenlos)

- Cloud-Sessions erreichen Filips Chrome nie. Für Instagram über Chrome eine
  lokale Session in der Desktop-App starten: Umgebung „Dieser Computer“,
  Ordner `C:\Users\filip\filip-sudermann-website`, dann den aktuellen
  Branch holen. Remote Control aus der Cloud war am 26.11. für alle Ordner
  gesperrt (vermutlich App-Version unter Windows).
- **Creator selbst suchen** nur lokal über Chrome: Instagram-Suche bzw.
  Hashtags (#manifestation, #seelenarbeit, #spiritualität), deutschsprachige
  Reels, Profile 10–100K. Höchstens 30 Profile am Tag mit Pausen, nur lesen,
  nichts liken oder folgen, bei Login-Abfrage abbrechen. Es ist Filips
  echter Account.
- **Reel-Zahlen über Chrome statt VidIQ:** im Reels-Tab die letzten 12
  Reels ohne angepinnte (Views, Likes, Kommentare). Dann kostet ein Deck
  0 Credits. Profilbild aus dem Profil speichern.
- `vidiq_instagram_account_discovery` nicht nutzen: liefert trotz Vorgabe
  keine deutschsprachigen Creator (10 Credits am 26.11. verbrannt).
- Websuche findet kaum passende Profile; Instagram blockt aus der Cloud nach
  wenigen Abrufen (429).

## Stand (26.11.2026)

- **Decks:** Neda Rezawi, Jessica Lenz, Nicole Frizler, Anna Kluger, Denise
  Lembrecht. Anna und Denise liegen unter 5.000 €.
- **Branch:** `claude/admiring-pasteur-rm6vep`. PR SantaFilip/filip-sudermann-website#15
  bringt `/pitch` und den Auto-Merge-Workflow erstmals auf `main`; dieser
  eine Merge ist Filips Klick (Claude darf `main` nicht selbst mergen). Bis
  dahin laufen die Decks nur unter der Vorschau, danach jedes neue Deck
  automatisch live.
- **Tagesrunde (Cloud):** täglich 15:06 Uhr (Europe/Berlin). Sie baut bis zu
  2 Decks aus Handles, die Filip schickt, und sucht nicht selbst. Suchen kann
  nur eine lokale Session (siehe oben).
- **VidIQ:** 30 Credits übrig bis zum Reset am 21.12.2026.
- **Alle 4 neueren Decks** (Jessica, Nicole, Anna, Denise) im neuen Design.
  Verschickbar nur Jessica und Nicole; Anna (3.127 €) und Denise (4.542 €)
  liegen unter 5.000 € und werden nicht angeschrieben.
- **Outreach v3** für Jessica und Nicole steht (26.11.2026, lokal in
  `export/outreach/`). YouTube-Schlüssel greift. Jessicas Kanal heißt
  @jessica-lenz, Nicoles @nicolespov.
- **Offen:** Größerer VidIQ-Plan für
  10 Decks am Tag: Boost (2.000 Credits) reicht für etwa 6–7, Max (6.000) für
  10.
