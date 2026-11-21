// Exportiert die Bausteine einer Pitch-Seite als scharfe PNGs (2x), z. B.
// fuer Figma oder zum Verschicken: alle Elemente mit data-export.
// Erwartet `npx vite preview --port 4173`.
// Aufruf: PLAYWRIGHT_PATH=$(npm root -g)/playwright node scripts/pitch-export.cjs <slug> <ordner>
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('fs');
const path = require('path');

const [slug, ordner = '.'] = process.argv.slice(2);
if (!slug) { console.error('Slug fehlt'); process.exit(1); }

(async () => {
  fs.mkdirSync(ordner, { recursive: true });
  const browser = await chromium.launch();
  const seite = await browser.newPage({ viewport: { width: 2300, height: 1100 }, deviceScaleFactor: 2 });
  await seite.goto(`http://localhost:4173/pitch/${slug}`, { waitUntil: 'networkidle' });
  await seite.waitForTimeout(1000);
  for (const el of await seite.$$('[data-export]')) {
    const name = await el.getAttribute('data-export');
    const datei = path.join(ordner, `${slug}-${name}.png`);
    await el.screenshot({ path: datei });
    console.log(datei);
  }
  await browser.close();
})();
