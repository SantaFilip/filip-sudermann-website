# Filip Sudermann Website — Standalone Export

Diese Version ist ein eigenständiger Nachbau deiner Base44-Website
(`filip-sudermann.com`), ohne Base44-Abhängigkeit. Das Original-Base44-Projekt
wurde dabei **nicht verändert** — dies ist eine separate Kopie.

## Was wurde entfernt / geändert (gegenüber dem Original)

- **Auth-Infrastruktur entfernt** (Login/Register/Reset-Password): Das waren
  ungenutzte Base44-Standard-Dateien, die auf der Live-Seite nie sichtbar waren.
- **`LeadMagnet.jsx` und `Testimonials.jsx` weggelassen**: Beide Komponenten
  existierten im Base44-Projekt, wurden aber in `Home.jsx` gar nicht
  eingebunden — toter Code.
- **Base44-E-Mail-Benachrichtigung in `ConsultationBooking.jsx` entfernt**:
  War nur eine Zusatz-Benachrichtigung bei Calendly-Buchungen — Calendly
  selbst verschickt bei jeder Buchung ohnehin eine Bestätigung.
- **`@base44/sdk` und `@base44/vite-plugin` komplett entfernt** — keine
  Backend-Abhängigkeit mehr.
- Nicht genutzte Pakete (Stripe, jsPDF, react-quill, etc. — Base44-Boilerplate,
  im aktiven Code nie verwendet) aus `package.json` entfernt.

## Was unverändert ist

Design, Texte (komplett DE/EN via `translations.js`), Layout, Animationen,
Calendly-Integration, Earth3D-Visualisierung — alles 1:1 wie im Original.

## Bilder

Die Bild-URLs zeigen aktuell noch auf `media.base44.com` (Base44s CDN). Das
funktioniert unabhängig vom Hosting weiter, ist aber eine externe
Abhängigkeit. Für volle Unabhängigkeit: Bilder herunterladen und in
`src/lib/links.js` (`IMAGES`) auf eigene URLs umstellen.

## Lokal starten

```bash
npm install
npm run dev
```

## Für Produktion bauen

```bash
npm run build
```
Ergebnis liegt in `dist/` — ein rein statischer Ordner, den du auf
Cloudflare Pages, Netlify oder Vercel hochladen kannst.

## Deployment auf Cloudflare Pages (empfohlen)

1. Auf [pages.cloudflare.com](https://pages.cloudflare.com) einloggen
2. "Create a project" → entweder Git-Repo verbinden, oder direkt den
   `dist/`-Ordner per Drag & Drop hochladen
3. Build-Kommando: `npm run build`, Output-Verzeichnis: `dist`
4. Danach unter "Custom domains" `filip-sudermann.com` hinzufügen und die
   angezeigten DNS-Einträge bei deinem Domain-Registrar setzen
