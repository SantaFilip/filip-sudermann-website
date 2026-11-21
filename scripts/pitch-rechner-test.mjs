// Prueft src/pitch/potenzial.js gegen das Beispiel im Excel-Rechner
// ("Max Mustermann"). Aufruf: node scripts/pitch-rechner-test.mjs
import assert from 'node:assert/strict';
import { rechne } from '../src/pitch/potenzial.js';

const r = rechne({ follower: 50000, likes: 1201, kommentare: 160, views: 62000, preisLow: 39, preisHigh: 299 });
const nah = (ist, soll) => assert.ok(Math.abs(ist - soll) < 0.01, `${ist} != ${soll}`);
nah(r.engagementRate, 0.02722);
assert.equal(r.score, 100);
assert.equal(r.kaeufer.low, 368);
assert.equal(r.kaeufer.high, 123);
nah(r.brutto.gesamt, 51129);
nah(r.netto.gesamt, 46016.1);
nah(r.mrr, 12199.2);
assert.equal(r.label, '🔥 Heiß – sehr kaufbereite Audience');
console.log('Rechner stimmt mit dem Excel ueberein.');
