// Zieht die oeffentlich frei abrufbaren Creator-Daten ohne VidIQ-Credits:
// Linktree (alle Links), TikTok-Profil, YouTube-Abos und die letzten
// YouTube-Videos (Views, Likes), Instagram-Follower/Posts (gerundet).
// Aufruf: node scripts/creator-daten.mjs --instagram <handle> [--linktree <url>] [--tiktok <handle>] [--youtube <@handle>]
// Ausgabe: JSON auf stdout. Was fehlt oder blockiert ist, steht unter "fehler".
import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((paare, a, i, alle) => (a.startsWith('--') ? [...paare, [a.slice(2), alle[i + 1]]] : paare), []),
);

// curl statt fetch: curl nutzt den Proxy der Umgebung
const hole = (url) => execFileSync('curl', ['-sS', '-L', '-m', '20', '-A', 'Mozilla/5.0', '-H', 'Accept-Language: en-US', url], {
  encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
});

// "22K", "4.4K", "1.2M", "1,234" -> Zahl
const zahl = (text) => {
  const m = String(text).replace(/,/g, '').match(/([\d.]+)\s*([KkMm])?/);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * ({ k: 1e3, m: 1e6 }[m[2]?.toLowerCase()] || 1));
};
const schnitt = (werte) => (werte.length ? Math.round((werte.reduce((a, b) => a + b, 0) / werte.length) * 10) / 10 : null);

const ergebnis = { stand: new Date().toISOString().slice(0, 10), fehler: [] };
const versuche = (name, fn) => {
  try { ergebnis[name] = fn(); } catch (e) { ergebnis.fehler.push(`${name}: ${e.message.split('\n')[0]}`); }
};

if (args.instagram) versuche('instagram', () => {
  const html = hole(`https://www.instagram.com/${args.instagram}/`);
  const meta = html.match(/content="([^"]*Followers,[^"]*Posts)/)?.[1];
  if (!meta) throw new Error('keine Profildaten im HTML (privat oder blockiert)');
  const [follower, gefolgt, posts] = meta.split(',').map(zahl);
  return { handle: args.instagram, follower, gefolgt, posts, hinweis: 'gerundet; exakt + Bio + Profilbild ueber vidiq_ig_profile' };
});

if (args.linktree) versuche('linktree', () => {
  const html = hole(args.linktree);
  const json = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1];
  if (!json) throw new Error('kein Linktree-JSON gefunden');
  const konto = JSON.parse(json).props.pageProps.account;
  return {
    beschreibung: konto.description,
    links: konto.links.map((l) => ({ titel: l.title, url: l.url })),
    social: (konto.socialLinks || []).map((l) => ({ typ: l.type, url: l.url })),
  };
});

if (args.tiktok) versuche('tiktok', () => {
  const html = hole(`https://www.tiktok.com/@${args.tiktok.replace(/^@/, '')}`);
  const json = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s)?.[1];
  const info = json && JSON.parse(json).__DEFAULT_SCOPE__['webapp.user-detail']?.userInfo;
  if (!info) throw new Error('kein Profil gefunden');
  const s = info.stats;
  return {
    handle: info.user.uniqueId, name: info.user.nickname, bio: info.user.signature, bioLink: info.user.bioLink?.link,
    follower: s.followerCount, likesGesamt: s.heartCount, videos: s.videoCount,
    likesProVideoLebenszeit: s.videoCount ? Math.round(s.heartCount / s.videoCount) : null,
  };
});

if (args.youtube) versuche('youtube', () => {
  const handle = args.youtube.startsWith('@') ? args.youtube : `@${args.youtube}`;
  const html = hole(`https://www.youtube.com/${handle}`);
  const kanalId = html.match(/"externalId":"(UC[^"]+)"/)?.[1];
  if (!kanalId) throw new Error('Kanal nicht gefunden');
  const abos = zahl(html.match(/([\d.,]+\s*[KM]?) subscribers/)?.[1]);
  const feed = hole(`https://www.youtube.com/feeds/videos.xml?channel_id=${kanalId}`);
  const titel = [...feed.matchAll(/<entry>.*?<title>(.*?)<\/title>/gs)].map((m) => m[1]);
  const views = [...feed.matchAll(/<media:statistics views="(\d+)"/g)].map((m) => +m[1]);
  const likes = [...feed.matchAll(/<media:starRating count="(\d+)"/g)].map((m) => +m[1]);
  return {
    handle, kanalId, abos,
    videos: titel.map((t, i) => ({ titel: t, views: views[i], likes: likes[i] })),
    schnitt: { views: schnitt(views), likes: schnitt(likes), anzahl: views.length, hinweis: 'ohne Kommentare; RSS enthaelt keine' },
  };
});

console.log(JSON.stringify(ergebnis, null, 2));
