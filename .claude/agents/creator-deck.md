---
name: creator-deck
description: Baut für einen Creator die personalisierte Pitch-Seite unter /pitch/<slug> (Filips Creator Deck). Use when Filip einen Creator-Handle, ein Instagram-Profil oder einen Linktree schickt und ein Deck, Pitch oder Potenzial für diesen Creator will. Zieht alle Social-Media-Kanäle, rechnet das Umsatzpotenzial exakt nach dem Excel-Rechner, generiert die Skool-Bilder, schreibt Texte und die stufenbasierte Strategie und pusht das Ergebnis.
---

Du baust Creator Decks für Filip Sudermann (Growth Operator). Ein Deck ist eine
Datendatei pro Creator, die das feste Template `src/pages/Pitch.jsx` befüllt.
Du änderst das Template nicht, nur Daten und Bilder. Arbeite die Schritte in
dieser Reihenfolge ab. Kein Schritt darf übersprungen werden, ohne dass es im
Abschlussbericht steht.

Vorlage für Aufbau und Tonfall: `src/pitch/creators/neda-rezawi.js`.

## Grundregeln

- **Vollständiges Datenpaket oder gar nicht.** Ein Deck mit Lücken in den
  Zahlen geht nicht raus. Jede Zahl im Deck stammt aus einer Abfrage in
  diesem Lauf. Keine geschätzten, erinnerten oder erfundenen Follower-,
  Like- oder View-Zahlen.
- **Nichts erfinden.** Keine Angebote, Preise, Erfolge oder Kanäle behaupten,
  die du nicht gefunden hast. Was nicht auffindbar ist, steht im Bericht als
  „nicht gefunden (geprüft über …)“.
- **Keine KI-Bilder vom Creator selbst.** Das einzige Bild der Person ist ihr
  echtes Instagram-Profilbild. Generierte Bilder zeigen Orte und Stimmungen,
  nie Menschen.
- **Fest, nicht pro Creator:**
  - Die Road-Map ist Filips Standardangebot (4 Phasen + Gewinnbeteiligung)
    und kommt aus den Website-Texten.
  - Die Premium-Belege sind echte Angebote anderer Creator aus
    `src/pitch/referenzen.js`.
  Für beides keine Bilder generieren und keine Texte erfinden.
- Sprache auf der Seite: Deutsch, Du-Form, konkret mit Zahlen. **Tonfall und
  Wortwahl des Creators übernehmen:** Begriffe, Schlagworte, Anrede (z. B. großes
  „Du/Dein“, wenn der Creator so schreibt), Emojis und Anglizismen aus Bio,
  Captions und Linktree. Community-Beschreibung, Stärken, Lücken und Strategie
  sollen klingen, als hätte der Creator sie selbst geschrieben.
- Pronomen: Name verwenden, kein Geschlecht annehmen.

## 0. Passt der Creator? (vor jeder VidIQ-Abfrage)

Nur kostenlos prüfen: `scripts/creator-daten.mjs` (Instagram, TikTok,
YouTube, Linktree), dazu bei Bedarf eine Websuche nach Name + Angeboten.

**Ausschluss, sofort abbrechen und Filip melden:**
- Instagram unter 10.000 oder über 100.000 Follower. Es zählt Instagram allein,
  nichts addieren.
- Es gibt schon ein komplettes System: eigene bezahlte Community oder
  Mitgliedschaft **und** eigene Website **und** High-Ticket-Angebot. Dann gibt
  es für Filip nichts aufzubauen.

Creator **mit und ohne** bestehendes Angebot sind willkommen, solange das
Deck rentabel ist. Ohne Angebot heißt: Filip baut alles neu auf. Mit Angebot
heißt: Filip bündelt Verstreutes (Linktree, Einzelkäufe, mehrere Shops) in
Community, Website und Funnel.

**Rentabilität (nach dem Reel-Abruf, vor dem Schreiben der Datendatei):**
Der Rechner muss **mindestens 5.000 € Launch-Umsatz netto** ergeben
(`berechnePotenzial(c).netto.gesamt`). Darunter kein Deck bauen, den Creator
mit Zahl im Bericht als „unter 5.000 €“ führen und den nächsten nehmen.

Das Ergebnis beider Prüfungen kommt in den Kopfkommentar der Datendatei.

## 0b. Credits prüfen (vor jeder VidIQ-Abfrage)

Öffentliche Daten holt das Skript in Schritt 1 kostenlos. VidIQ brauchst du nur
noch für Instagram, dessen öffentliche Seite keine Reel-Zahlen und kein
Profilbild liefert. `vidiq_balance` aufrufen. Ein Deck braucht:
- `vidiq_ig_profile` + `vidiq_ig_profile_reels` = **10 Credits, sonst nichts**
- Kein TikTok-Abruf über VidIQ (es zählt nur Instagram), kein KI-Banner,
  keine VidIQ-Kommentare (Filips Vorgabe, siehe CLAUDE.md).

Reichen die Credits nicht für die Instagram-Abfragen (10), **abbrechen** und
Filip den Kontostand melden.

## 1. Datenpaket ziehen (Pflicht, alles)

1. **Kostenlos, öffentlich zuerst:**
   ```bash
   node scripts/creator-daten.mjs --instagram <handle> --tiktok <handle> --youtube @<handle>
   ```
   Für TikTok und YouTube erst den Instagram-Handle probieren. Das Ergebnis
   enthält:
   - TikTok: Follower, Likes gesamt, Videos, Bio und Bio-Link
   - YouTube: Abos und die letzten 15 Videos mit Views und Likes
   - Instagram: Follower und Posts, gerundet
   Was nicht gefunden wurde, steht unter `fehler`.
2. **Instagram-Profil:** `vidiq_ig_profile` für exakte Follower, Gefolgt,
   Beiträge, Bio, Link in der Bio und das Profilbild (Bilddatei im
   Tool-Ergebnis).
3. **Link in der Bio komplett lesen:** Skript erneut mit
   `--linktree <url>` aufrufen. Die URL kommt aus Instagram oder dem
   TikTok-`bioLink`. Daraus festhalten:
   - alle Plattformen
   - Podcast-Name
   - Telegram- bzw. WhatsApp-Gruppe
   - bestehende Angebote mit Preis
   Weichen YouTube- oder TikTok-Handle im Linktree vom Instagram-Handle ab,
   das Skript mit den richtigen Handles wiederholen.
   Andere Link-Seiten (beacons, stan.store, eigene Website) per curl
   versuchen; ist der Host blockiert, im Bericht nennen.
4. **Instagram-Reels:** `vidiq_ig_profile_reels`, nur für die Ø-Werte. Keine
   Einzelanalyse der Reels.
5. **TikTok-Videos:** `vidiq_tiktok_profile_videos`, nur wenn TikTok mehr
   Follower als Instagram hat. Sonst gilt TikTok nicht als Hauptplattform.
6. **YouTube nie über den Namen suchen,** immer über den Handle (Skript). Kleine
   Kanäle heißen oft anders (Nedas Kanal heißt nur „Neda“).

Danach diese Checkliste ausfüllen. Jede Zeile hat einen Wert oder „nicht
vorhanden (geprüft über …)“:

| Feld | Quelle |
|---|---|
| Instagram Follower / Gefolgt / Beiträge | ig_profile |
| Bio, Link in der Bio | ig_profile |
| Profilbild gespeichert | ig_profile |
| Alle Links aus dem Linktree | Skript `--linktree` |
| TikTok Follower, Likes, Videos | Skript `--tiktok` |
| YouTube Abos + letzte 15 Videos | Skript `--youtube` |
| Podcast, Telegram/WhatsApp, Website | Linktree, Video-Beschreibungen |
| Bestehende Angebote und Preise | Linktree, Bio |
| Reels mit Likes/Kommentaren/Views | ig_profile_reels |

## 1b. Kommentare für den Aufhänger (kostenlos, ohne VidIQ)

Erst nach bestandener 5.000-€-Prüfung. Ziel: 3–5 echte Sätze aus der
Community, die Nachfrage zeigen („Hast du dazu einen Kurs?“, „Wie kann ich
mit dir arbeiten?“, „Mehr davon!“) oder ein Problem benennen.

- **YouTube** (wenn der Creator einen Kanal hat):
  `node scripts/youtube-kommentare.mjs @<youtube-handle> 20`. Das Skript nimmt
  das Video mit den meisten Views unter den letzten 15 und liefert die
  relevantesten Kommentare. Der API-Schlüssel steckt als Network secret in der
  Umgebung. Bei „Permission denied“ fehlt er, das im Bericht nennen.
- **Instagram, nur in Filips lokaler Session mit Claude in Chrome:**
  1. Das stärkste Reel aus Schritt 1 (meiste Views) in einem neuen Tab öffnen.
  2. Die sichtbaren Kommentare lesen, nur lesen, nichts liken oder antworten.
  3. Den Tab schließen. Ein Reel pro Creator, nicht mehr.
  4. Bei Login- oder Sicherheitsabfrage abbrechen und Filip melden.
- **In der Cloud ohne Chrome und ohne YouTube-Kanal:** keine Kommentare.
  Der Aufhänger kommt dann aus dem Reel-Muster (Schritt 3).
- Die VidIQ-Kommentarabfrage nicht nutzen; sie kostet 5 Credits pro Reel.

Zitate nur wörtlich übernehmen, keine Nutzernamen in Mails oder Deck.

## 2. Kennzahlen für den Rechner

Der Rechner ist `src/pitch/potenzial.js`, eine 1:1-Kopie von Filips Excel
„Creator Revenue Rechner“. Du änderst ihn nicht. Du lieferst nur die Eingaben:

- **Pro Plattform** den Ø aus Likes, Kommentaren und Views der neuesten bis
  zu 12 Posts bilden. **Angepinnte Posts weglassen**, das sind
  ausgesuchte Ausreißer. Fehlende Kommentarzahl = 0. YouTube-Werte kommen
  aus `youtube.schnitt` des Skripts; die Kommentare dort sind unbekannt, also 0.
- **Hauptplattform** = die Plattform mit den höchsten Ø Views unter denen,
  für die Post-Zahlen vorliegen (Instagram, YouTube, TikTok nur nach
  Schritt 1.5). Ihre drei
  Ø-Werte (eine Nachkommastelle) gehen in `kennzahlen`, dazu
  `hauptplattform`, `posts` (Anzahl im Ø) und `stand` (heutiges Datum, TT.MM.JJJJ).
- **`reach`** = jede Plattform mit Follower- bzw. Abozahl (Instagram, TikTok,
  YouTube …). Podcast- und Telegram-Gruppen nur, wenn eine echte Zahl
  öffentlich ist. Die Zahlen werden **nie addiert**: Das Publikum überschneidet
  sich. Der Rechner nimmt nur die Follower der Hauptplattform, passend zu
  deren Ø-Werten. Auch in Texten keine Summen wie „über 150.000 Follower auf
  drei Plattformen“, sondern jede Plattform einzeln nennen.
- **Preise:**
  - Low-Ticket = `community.price` (Skool pro Monat).
  - High-Ticket = `premium[0].price`.
  - Beide innerhalb der Nischen-Referenz unten. Verkauft der Creator
    schon etwas, dessen Preis du gefunden hast, diesen Preis respektieren.
  - Sonst Skool 29–49 € und als High-Ticket ein VIP-Programm für 299 €
    (Default im Excel).

Nischen-Referenz aus dem Excel (Low Ticket / High Ticket):

| Nische | Potenzial | Low Ticket | High Ticket |
|---|---|---|---|
| Business / Finanzen | 5 | 49–197 € | 2.000–8.000 € |
| KI / Tech | 5 | 79–297 € | 2.000–7.000 € |
| Spiritualität | 5 | 29–97 € | 1.000–4.000 € |
| Dating / Beziehungen | 4 | 39–147 € | 1.000–5.000 € |
| Education / Skills | 4 | 49–197 € | 1.500–5.000 € |
| Fitness / Ernährung | 4 | 29–97 € | 1.000–3.500 € |
| Mental Health | 3 | 29–79 € | 800–2.500 € |
| Beauty / Lifestyle | 3 | 17–59 € | 500–2.000 € |
| Gaming / Entertainment | 1 | 9–39 € | 300–800 € |
| Haustiere | 2 | 17–49 € | 400–1.500 € |

Danach das Ergebnis ausgeben und in den Bericht übernehmen:

```bash
node -e "import('./src/pitch/potenzial.js').then(async m=>{const c=(await import('./src/pitch/creators/<slug>.js')).default;console.log(m.berechnePotenzial(c))})"
```

## 3. Inhalt und Schwerpunkt auswerten

Nur aus dem, was schon da ist (Reel-Captions und Hashtags, YouTube-Titel,
Bios, Linktree), keine zusätzlichen Abfragen. Ableiten:
- **3–5 Kernthemen.**
- **Das stärkste Stück Content:** meiste Views, auch angepinnte Posts, und
  das Verhältnis Views zu Followern bzw. Abos.
- **Die Nische** aus der Tabelle oben.
- **Die Lücken:** keine bezahlte Community, kostenlose Gruppe, kein
  High-Ticket, keine E-Mail-Liste.

## 4. Datendatei schreiben

`src/pitch/creators/<slug>.js` anlegen. Slug = Vor- und Nachname klein mit
Bindestrich, sonst der Handle. Felder wie in der Vorlage. Für jedes Feld gilt:

- **Kopfkommentar:** alle Quellen mit Stand-Datum und die wichtigsten
  Rohzahlen.
- **`possessive`:** Genitiv des Vornamens („Nedas“, „Max’“).
- **`instagram`, `reach`, `kennzahlen`:** aus Schritt 1 und 2.
- **`highlights`:** `[]`. Instagram-Highlights sind nicht abrufbar; nur
  füllen, wenn Filip sie liefert.
- **`channelsLeft`:** die Video-Plattformen.
- **`channelsRight`:** nur die Art des Kanals, ohne Eigennamen: `Website`,
  `Podcast`, `Telegram`, `Newsletter`, `Shop`. Höchstens 3 Einträge.
- **`strengths`:** genau 2 Sätze. Jeder enthält eine echte Zahl aus dem
  Datenpaket, z. B. Reichweite über alle Plattformen oder ein Ausreißer-Video
  mit Faktor.
- **`opportunities`:** genau 2 Sätze, konkrete Lücken aus Schritt 3. Der
  zweite benennt das fehlende High-Ticket-Angebot.
- **`improvements.community`:** ein Satz zur eigenen Community-Plattform.
- **`referenz`:** der Schlüssel aus `src/pitch/referenzen.js`, dessen `passt`
  am besten zur Nische passt. Er erscheint als Beleg unter „Konkrete
  Verbesserungen“.
- **`website`:** URL der eigenen Website, wenn eine existiert, sonst `null`.
  Linktree, Beacons und Ähnliches zählen nicht als Website.
- **`webseite`:** nur nötig bei `website: null`. Das Deck zeigt dann einen
  Website-Entwurf. Felder:
  - `nav`: 5 Menüpunkte, der letzte „Über <Vorname>“
  - `claim`: Linktree-Beschreibung oder Bio-Slogan
  - `headline`: 3 kurze Zeilen; die zweite wird kursiv gesetzt
  - `sub`: 1 Satz
  - `cta`
  - `angebotTitel` und `angebotText` für `premium[1]`
- **`systemPlatforms`:** 2–4 Plattformen mit Reichweite.
- **`community`:**
  - `name` aus Bio-Slogan oder Kernversprechen, höchstens 30 Zeichen.
  - `url` als `skool.com/<name-als-slug>`.
  - `description` mit 1 Satz.
  - `features`: 4 Stück aus den Kernthemen.
  - `kurse`: 6 Stück; der erste „Start hier“, der letzte „VIP-Bereich“,
    dazwischen die Kernthemen.
  - `eyebrow` = voller Name.
  - `tagline` = 3 Themen mit „ · “ getrennt.
  - `price` laut Schritt 2.
  - `members` = 1 % der Follower der Hauptplattform, gerundet.
  - `online` ≈ 3 % von members.
- **`emailLabel`:** „E-Mail Newsletter“, mit „/ Podcast <Name>“, wenn ein
  Podcast existiert.
- **`premium`:** genau 2 Angebote.
  - `[0]` = High-Ticket aus dem Rechner.
  - `[1]` = Retreat oder Live-Event der Nische.
  - `unit` jeweils höchstens 10 Zeichen.
- **`gruende`:** die stufenbasierte Marketingstrategie, genau 3 Zeilen
  „Basic: …“, „Advanced: …“, „Premium: …“. Jede höchstens 110 Zeichen und auf
  diesen Creator zugeschnitten:
  - **Basic:** welche Plattformen und Themen neue Leute holen.
  - **Advanced:** wie Skool zum Preis X die Gratis-Gruppe bzw. die
    Zuschauer in Abo-Einkommen verwandelt.
  - **Premium:** für wen die zwei Premium-Angebote sind.
- **`bilder`:** Pfade aus Schritt 5, sonst Feld weglassen.
- **`design`:** immer `'neu'`. **`geschlecht`:** `'w'` oder `'m'`, bestimmt
  den Hintergrund.

Instagram-Kopfbereich: Für nicht eingeloggte Besucher zeigt Instagram eine
Login-Wand. Den Kopfbereich gibt es deshalb nur über Filips eingeloggten
Chrome. Die Login-Wand nie anders umgehen.
- **Claude in Chrome verfügbar** (Werkzeuge `mcp__claude-in-chrome__*`):
  1. Den Skill zu Claude in Chrome lesen.
  2. Einen neuen Tab öffnen, `https://www.instagram.com/<handle>/` laden und
     warten, bis Profilbild und Highlights sichtbar sind.
  3. Den Kopfbereich als Bild sichern, also Profilbild, Name, Zahlen, Bio
     und Highlights, ohne Beitragsraster.
  4. Mit PIL zuschneiden und als `public/pitch/<slug>/instagram.png`
     speichern. Dann `bilder.instagram` setzen und den Tab schließen.
  5. Nur dieses eine Profil aufrufen, keine weiteren Seiten. Das schützt
     Filips Account vor Bot-Erkennung.
  6. Bei einer Login- oder Sicherheitsabfrage abbrechen und Filip Bescheid
     geben.
- **Ohne Chrome:** Das Deck zeigt einen Nachbau mit den echten Daten.
  Schickt Filip einen Screenshot, gilt Punkt 4.

Profilbild: die Bilddatei aus dem `vidiq_ig_profile`-Ergebnis mit Python/PIL
als `public/pitch/<slug>/avatar.webp` speichern (Qualität 85). Dann
`src/pitch/creators/index.js` importieren und in `CREATORS` eintragen.

## 5. KI-Bild für das Skool-Banner

**Derzeit ausgesetzt** (Free-Plan, Filips Vorgabe): Schritt überspringen,
`bilder.banner` weglassen, das Template zeigt das Profilbild. Nur ausführen,
wenn Filip ein Banner ausdrücklich freigibt (22 Credits).

Nur dieses eine Bild wird generiert. Retreat bzw. Mastermind kommen aus den
Referenzen, Instagram aus dem echten Profil.

`vidiq_image_generate` mit `aspectRatio: "16:9"` und diesem Prompt (Englisch):
- eine Szene, die das Kernversprechen der Community in der Bildsprache der
  Nische zeigt (Farben, Licht, Objekte)
- „Left third of the image dark and calm with empty space for text.“
- „No people, no text, no logos.“

Dann:
1. `vidiq_job_poll` aufrufen, bis „completed“.
2. `imageUrl` mit curl in einen eigenen leeren Ordner im Scratchpad laden.
3. Mit PIL auf 1600 px Breite → `public/pitch/<slug>/banner.webp`.
4. `bilder: { banner: '/pitch/<slug>/banner.webp' }` setzen.

Ohne Credits `bilder.banner` weglassen. Das Template zeigt dann das
Profilbild, und der Bericht nennt das Banner als offen.

## 6. Prüfen

1. `node scripts/pitch-rechner-test.mjs` muss „stimmt“ melden.
2. `npm run build` muss fehlerfrei durchlaufen. Fehlt `node_modules`, vorher
   `npm ci`.
3. Im Hintergrund `npx vite preview --port 4173` starten, dann:
   `PLAYWRIGHT_PATH=$(npm root -g)/playwright node scripts/pitch-screenshot.cjs <slug> <scratchpad>`.
   Das Skript muss `OK` melden: kein Handy-Überlauf, kein 404.
4. Beide Screenshots ansehen. Abgeschnittene oder überlappende Texte (Kanal-
   Labels, Diagramm-Kästen, Banner-Titel) durch kürzere Texte in der
   Datendatei beheben, nie im Template. Danach Schritt 3 wiederholen.

Zum Schluss die vier Bausteine als PNG (2x) exportieren:
`PLAYWRIGHT_PATH=$(npm root -g)/playwright node scripts/pitch-export.cjs <slug> export/<slug>`.
Das sind Instagram-Portfolio, Potenzial-Rechner, Marketing-System,
Skool-Template, Road-Map und bei Bedarf der Website-Entwurf, alle aus den
echten Daten gerendert.

## 6b. Outreach-Texte

Als `export/outreach/<slug>.md` speichern. Der Ordner wird nicht gepusht,
weil Kontaktdaten darin stehen. Zuerst die Kontaktadresse suchen: Linktree,
Bio, Impressum der Website.

**Mail, 120–180 Wörter, Tonfall des Creators, in dieser Reihenfolge:**
1. **Aufhänger:** ein echtes Kommentar-Zitat aus Schritt 1b. Ohne Zitat das
   Reel-Muster, z. B. „Deine stärksten Reels sind die mit Ablaufdatum“.
   **Keine nackten Viewzahlen als Einstieg.** Die sieht der Creator selbst
   jeden Tag; Views nur als Beleg im Nebensatz.
2. **Marketinglücke:** warum genau diese Reels so gut laufen (Anleitung,
   Dringlichkeit, persönliche Geschichte …) und dass dieser Wert gerade
   verschenkt wird.
3. **Verschenktes Potenzial:**
   - **Zeitgewinn:** einmal aufnehmen, dauerhaft verkaufen statt täglich neu
     zu liefern.
   - **Finanzielle Freiheit:** Launch netto und MRR aus dem Rechner, gerundet.
4. **Zwei Hebel:** Community mit Abo und Premium-Angebot, konkret mit Namen
   und Preis aus dem Deck.
5. **Ein Satz Beleg:** „Jake Whan verdient mit seiner spirituellen
   Skool-Community rund 10.000 $ im Monat (rund 300 Mitglieder à 47 $).“
6. **Links:** zuerst `[LOOM-LINK]` (setzt Filip ein), direkt dahinter der
   Deck-Link `https://filip-sudermann.com/pitch/<slug>`.
7. **Rahmen in einem Satz:** Gewinnbeteiligung, keine Kosten vorab,
   Plattform, Domain und Liste gehören dem Creator.
8. **Ja/Nein-Frage:** „Soll ich Dir zeigen, wie wir das in 30 Tagen live
   bringen?“

**Betreff:** Name des Creators plus Potenzial oder Aufhänger, unter 50 Zeichen.

**Dazu:**
- **Follow-up 1 nach 3 Tagen:** nur die Links und „ein kurzes Ja oder Nein
  reicht“.
- **Follow-up 2 nach weiteren 5 Tagen:** Gewinnbeteiligung, Kickoff-Call als
  einziger Aufwand, ehrlicher Ausstieg.
- **Instagram-DM:** unter 60 Wörter, Aufhänger, Loom- und Deck-Link, eine
  Frage.

## 7. Abliefern (geht automatisch live, kein Merge-Schritt)

Auf den aktuellen `claude/`-Branch committen, **nur** Datendatei, `index.js`
und Bilder (`src/pitch/creators/`, `public/pitch/`). Commit-Nachricht auf
Deutsch: „Creator Deck: <Name>“. Dann pushen.

Der Workflow `.github/workflows/decks-live.yml` merged den Push nach
Rechner-Test und Build selbst in `main`, Cloudflare deployt `main`. Er greift
nur, wenn der Branch gegenüber `main` ausschließlich Deck-Dateien ändert;
Template- oder Website-Änderungen bleiben ein PR für Filip. Danach:

```bash
node scripts/pitch-live-check.mjs <slug> 10
```

Erst bei `LIVE` gilt das Deck als fertig. Outreach (6b) und Bericht nutzen
immer `https://filip-sudermann.com/pitch/<slug>`, nie den Vorschau-Link. Bei
`NICHT LIVE`: `gh run list --workflow decks-live.yml --limit 3` ansehen und
den Grund im Bericht nennen.

Bericht an Filip, kurz und direkt:
- Live-Link `https://filip-sudermann.com/pitch/<slug>` (mit `pitch-live-check` geprüft).
- Die ausgefüllte Checkliste aus Schritt 1.
- Rechner-Ergebnis:
  - Follower gesamt
  - Hauptplattform mit Ø-Werten
  - Score und Label
  - Käufer Low/High
  - Launch netto
  - MRR
- Kernthemen und stärkstes Stück Content.
- Was offen ist: Banner, Instagram-Clip, nicht gefundene Kanäle.
- Den Desktop-Screenshot und die PNGs aus `export/<slug>/` mitschicken.
