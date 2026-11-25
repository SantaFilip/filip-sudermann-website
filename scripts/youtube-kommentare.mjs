// Liest die Kommentare unter dem staerksten der letzten 15 YouTube-Videos eines
// Creators ueber die offizielle YouTube Data API v3 (kostenlos, 10.000 Einheiten
// pro Tag; ein Aufruf kostet 1). Den API-Schluessel setzt der Proxy der Umgebung
// als Header x-goog-api-key ein (Network secret fuer www.googleapis.com), er
// steht nirgends im Code.
// Aufruf: node scripts/youtube-kommentare.mjs @handle [anzahl]
import { execFileSync } from 'node:child_process';

const [handleRoh, anzahlRoh] = process.argv.slice(2);
if (!handleRoh) { console.error('Aufruf: node scripts/youtube-kommentare.mjs @handle [anzahl]'); process.exit(1); }
const handle = handleRoh.startsWith('@') ? handleRoh : `@${handleRoh}`;
const anzahl = Math.min(100, Number(anzahlRoh) || 20);

// curl statt fetch: curl nutzt den Proxy der Umgebung
const hole = (url) => execFileSync('curl', ['-sS', '-L', '-m', '20', '-A', 'Mozilla/5.0', url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

const kanalSeite = hole(`https://www.youtube.com/${handle}`);
const kanalId = kanalSeite.match(/"externalId":"(UC[^"]+)"/)?.[1];
if (!kanalId) { console.error(`Kanal ${handle} nicht gefunden`); process.exit(1); }

// Die letzten 15 Videos aus dem RSS-Feed, das mit den meisten Views gewinnt
const feed = hole(`https://www.youtube.com/feeds/videos.xml?channel_id=${kanalId}`);
const videos = [...feed.matchAll(/<entry>(.*?)<\/entry>/gs)].map(([, e]) => ({
  id: e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1],
  titel: e.match(/<title>(.*?)<\/title>/)?.[1],
  views: Number(e.match(/<media:statistics views="(\d+)"/)?.[1] || 0),
}));
const top = videos.sort((a, b) => b.views - a.views)[0];
if (!top?.id) { console.error('Keine Videos im Feed'); process.exit(1); }

const antwort = JSON.parse(hole(
  `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${top.id}&order=relevance&maxResults=${anzahl}&textFormat=plainText`,
));
if (antwort.error) {
  console.error(`YouTube-API: ${antwort.error.message} (Schluessel als Network secret fuer www.googleapis.com hinterlegt?)`);
  process.exit(1);
}

console.log(JSON.stringify({
  kanal: handle,
  video: { titel: top.titel, views: top.views, url: `https://www.youtube.com/watch?v=${top.id}` },
  kommentare: (antwort.items || []).map((it) => {
    const k = it.snippet.topLevelComment.snippet;
    return { text: k.textDisplay, likes: k.likeCount, antworten: it.snippet.totalReplyCount };
  }),
}, null, 2));
