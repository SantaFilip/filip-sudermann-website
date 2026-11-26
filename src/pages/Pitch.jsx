import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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

function Beleg({ src, alt, neu }) {
  const [fehlt, setFehlt] = useState(false);
  if (fehlt) {
    if (!import.meta.env.DEV) return null;
    return <div className="flex aspect-[4/3] items-center justify-center rounded border border-dashed border-black/30 p-2 text-center text-[10px] text-black/50">{src}</div>;
  }
  return <img src={src} alt={alt} onError={() => setFehlt(true)} className={`w-full bg-white object-cover ${neu ? 'rounded-lg shadow-[0_4px_14px_-6px_rgba(30,70,40,0.35)] ring-1 ring-black/5' : 'rounded border border-black/10 shadow-sm'}`} />;
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

const Punkt = ({ gut, neu, children }) => (
  <li className="flex items-start gap-3">
    {neu ? (
      <span className={`mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${gut ? 'bg-gradient-to-b from-[#7fcf86] to-[#4fa957]' : 'bg-gradient-to-b from-[#ef8a7c] to-[#d65a4b]'} shadow-[0_2px_6px_-2px_rgba(0,0,0,0.35)]`}>
        {gut ? <Check size={10} strokeWidth={3.5} className="text-white" /> : <X size={10} strokeWidth={3.5} className="text-white" />}
      </span>
    ) : (
    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${gut ? 'border-[#5dbb63] bg-[#d6f1d6]' : 'border-[#d9453a] bg-[#e8574a]'}`}>
      {gut ? <Check size={11} strokeWidth={3} className="text-[#3a8f40]" /> : <X size={11} strokeWidth={3} className="text-white" />}
    </span>
    )}
    <span>{children}</span>
  </li>
);

const Kanal = ({ neu, children }) => (
  <span className={`flex min-h-[34px] items-center justify-center whitespace-nowrap px-2.5 text-center text-[11px] font-semibold ${neu ? 'rounded-full bg-white/90 px-3 text-[#5a4630] shadow-[0_3px_10px_-4px_rgba(120,80,30,0.35)] ring-1 ring-[#e9d3ad]' : 'bg-white shadow-sm'}`}>{children}</span>
);

// Prototyp "design=neu": weichere, hochwertigere Boxen (abgerundet, Verlauf,
// weiche Schatten, Serifen-Titel). Altes Design bleibt Standard.
const BOX_NEU = {
  gelb: 'rounded-[28px] border border-white/80 bg-gradient-to-b from-[#fffaf1] via-[#fdf1dc] to-[#f7e2bf] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-24px_rgba(110,70,20,0.45),0_10px_24px_-12px_rgba(110,70,20,0.25)]',
  gruen: 'rounded-[28px] border border-white/80 bg-gradient-to-b from-[#f6fcf6] via-[#e6f5e8] to-[#cfe8d3] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_30px_60px_-24px_rgba(30,80,45,0.45),0_10px_24px_-12px_rgba(30,80,45,0.25)]',
};
const Titel = ({ children }) => (
  <h2 className="text-center font-heading text-[34px] font-semibold leading-none tracking-tight text-[#2a2218]">{children}</h2>
);
const Akzent = ({ children, farbe = 'gold' }) => (
  <span className={`bg-clip-text italic text-transparent ${farbe === 'gold' ? 'bg-gradient-to-r from-[#b9652a] via-[#e0893f] to-[#c9772f]' : 'bg-gradient-to-r from-[#2f7a3c] to-[#4fa957]'}`}>{children}</span>
);
const Trenner = ({ farbe }) => (
  <div className="mx-auto mt-2.5 flex items-center justify-center gap-2" aria-hidden="true">
    <span className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${farbe})` }} />
    <span className="h-1.5 w-1.5 rotate-45" style={{ background: farbe }} />
    <span className="h-px w-10" style={{ background: `linear-gradient(270deg, transparent, ${farbe})` }} />
  </div>
);
const Innen = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-white/55 px-3.5 py-3 ring-1 ring-white/80 ${className}`}>{children}</div>
);

const Etikett = ({ children, className = '' }) => (
  <span className={`inline-block rounded-md bg-[#111] px-4 py-2 font-bold text-white ${className}`}>{children}</span>
);

function Portfolio({ c, neu }) {
  if (neu) return <PortfolioNeu c={c} />;
  return (
    <Passform breite={440} data-export="1-instagram-portfolio" className="flex flex-col border border-[#f0b183] bg-[#fdf0d8] px-5 py-4 lg:!self-stretch">
      <h2 className="text-center font-body text-[26px] font-bold tracking-tight">
        {c.possessive} <span className="text-[#f2621d]">Creator Portfolio</span>
      </h2>
      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
        <div className="space-y-1.5">{c.channelsLeft.map((k) => <Kanal key={k}>{k}</Kanal>)}</div>
        {c.bilder?.instagram
          ? <img src={c.bilder.instagram} alt={`Instagram-Profil von ${c.handle}`} className="w-full rounded-md shadow-lg" />
          : <ProfilMockup c={c} />}
        <div className="space-y-1.5">{c.channelsRight.map((k) => <Kanal key={k}>{k}</Kanal>)}</div>
      </div>

      <h3 className="mt-5 font-body text-[13px] font-bold">Deine bisherigen Stärken</h3>
      <ul className="mt-2 space-y-2 pl-2 text-[11.5px] leading-snug">{c.strengths.map((s) => <Punkt key={s} gut>{s}</Punkt>)}</ul>
      <h3 className="mt-4 font-body text-[13px] font-bold">Opportunitätskosten im Marketing</h3>
      <ul className="mt-2 space-y-2 pl-2 text-[11.5px] leading-snug">{c.opportunities.map((s) => <Punkt key={s}>{s}</Punkt>)}</ul>

      <h3 className="mt-5 font-body text-[18px] font-bold tracking-tight">Konkrete Verbesserungen</h3>
      <div className="mt-2 grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="flex flex-col">
          <div className="overflow-hidden"><SkoolMini c={c} /></div>
          <p className="mt-auto pt-2 text-center text-[10.5px] font-bold leading-snug">{c.improvements.community}</p>
        </div>
        <div className="text-center">
          <p className="text-[10.5px] font-bold leading-snug">{REFERENZEN[c.referenz].titel}</p>
          <img src={REFERENZEN[c.referenz].bild} alt="" className="mt-1.5 max-h-[118px] w-full rounded-sm object-cover shadow-md" />
          <p className="mt-1 text-[12px]">{REFERENZEN[c.referenz].handle}</p>
        </div>
      </div>
    </Passform>
  );
}

function PortfolioNeu({ c }) {
  const Sub = ({ children }) => <h3 className="font-body text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#7a5a35]">{children}</h3>;
  return (
    <Passform breite={440} data-export="1-instagram-portfolio" className={`flex flex-col px-5 py-5 lg:!self-stretch ${BOX_NEU.gelb}`}>
      <Titel>{c.possessive} <Akzent>Creator Portfolio</Akzent></Titel>
      <Trenner farbe="#d58a45" />
      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
        <div className="space-y-1.5">{c.channelsLeft.map((k) => <Kanal key={k} neu>{k}</Kanal>)}</div>
        <div className="overflow-hidden rounded-xl shadow-[0_14px_30px_-14px_rgba(110,70,20,0.55)] ring-1 ring-black/5">
          {c.bilder?.instagram
            ? <img src={c.bilder.instagram} alt={`Instagram-Profil von ${c.handle}`} className="w-full" />
            : <ProfilMockup c={c} />}
        </div>
        <div className="space-y-1.5">{c.channelsRight.map((k) => <Kanal key={k} neu>{k}</Kanal>)}</div>
      </div>

      <Innen className="mt-4">
        <Sub>Deine bisherigen Stärken</Sub>
        <ul className="mt-2 space-y-2 text-[11.5px] leading-snug">{c.strengths.map((s) => <Punkt key={s} gut neu>{s}</Punkt>)}</ul>
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-[#e2c79c] to-transparent" />
        <Sub>Opportunitätskosten im Marketing</Sub>
        <ul className="mt-2 space-y-2 text-[11.5px] leading-snug">{c.opportunities.map((s) => <Punkt key={s} neu>{s}</Punkt>)}</ul>
      </Innen>

      <h3 className="mt-4 text-center font-heading text-[22px] font-semibold tracking-tight text-[#2a2218]">Konkrete <Akzent>Verbesserungen</Akzent></h3>
      <div className="mt-2 grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="flex flex-col">
          <div className="overflow-hidden rounded-xl shadow-[0_10px_24px_-12px_rgba(110,70,20,0.5)] ring-1 ring-black/5"><SkoolMini c={c} /></div>
          <p className="mt-auto pt-2 text-center text-[10.5px] font-semibold leading-snug text-[#3d3020]">{c.improvements.community}</p>
        </div>
        <div className="text-center">
          <p className="text-[10.5px] font-semibold leading-snug text-[#3d3020]">{REFERENZEN[c.referenz].titel}</p>
          <img src={REFERENZEN[c.referenz].bild} alt="" className="mt-1.5 max-h-[118px] w-full rounded-xl object-cover shadow-[0_10px_24px_-12px_rgba(110,70,20,0.5)]" />
          <p className="mt-1 text-[12px] text-[#7a5a35]">{REFERENZEN[c.referenz].handle}</p>
        </div>
      </div>
    </Passform>
  );
}

function WerIstFilip({ c, neu }) {
  const p = berechnePotenzial(c);
  const k = c.kennzahlen;
  const stellen = String(Math.round(p.netto.gesamt)).length;
  const zeilen = [
    ['Käufer', p.kaeufer, (n) => String(n)],
    ['Umsatz brutto', p.brutto, euro],
    ['– Kosten (10 %)', p.gebuehren, euro],
    ['Umsatz netto', p.netto, euro],
  ];
  const Zeile = ({ label, wert, fett }) => (
    <div className={`flex justify-between gap-1 border-b border-black/5 px-1.5 py-px ${fett ? 'font-bold' : ''}`}><span>{label}</span><span>{wert}</span></div>
  );
  const Kopf = ({ children }) => <p className="bg-[#1d2a5a] px-1.5 py-0.5 font-bold uppercase text-white">{children}</p>;
  // Kompakt wie im Figma-Original: Fotos, Belege, unten Text links und Rechner rechts
  const foto = neu
    ? 'aspect-square w-full rounded-2xl border-4 border-white object-cover shadow-[0_14px_30px_-12px_rgba(30,70,40,0.5)]'
    : 'aspect-square w-full rounded-md border-[3px] border-white object-cover shadow-md';
  return (
    <Passform breite={400} className={`p-5 lg:!self-stretch ${neu ? BOX_NEU.gruen : 'border border-[#9ed8a4] bg-[#ddf5df]'}`}>
      {neu ? (
        <>
          <Titel>Wer ist <Akzent farbe="gruen">Filip?</Akzent></Titel>
          <Trenner farbe="#5aa564" />
          <p className="mt-2.5 text-center text-[12.5px] font-semibold leading-snug text-[#24402a]">Ich kooperiere mit Creatorn &amp; helfe ihnen, Angebote effektiv zu skalieren &amp; zu monetarisieren</p>
        </>
      ) : (
        <>
          <h2 className="text-center font-body text-[26px] font-bold tracking-tight">Wer ist Filip?</h2>
          <p className="mt-1.5 text-center text-[12.5px] font-bold leading-snug">Ich kooperiere mit Creatorn &amp; helfe ihnen Angebote effektiv zu skalieren &amp; monetarisieren</p>
        </>
      )}
      <div className="mt-4 grid grid-cols-2 gap-6 px-8">
        <img src={IMAGES.filipBuehne} alt="Filip Sudermann auf der Bühne" className={`${foto} ${neu ? '-rotate-2' : ''}`} />
        <img src={IMAGES.filipStrand} alt="Filip bei der Arbeit am Strand" className={`${foto} ${neu ? 'rotate-2' : ''}`} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">{BELEGE.slice(0, 2).map((b) => <Beleg key={b.src} {...b} neu={neu} />)}</div>
      <p className={`mt-1.5 text-[11px] font-bold ${neu ? 'text-center text-[#24402a]' : ''}`}>{neu ? '🏆 ' : ''}Skool Games gewonnen, mit Phil &amp; Jonas</p>
      <div className="mt-1.5 grid grid-cols-[1.35fr_1fr] items-start gap-2">
        {BELEGE.slice(2, 3).map((b) => <Beleg key={b.src} {...b} neu={neu} />)}
        <div className="row-span-2">{BELEGE.slice(3).map((b) => <Beleg key={b.src} {...b} neu={neu} />)}</div>
        <div className="flex flex-col justify-center gap-2 pt-1">
          <p className={`text-center font-bold leading-snug ${neu ? 'font-heading text-[16px] text-[#24402a]' : 'text-[12px]'}`}>Bis zu {stellen}-stellige Umsätze möglich</p>
          <div data-export="2-potenzial-rechner" className={`overflow-hidden bg-white text-[6.5px] leading-[1.35] ${neu ? 'rounded-xl shadow-[0_10px_24px_-12px_rgba(29,42,90,0.45)] ring-1 ring-[#1d2a5a]/15' : 'rounded border border-[#1d2a5a]/30'}`}>
            <Kopf>Engagement Score · {k.hauptplattform}</Kopf>
            <Zeile label={`Follower ${k.hauptplattform}`} wert={kurz(p.follower)} />
            <Zeile label="Ø Likes / Kommentare" wert={`${kurz(k.likes)} / ${k.kommentare.toLocaleString('de-DE', { maximumFractionDigits: 1 })}`} />
            <Zeile label="Ø Views pro Post" wert={kurz(k.views)} />
            <Zeile label="Engagement Rate" wert={`${(p.engagementRate * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`} />
            <div className="flex justify-between gap-1 whitespace-nowrap bg-[#e9edf7] px-1.5 py-0.5 font-bold"><span>⚡ Score {p.score} / 100</span><span>{p.label.split(' – ')[0]}</span></div>
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-0.5 bg-[#1d2a5a] px-1.5 py-0.5 font-bold uppercase text-white">
              <span>Potenzial</span><span className="text-right">{c.community.price} €</span><span className="text-right">{c.premium[0].price} €</span><span className="text-right">Gesamt</span>
            </div>
            {zeilen.map(([label, werte, format]) => (
              <div key={label} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-0.5 border-b border-black/5 px-1.5 py-px">
                <span className="truncate">{label}</span><span className="text-right">{format(werte.low)}</span><span className="text-right">{format(werte.high)}</span><span className="text-right font-semibold">{format(werte.gesamt)}</span>
              </div>
            ))}
            <div className="grid grid-cols-2 bg-[#d6f1d6] text-center font-bold">
              <div className="border-r border-black/10 py-1"><p className="text-[5.5px] uppercase">Launch netto</p><p className="text-[9px]">{euro(p.netto.gesamt)}</p></div>
              <div className="py-1"><p className="text-[5.5px] uppercase">MRR nach Churn</p><p className="text-[9px]">{euro(p.mrr)}</p></div>
            </div>
            <p className="px-1.5 py-0.5 text-[5px] text-black/50">Schätzung nach öffentlichen Daten (Stand {k.stand}), Ø der letzten {k.posts} Posts.</p>
          </div>
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
// Filips Co-op Roadmap, gleich fuer alle Creator. Standard: 2 x 2 Phasen mit
// Pfeilen in Lesereihenfolge. stil 'liste' = schlichte nummerierte Liste.
// Ohne Website-Entwurf steht sie etwa auf halber Hoehe des Skool-Mockups.
const ROADMAP = ['Marktforschung', 'Marketingkampagne', 'Automatisierung & Aufbau', 'Produktlaunch & Optimierung'];

function Phase({ nr, titel }) {
  return (
    <div className="flex h-full items-center gap-2.5 rounded-lg border border-[#d9cdf5] bg-[#f7f4fd] px-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2621d] text-[14px] font-bold text-white">{nr}</span>
      <span className="text-[16px] font-bold leading-tight">{titel}</span>
    </div>
  );
}

const Pfeil = ({ children, className = '' }) => (
  <span className={`flex items-center justify-center text-[22px] font-bold text-[#8b7bc4] ${className}`} aria-hidden="true">{children}</span>
);

function RoadMap({ unten, stil }) {
  const { t } = useLanguage();
  const anteil = t.profitShare;
  return (
    <Passform breite={stil === 'liste' ? 420 : 520} className={`lg:!self-center ${unten ? 'lg:mt-[240px]' : ''}`}>
      <div data-export="5-road-map" className="overflow-hidden rounded-md border border-[#e8a0a0] bg-white">
        <h2 className="border-b border-[#e8a0a0] bg-[#ebe4fa] px-5 py-3 text-center font-body text-[34px] font-bold tracking-tight">Co-op Roadmap</h2>
        {stil === 'liste' ? (
          <ol className="space-y-5 px-6 py-6">
            {ROADMAP.map((schritt, i) => (
              <li key={schritt} className="flex items-baseline gap-3 text-[22px] font-bold leading-tight">
                <span className="w-6 shrink-0 text-[#f2621d]">{i + 1}.</span>
                <span>{schritt}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="grid grid-cols-[1fr_28px_1fr] items-stretch gap-y-1 px-5 py-5">
            <Phase nr={1} titel={ROADMAP[0]} />
            <Pfeil>→</Pfeil>
            <Phase nr={2} titel={ROADMAP[1]} />
            <span />
            <span />
            <Pfeil className="justify-self-start pl-6">↙</Pfeil>
            <Phase nr={3} titel={ROADMAP[2]} />
            <Pfeil>→</Pfeil>
            <Phase nr={4} titel={ROADMAP[3]} />
          </div>
        )}
        <p className="border-t border-[#e8a0a0] bg-[#f7f4fd] px-5 py-3 text-center text-[13px] font-semibold">
          Auf {anteil.titleAccent}: {anteil.workload.me} % der Arbeit bei mir, {anteil.share.you} % vom Gewinn bei dir
        </p>
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

// Hintergrund passend zum Geschlecht des Creators (Prototyp "design=neu").
// Frau: Morgenroete in Rose, Lavendel und Gold ueber sanften Huegeln.
// Mann: Sonnenaufgang ueber Bergketten in Nebel, wie Filips Referenz.
const KORN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

function Hintergrund({ geschlecht }) {
  const mann = geschlecht === 'm';
  const himmel = mann
    ? 'linear-gradient(180deg, #7d8794 0%, #a7aab0 22%, #d6c6ad 46%, #f2d9ae 60%, #f7e3c0 68%, #b9b4ad 100%)'
    : 'linear-gradient(180deg, #ddd2f3 0%, #ecd6ec 24%, #f7d9df 44%, #fde2d0 62%, #fff0df 74%, #f3d6dc 100%)';
  const sonne = mann
    ? 'radial-gradient(ellipse 55% 35% at 52% 62%, rgba(255,226,170,0.95) 0%, rgba(255,210,150,0.45) 35%, transparent 70%)'
    : 'radial-gradient(ellipse 60% 40% at 50% 66%, rgba(255,226,196,0.95) 0%, rgba(255,205,190,0.5) 35%, transparent 70%)';
  const ketten = mann
    ? [
        ['#8e949a', 0.55, 'M0 230 L90 170 L160 205 L260 120 L340 180 L430 140 L520 200 L610 110 L700 175 L800 130 L900 190 L1000 150 L1100 200 L1200 140 L1200 320 L0 320 Z'],
        ['#6c737b', 0.75, 'M0 260 L120 200 L210 240 L320 175 L420 235 L540 190 L650 250 L760 185 L880 245 L990 200 L1100 250 L1200 210 L1200 320 L0 320 Z'],
        ['#3f464e', 0.9, 'M0 290 L140 240 L260 280 L400 235 L520 285 L660 245 L800 290 L940 250 L1080 290 L1200 260 L1200 320 L0 320 Z'],
      ]
    : [
        ['#e6bfd3', 0.55, 'M0 230 C150 170 300 200 450 180 C600 160 750 210 900 185 C1050 160 1130 190 1200 180 L1200 320 L0 320 Z'],
        ['#d6a9c4', 0.6, 'M0 260 C180 215 330 250 520 230 C700 210 860 255 1020 235 C1100 225 1160 240 1200 235 L1200 320 L0 320 Z'],
        ['#c49ab8', 0.55, 'M0 290 C200 265 380 285 600 272 C820 260 1000 290 1200 275 L1200 320 L0 320 Z'],
      ];
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true" style={{ background: himmel }}>
      <div className="absolute inset-0" style={{ background: sonne }} />
      {/* weiche Wolken- bzw. Lichtschleier */}
      <div className="absolute -left-[10%] top-[8%] h-[38vh] w-[60vw] rounded-full blur-[90px]" style={{ background: mann ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.55)' }} />
      <div className="absolute right-[-5%] top-[18%] h-[30vh] w-[45vw] rounded-full blur-[90px]" style={{ background: mann ? 'rgba(240,220,190,0.45)' : 'rgba(214,190,245,0.55)' }} />
      {!mann && <div className="absolute left-[30%] top-[40%] h-[22vh] w-[40vw] rounded-full blur-[100px]" style={{ background: 'rgba(255,190,200,0.4)' }} />}
      <svg className="absolute bottom-0 left-0 h-[42vh] w-full" viewBox="0 0 1200 320" preserveAspectRatio="none">
        {ketten.map(([farbe, deckkraft, d]) => <path key={d} d={d} fill={farbe} opacity={deckkraft} />)}
      </svg>
      {/* Dunst ueber den Ketten */}
      <div className="absolute inset-x-0 bottom-[14vh] h-[18vh] blur-2xl" style={{ background: mann ? 'rgba(230,225,215,0.35)' : 'rgba(255,235,240,0.45)' }} />
      <div className="absolute inset-0 opacity-[0.10] mix-blend-multiply" style={{ backgroundImage: KORN }} />
    </div>
  );
}

export default function Pitch() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const c = findeCreator(slug);
  const neu = params.get('design') === 'neu';
  const geschlecht = params.get('geschlecht') || c?.geschlecht || 'w';
  useNurPerLink(c ? `${c.name} × Filip Sudermann` : 'Seite nicht gefunden');
  const vw = useFensterBreite();
  if (!c) return <PageNotFound />;
  // Desktop: das ganze Board passt auf den Bildschirm wie in Figma
  const boardZoom = vw >= DESKTOP ? Math.min(1, vw / BOARD_BREITE) : 1;

  return (
    <div
      className="relative isolate min-h-screen text-[#111]"
      style={neu ? undefined : {
        background: c.background || 'radial-gradient(circle at 15% 20%, #f6e8f3 0%, transparent 45%), radial-gradient(circle at 85% 30%, #e6e9fb 0%, transparent 50%), radial-gradient(circle at 50% 90%, #f3e6f7 0%, transparent 55%), #eee9f6',
      }}
    >
      {neu && <Hintergrund geschlecht={geschlecht} />}
      <div className={`min-h-screen ${neu ? '' : 'bg-[radial-gradient(rgba(0,0,0,0.12)_1px,transparent_1px)] [background-size:22px_22px]'}`}>
        <main className="flex flex-col gap-12 px-4 py-10 lg:w-max lg:flex-row lg:items-start lg:gap-10 lg:px-10 lg:py-14" style={{ zoom: boardZoom }}>
          {/* Gelbe und gruene Box gleich hoch */}
          <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch lg:gap-10">
            <Portfolio c={c} neu={neu} />
            <WerIstFilip c={c} neu={neu} />
          </div>
          <BestesSystem c={c} />
          <Funnel c={c} />
          {/* Website-Entwurf und direkt darunter die Road-Map */}
          <div className="flex flex-col gap-12 lg:gap-8">
            {!c.website && <Webseite c={c} />}
            <RoadMap unten={Boolean(c.website)} stil={c.roadmapStil} />
          </div>
        </main>
        {/* Pflichtangaben: auch die Pitch-Seiten brauchen Impressum und Datenschutz */}
        <footer className="pb-6 text-center text-[12px] text-black/50">
          <Link to="/impressum" className="hover:underline">Impressum</Link>
          <span className="mx-2">·</span>
          <Link to="/datenschutz" className="hover:underline">Datenschutz</Link>
        </footer>
      </div>
    </div>
  );
}
