// Prüft, ob ein Deck live erreichbar ist, und wartet bei Bedarf auf den
// Deploy (Auto-Merge durch .github/workflows/decks-live.yml + Cloudflare).
// Aufruf: node scripts/pitch-live-check.mjs <slug> [minuten=10]
// Andere Domain zum Testen: PITCH_BASIS=https://…pages.dev node scripts/pitch-live-check.mjs <slug> 0
const [slug, minuten = '10'] = process.argv.slice(2);
if (!slug) { console.error('Slug fehlt'); process.exit(1); }
const basis = process.env.PITCH_BASIS || 'https://filip-sudermann.com';
const ende = Date.now() + Number(minuten) * 60_000;

async function text(url) {
  const antwort = await fetch(url, { cache: 'no-store' });
  if (!antwort.ok) throw new Error(`${antwort.status} bei ${url}`);
  return antwort.text();
}

async function istLive() {
  const html = await text(`${basis}/pitch/${slug}`);
  const haupt = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  if (!haupt) return false;
  const pitch = (await text(basis + haupt)).match(/\.\/(Pitch-[\w-]+\.js)/)?.[1];
  if (!pitch) return false;
  return (await text(`${basis}/assets/${pitch}`)).includes(slug);
}

for (;;) {
  let live = false;
  try { live = await istLive(); } catch (e) { console.error(e.message); }
  if (live) { console.log(`LIVE ${basis}/pitch/${slug}`); process.exit(0); }
  if (Date.now() >= ende) { console.error(`NICHT LIVE ${basis}/pitch/${slug}`); process.exit(1); }
  await new Promise((r) => setTimeout(r, 30_000));
}
