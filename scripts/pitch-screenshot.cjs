// Screenshots einer Pitch-Seite (Desktop + Handy) und Pruefung auf
// waagerechten Ueberlauf am Handy. Erwartet `npx vite preview --port 4173`.
// Aufruf: PLAYWRIGHT_PATH=$(npm root -g)/playwright node scripts/pitch-screenshot.cjs <slug> <ordner>
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const path = require('path');

const [slug, ordner = '.'] = process.argv.slice(2);
if (!slug) { console.error('Slug fehlt'); process.exit(1); }
const url = `http://localhost:4173/pitch/${slug}`;

(async () => {
  const browser = await chromium.launch();
  const fehler = [];
  for (const [name, breite] of [['desktop', 2300], ['handy', 390]]) {
    // Pixeldichte 3: das Desktop-Bild geht als "Deck Desktop.png" an Filip und muss scharf sein
    const seite = await browser.newPage({ viewport: { width: breite, height: 1000 }, deviceScaleFactor: 3 });
    seite.on('pageerror', (e) => fehler.push(e.message));
    await seite.goto(url, { waitUntil: 'networkidle' });
    await seite.waitForTimeout(1000);
    const datei = path.join(ordner, `${slug}-${name}.png`);
    await seite.screenshot({ path: datei, fullPage: true });
    const scrollBreite = await seite.evaluate(() => document.documentElement.scrollWidth);
    if (name === 'handy' && scrollBreite > breite) fehler.push(`Handy laeuft ueber: ${scrollBreite}px statt ${breite}px`);
    const nichtGefunden = await seite.evaluate(() => document.body.innerText.includes('Seite nicht gefunden'));
    if (nichtGefunden) fehler.push('Slug nicht registriert (404)');
    console.log(datei);
  }
  await browser.close();
  if (fehler.length) { console.error(fehler.join('\n')); process.exit(1); }
  console.log('OK');
})();
