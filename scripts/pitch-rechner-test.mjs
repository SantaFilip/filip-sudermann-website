// Prueft src/pitch/potenzial.js gegen das Beispiel im Excel-Rechner
// ("Max Mustermann") und die Abweichungen seit 26.11.2026 (VIP hoechstens 15
// Kaeufer, VIP-Preis nach Score). Aufruf: node scripts/pitch-rechner-test.mjs
import assert from 'node:assert/strict';
import { rechne, vipPreis, berechnePotenzial } from '../src/pitch/potenzial.js';
import { readdirSync } from 'node:fs';

const ordner = new URL('../src/pitch/creators/', import.meta.url);
const CREATORS = await Promise.all(readdirSync(ordner).filter((d) => d.endsWith('.js') && d !== 'index.js')
  .map(async (d) => (await import(new URL(d, ordner))).default));

const r = rechne({ follower: 50000, likes: 1201, kommentare: 160, views: 62000, preisLow: 39, preisHigh: 299 });
const nah = (ist, soll) => assert.ok(Math.abs(ist - soll) < 0.01, `${ist} != ${soll}`);
nah(r.engagementRate, 0.02722);
assert.equal(r.score, 100);
assert.equal(r.kaeufer.low, 368);
assert.equal(r.kaeufer.high, 15); // Excel: 123, gedeckelt auf 15
nah(r.brutto.gesamt, 368 * 39 + 15 * 299);
nah(r.netto.gesamt, (368 * 39 + 15 * 299) * 0.9);
nah(r.mrr, 12199.2);
assert.equal(r.label, '🔥 Heiß – sehr kaufbereite Audience');

assert.equal(vipPreis(100), 2000);
assert.equal(vipPreis(70), 2000);
assert.equal(vipPreis(45), 1500);
assert.equal(vipPreis(25), 1000);
assert.equal(vipPreis(24), 500);

// Jede Datendatei muss den VIP-Preis passend zu ihrem Score haben
for (const c of CREATORS) {
  const { score } = berechnePotenzial(c);
  assert.equal(c.premium[0].price, vipPreis(score), `${c.slug}: VIP-Preis ${c.premium[0].price} statt ${vipPreis(score)} (Score ${score})`);
}
console.log('Rechner stimmt mit dem Excel ueberein (mit VIP-Deckel und VIP-Preis nach Score).');
