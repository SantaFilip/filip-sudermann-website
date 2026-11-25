import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import PageNotFound from '@/lib/PageNotFound';
import { IMAGES } from '@/lib/links';
import { findeCreator } from '@/pitch/creators';
import { berechnePotenzial, euro, kurz } from '@/pitch/potenzial';
import SystemDiagramm from '@/pitch/SystemDiagramm';
import { ProfilMockup, SkoolMockup, SkoolMini, WebsiteMockup, CommunityFeed, Classroom, Kalender } from '@/pitch/Mockups';
import { REFERENZEN } from '@/pitch/referenzen';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Belege fuer "Wer ist Filip?". Screenshots nach public/pitch/filip/ legen;
// fehlt eine Datei, bleibt der Platz live leer und zeigt lokal einen Hinweis.
const BELEGE = [
  { src: '/pitch/filip/skool-games-1.webp', alt: 'Instagram-Profil von Phil Dörrenhaus' },
  { src: '/pitch/filip/skool-games-2.webp', alt: 'Instagram-Profil von Jonas Eidenschink' },
  { src: '/pitch/filip/skool-games-video.webp', alt: 'Skool-Community Manifestation Masterclass' },
  { src: '/pitch/filip/leaderboard.webp', alt: 'Skool-Games-Leaderboard Q3 2025 mit Marcin Teodoru auf Platz 3' },
];

function Beleg({ src, alt }) {
  const [fehlt, setFehlt] = useState(false);
  if (fehlt) {
    if (!import.meta.env.DEV) return null;
    return <div className="flex aspect-[4/3] items-center justify-center rounded border border-dashed border-black/30 p-2 text-center text-[10px] text-black/50">{src}</div>;
  }
  return <img src={src} alt={alt} onError={() => setFehlt(true)} className="w-full rounded border border-black/10 bg-white object-cover shadow-sm" />;
}

// Jede Sektion hat feste Board-Masse wie in Figma. Unter Desktop-Breite wird
// sie als Ganzes verkleinert statt umzubrechen, damit sie 1:1 aussieht.
const DESKTOP = 1024;
const RAND = 32;
// Breite aller Spalten nebeneinander: Sektionen + 4 Abstaende + Rand links/rechts
const BOARD_BREITE = 440 + 400 + 460 + 560 + 560 + 4 * 40 + 2 * 40;

function useFensterBreite() {
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const neu = () => setVw(window.innerWidth);
    window.addEventListener('resize', neu);
    return () => window.removeEventListener('resize', neu);
  }, []);
  return vw;
}

function Passform({ breite, className = '', children, ...rest }) {
  const vw = useFensterBreite();
  const zoom = vw < DESKTOP ? Math.min(1, (vw - RAND) / breite) : 1;
  return (
    <section {...rest} className={`shrink-0 self-center lg:self-start ${className}`} style={{ width: breite, zoom }}>
      {children}
    </section>
  );
}

// Kein Pitch landet bei Google: Seiten sind nur per Link gedacht
function useNurPerLink(titel) {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const vorher = document.title;
    document.title = titel;
    return () => { meta.remove(); document.title = vorher; };
  }, [titel]);
}

const Punkt = ({ gut, children }) => (
  <li className="flex items-start gap-3">
    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${gut ? 'border-[#5dbb63] bg-[#d6f1d6]' : 'border-[#d9453a] bg-[#e8574a]'}`}>
      {gut ? <Check size={11} strokeWidth={3} className="text-[#3a8f40]" /> : <X size={11} strokeWidth={3} className="text-white" />}
    </span>
    <span>{children}</span>
  </li>
);

const Kanal = ({ children }) => (
  <span className="flex min-h-[44px] items-center justify-center whitespace-nowrap bg-white px-2.5 text-center text-[11px] font-semibold shadow-sm">{children}</span>
);

const Etikett = ({ children, className = '' }) => (
  <span className={`inline-block rounded-md bg-[#111] px-4 py-2 font-bold text-white ${className}`}>{children}</span>
);

function Portfolio({ c }) {
  return (
    <Passform breite={440} data-export="1-instagram-portfolio" className="border border-[#f0b183] bg-[#fdf0d8] p-6">
      <h2 className="text-center font-body text-[26px] font-bold tracking-tight">
        {c.possessive} <span className="text-[#f2621d]">Creator Portfolio</span>
      </h2>
      <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
        <div className="space-y-1.5">{c.channelsLeft.map((k) => <Kanal key={k}>{k}</Kanal>)}</div>
        {c.bilder?.instagram
          ? <img src={c.bilder.instagram} alt={`Instagram-Profil von ${c.handle}`} className="w-full rounded-md shadow-lg" />
          : <ProfilMockup c={c} />}
        <div className="space-y-1.5">{c.channelsRight.map((k) => <Kanal key={k}>{k}</Kanal>)}</div>
      </div>

      <h3 className="mt-8 font-body text-[13px] font-bold">Deine bisherigen Stärken</h3>
      <ul className="mt-3 space-y-3 pl-2 text-[12px]">{c.strengths.map((s) => <Punkt key={s} gut>{s}</Punkt>)}</ul>
      <h3 className="mt-6 font-body text-[13px] font-bold">Opportunitätskosten im Marketing</h3>
      <ul className="mt-3 space-y-3 pl-2 text-[12px]">{c.opportunities.map((s) => <Punkt key={s}>{s}</Punkt>)}</ul>

      <h3 className="mt-8 font-body text-[20px] font-bold tracking-tight">Konkrete Verbesserungen</h3>
      <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="flex flex-col">
          <div className="overflow-hidden"><SkoolMini c={c} /></div>
          <p className="mt-auto pt-4 text-center text-[11px] font-bold leading-snug">{c.improvements.community}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold leading-snug">{REFERENZEN[c.referenz].titel}</p>
          <img src={REFERENZEN[c.referenz].bild} alt="" className="mt-2 w-full rounded-sm shadow-md" />
          <p className="mt-2 text-[13px]">{REFERENZEN[c.referenz].handle}</p>
        </div>
      </div>
    </Passform>
  );
}

function WerIstFilip({ c }) {
  const p = berechnePotenzial(c);
  const k = c.kennzahlen;
  const stellen = String(Math.round(p.netto.gesamt)).length;
  const zeilen = [
    ['Käufer (realistisch)', p.kaeufer, (n) => String(n)],
    ['Launch-Umsatz brutto', p.brutto, euro],
    ['– Gebühren & Kosten (10 %)', p.gebuehren, euro],
    ['Launch-Umsatz netto', p.netto, euro],
  ];
  const Zeile = ({ label, wert, fett }) => (
    <div className={`flex justify-between gap-2 border-b border-black/5 px-2 py-0.5 ${fett ? 'font-bold' : ''}`}><span>{label}</span><span>{wert}</span></div>
  );
  const Kopf = ({ children }) => <p className="bg-[#1d2a5a] px-2 py-1 font-bold uppercase tracking-wide text-white">{children}</p>;
  return (
    <Passform breite={400} className="border border-[#9ed8a4] bg-[#ddf5df] p-6">
      <h2 className="text-center font-body text-[26px] font-bold tracking-tight">Wer ist Filip?</h2>
      <p className="mt-2 text-center text-[13px] font-bold leading-snug">Ich kooperiere mit Creatorn &amp; helfe ihnen Angebote effektiv zu skalieren &amp; monetarisieren</p>
      <div className="mt-6 grid grid-cols-2 gap-5 px-3">
        <img src={IMAGES.heroPortrait} alt="Filip Sudermann" className="aspect-square w-full object-cover shadow-md" />
        <img src={IMAGES.aboutPortrait} alt="Filip bei der Arbeit" className="aspect-square w-full object-cover shadow-md" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">{BELEGE.slice(0, 2).map((b) => <Beleg key={b.src} {...b} />)}</div>
      <p className="mt-2 text-[12px] font-bold">Skool Games gewonnen, mit Phil &amp; Jonas</p>
      <div className="mt-2 grid grid-cols-[1.35fr_1fr] items-start gap-2">{BELEGE.slice(2).map((b) => <Beleg key={b.src} {...b} />)}</div>

      <div className="mt-6">
        <p className="mb-2 text-center text-[13px] font-bold">Bis zu {stellen}-stellige Umsätze möglich</p>
        <div data-export="2-potenzial-rechner" className="overflow-hidden rounded border border-[#1d2a5a]/30 bg-white text-[9.5px]">
          <Kopf>Reichweite</Kopf>
          {c.reach.map((r) => <Zeile key={r.platform} label={r.platform} wert={kurz(r.followers)} />)}
          <Zeile label={`Follower ${k.hauptplattform} (Rechner)`} wert={kurz(p.follower)} fett />
          <Kopf>Engagement Score · {k.hauptplattform}</Kopf>
          <Zeile label="Ø Likes pro Post" wert={kurz(k.likes)} />
          <Zeile label="Ø Kommentare pro Post" wert={k.kommentare.toLocaleString('de-DE', { maximumFractionDigits: 1 })} />
          <Zeile label="Ø Views pro Post" wert={kurz(k.views)} />
          <Zeile label="Engagement Rate" wert={`${(p.engagementRate * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`} />
          <div className="flex justify-between gap-2 bg-[#e9edf7] px-2 py-1 font-bold"><span>⚡ Score {p.score} / 100</span><span>{p.label}</span></div>
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-1 bg-[#1d2a5a] px-2 py-1 font-bold uppercase text-white">
            <span>Potenzial</span><span className="text-right">Low ({c.community.price} €)</span><span className="text-right">High ({c.premium[0].price} €)</span><span className="text-right">Gesamt</span>
          </div>
          {zeilen.map(([label, werte, format]) => (
            <div key={label} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-1 border-b border-black/5 px-2 py-0.5">
              <span>{label}</span><span className="text-right">{format(werte.low)}</span><span className="text-right">{format(werte.high)}</span><span className="text-right font-semibold">{format(werte.gesamt)}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 bg-[#d6f1d6] text-center font-bold">
            <div className="border-r border-black/10 py-1.5"><p className="text-[8px] font-semibold uppercase">🚀 Launch netto</p><p className="text-[13px]">{euro(p.netto.gesamt)}</p></div>
            <div className="py-1.5"><p className="text-[8px] font-semibold uppercase">📈 MRR nach Churn</p><p className="text-[13px]">{euro(p.mrr)}</p></div>
          </div>
          <p className="px-2 py-1 text-[8px] text-black/50">Schätzung nach öffentlichen Daten (Stand {k.stand}), Ø der letzten {k.posts} Posts ohne angepinnte.</p>
        </div>
      </div>
    </Passform>
  );
}

function BestesSystem({ c }) {
  return (
    <Passform breite={460} data-export="3-marketing-system" className="p-2">
      <h2 className="font-body text-[30px] font-bold tracking-tight">Das <span className="text-[#f2621d]">Beste</span> System für dich</h2>
      <div className="mt-6"><SystemDiagramm c={c} /></div>
      <h3 className="mt-8 font-body text-[15px] font-bold">Wieso es besonders effektiv ist:</h3>
      <ul className="mt-5 space-y-6 pl-2 text-[15px] font-semibold">{c.gruende.map((g) => <Punkt key={g} gut>{g}</Punkt>)}</ul>
    </Passform>
  );
}

function Funnel({ c }) {
  const bausteine = [['Community', CommunityFeed], ['Classroom', Classroom], ['Calendar', Kalender]];
  return (
    <Passform breite={560}>
      <div className="text-center"><Etikett className="text-[17px]">Funnel (Skool)</Etikett></div>
      <div className="mt-5" data-export="4-skool-template"><SkoolMockup c={c} /></div>
      <div className="mt-10 bg-[#111] py-2.5 text-center text-[17px] font-bold text-white">Fulfillment (The 3C’s)</div>
      {/* 3 gleich grosse Kacheln: (560 - 2 x 8 px Abstand) / 3 = 181 px von 520 px */}
      <div className="mt-4 grid grid-cols-3 gap-2" style={{ '--kachel-zoom': 181 / 520 }}>
        {bausteine.map(([titel, Baustein]) => (
          <div key={titel}>
            <p className="mb-1 text-[11px] font-bold">{titel}</p>
            <div className="overflow-hidden rounded border border-black/10 shadow-sm"><Baustein c={c} /></div>
          </div>
        ))}
      </div>
    </Passform>
  );
}

// Filips Standardangebot, gleich fuer alle Creator (Texte von der Startseite)
// Ohne Website-Entwurf steht die Road-Map etwa auf halber Hoehe des
// Skool-Mockups, zwischen Oberkante und Fulfillment-Leiste (473 px)
function RoadMap({ unten }) {
  const { t } = useLanguage();
  const anteil = t.profitShare;
  return (
    <Passform breite={560} className={unten ? 'lg:mt-[240px]' : ''}>
      <div data-export="5-road-map" className="border border-[#b9a6e6] bg-white">
        <h2 className="border-b border-[#b9a6e6] bg-[#ebe4fa] px-4 py-2 text-center font-body text-[24px] font-bold tracking-tight">Road-Map</h2>
        <ol className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6">
          {t.process.steps.map((schritt) => (
            <li key={schritt.num} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ebe4fa] text-[12px] font-bold">{schritt.num}</span>
              <div>
                <p className="text-[14px] font-bold leading-tight">{schritt.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-black/60">{schritt.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-[#b9a6e6] bg-[#f7f4fd] px-5 py-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-black/50">Auf {anteil.titleAccent}</p>
          <p className="mt-1 text-[13px] font-bold leading-snug">{anteil.workload.me} % der Arbeit bei mir, {anteil.share.you} % vom Gewinn bei dir</p>
        </div>
      </div>
    </Passform>
  );
}

// Nur fuer Creator ohne eigene Website
function Webseite({ c }) {
  return (
    <Passform breite={560} data-export="6-personal-brand-website" className="bg-[#e3f7f7] p-5">
      <h2 className="font-body text-[18px] font-bold tracking-tight">Personal Brand Website</h2>
      <div className="mt-4"><WebsiteMockup c={c} /></div>
    </Passform>
  );
}

export default function Pitch() {
  const { slug } = useParams();
  const c = findeCreator(slug);
  useNurPerLink(c ? `${c.name} × Filip Sudermann` : 'Seite nicht gefunden');
  const vw = useFensterBreite();
  if (!c) return <PageNotFound />;
  // Desktop: das ganze Board passt auf den Bildschirm wie in Figma
  const boardZoom = vw >= DESKTOP ? Math.min(1, vw / BOARD_BREITE) : 1;

  return (
    <div
      className="min-h-screen text-[#111]"
      style={{
        background: c.background || 'radial-gradient(circle at 15% 20%, #f6e8f3 0%, transparent 45%), radial-gradient(circle at 85% 30%, #e6e9fb 0%, transparent 50%), radial-gradient(circle at 50% 90%, #f3e6f7 0%, transparent 55%), #eee9f6',
      }}
    >
      <div className="min-h-screen bg-[radial-gradient(rgba(0,0,0,0.12)_1px,transparent_1px)] [background-size:22px_22px]">
        <main className="flex flex-col gap-12 px-4 py-10 lg:w-max lg:flex-row lg:items-start lg:gap-10 lg:px-10 lg:py-14" style={{ zoom: boardZoom }}>
          <Portfolio c={c} />
          <WerIstFilip c={c} />
          <BestesSystem c={c} />
          <Funnel c={c} />
          {/* Website-Entwurf und direkt darunter die Road-Map */}
          <div className="flex flex-col gap-12 lg:gap-8">
            {!c.website && <Webseite c={c} />}
            <RoadMap unten={Boolean(c.website)} />
          </div>
        </main>
      </div>
    </div>
  );
}
