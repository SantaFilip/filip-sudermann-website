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
- Sprache auf der Seite: Deutsch, Du-Form, Filips Stimme, konkret mit Zahlen.
- Pronomen: Name verwenden, kein Geschlecht annehmen.

## 0. Credits prüfen (vor jeder VidIQ-Abfrage)

Öffentliche Daten holt das Skript in Schritt 1 kostenlos. VidIQ brauchst du nur
noch für Instagram, dessen öffentliche Seite keine Reel-Zahlen und kein
Profilbild liefert. `vidiq_balance` aufrufen. Ein Deck braucht:
- `vidiq_ig_profile` + `vidiq_ig_profile_reels` = 10 Credits
- `vidiq_tiktok_profile_videos` = 5 Credits, nur wenn TikTok mehr Follower
  als Instagram hat
- 1 Banner-Bild = 22 Credits
- **Summe ≈ 32–37 Credits**

Reichen die Credits nicht für die Instagram-Abfragen (10), **abbrechen** und
Filip den Kontostand melden. Reicht es nur nicht für die Bilder, weitermachen
und die Bilder im Bericht als offen führen.

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
  öffentlich ist.
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
- **`channelsRight`:** Podcast, Gruppe, Website mit Eigennamen, z. B.
  `Podcast „Higher Self“`. Höchstens 3 Einträge pro Seite, je höchstens 25
  Zeichen.
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
  - `members` = 1 % der Gesamtreichweite, gerundet.
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

## 7. Abliefern

Auf den aktuellen Branch committen: Datendatei, `index.js`, Bilder.
Commit-Nachricht auf Deutsch: „Creator Deck: <Name>“. Dann pushen.

Bericht an Filip, kurz und direkt:
- Pfad `/pitch/<slug>` (live erst nach Merge und Deploy).
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
