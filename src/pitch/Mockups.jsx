import React, { useState } from 'react';
import { Search, Bell, MessageCircle, ChevronDown, Crown, Sparkles, Wrench, Users, CalendarDays } from 'lucide-react';
import SkoolLogo from '@/components/SkoolLogo';
import { kurz } from './potenzial';

// Profilbild mit Initiale als Ersatz, falls die Datei fehlt
export function Avatar({ c, className = '' }) {
  const [kaputt, setKaputt] = useState(false);
  if (!c.avatar || kaputt) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-rose-400 font-bold text-white ${className}`}>
        {c.name[0]}
      </div>
    );
  }
  return <img src={c.avatar} alt={c.fullName} onError={() => setKaputt(true)} className={`rounded-full object-cover ${className}`} />;
}

// Instagram-Profilkopf wie in der Desktop-Ansicht (hell): grosses Profilbild,
// kleine Schrift, Zahlen ausgeschrieben wie auf instagram.com
const ganz = (n) => n.toLocaleString('de-DE');

export function ProfilMockup({ c }) {
  const ig = c.instagram;
  return (
    <div className="overflow-hidden rounded-md bg-white px-3 pb-3 pt-3.5 text-[8.5px] leading-[1.35] text-[#0c1014] shadow-lg">
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#962fbf] p-[2.5px]">
          <Avatar c={c} className="h-16 w-16 border-[2.5px] border-white text-[20px]" />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[11.5px] font-semibold">{c.handle} <span className="text-[10px] font-normal tracking-widest">···</span></p>
          <p className="text-[8px] text-[#0c1014]/80">{c.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-2 whitespace-nowrap text-[7.5px]">
            <span><b>{ganz(ig.posts)}</b> Beiträge</span>
            <span><b>{ganz(ig.followers)}</b> Follower</span>
            <span><b>{ganz(ig.following)}</b> Gefolgt</span>
          </div>
        </div>
      </div>
      <div className="mt-2.5">
        <p className="text-[#737373]">{c.category}</p>
        {c.bio.map((zeile) => <p key={zeile}>{zeile}</p>)}
        <p className="font-semibold text-[#00376b]">🔗 {c.link}</p>
      </div>
      <div className="mt-2.5 grid grid-cols-[1fr_1fr_auto] gap-1.5 text-[8.5px] font-semibold">
        <span className="rounded-md bg-[#0095f6] py-1.5 text-center text-white">Folgen</span>
        <span className="rounded-md bg-[#efefef] py-1.5 text-center">Nachricht senden</span>
        <span className="rounded-md bg-[#efefef] px-2 py-1.5 text-center">+</span>
      </div>
      {c.highlights.length > 0 && <div className="mt-3 flex gap-2.5 overflow-hidden">
        {c.highlights.slice(0, 6).map((h) => (
          <div key={h} className="flex w-10 shrink-0 flex-col items-center gap-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dbdbdb] bg-[#fafafa] p-[2px] text-[10px] text-[#737373]">{h[0].toUpperCase()}</span>
            <span className="w-full truncate text-center text-[7px] font-semibold">{h}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

function Banner({ c, gross }) {
  const k = c.community;
  return (
    <div className="relative overflow-hidden rounded-md bg-[#17130f]">
      {c.bilder?.banner
        ? <img src={c.bilder.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        : <img src={c.avatar} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover object-top" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#17130f] via-[#17130f]/90 to-transparent" />
      <div className={`relative flex flex-col justify-between ${gross ? 'min-h-[190px] p-5' : 'min-h-[150px] p-4'}`}>
        <p className="w-[62%] text-center text-[9px] uppercase tracking-[0.35em] text-[#d9c9a8]">✦<br />{k.eyebrow}</p>
        <p className="w-[62%] text-center font-display text-[26px] leading-[0.95] text-[#f3ead8]">{k.name}</p>
        <p className="w-[62%] text-center text-[7px] uppercase tracking-[0.2em] text-[#d9c9a8]">{k.tagline}</p>
      </div>
    </div>
  );
}

const MERKMAL_ICONS = [Sparkles, Wrench, Users, CalendarDays];

// Skool-Startseite der geplanten Community
export function SkoolMockup({ c }) {
  const k = c.community;
  const tabs = ['Community', 'Classroom', 'Kalender', `Mitglieder (${k.members})`, 'Leaderboards', 'Über'];
  return (
    <div className="overflow-hidden rounded-md border border-black/10 bg-white text-[10px] text-[#202124] shadow-lg">
      <div className="flex items-center gap-3 border-b border-black/5 px-4 py-2.5">
        <SkoolLogo size={20} />
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#f1f1f3] px-3 py-1.5 text-[#909090]">
          <Search size={11} /> In dieser Community suchen …
        </div>
        <Bell size={13} className="text-[#909090]" />
        <MessageCircle size={13} className="text-[#909090]" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8e8ec] text-[8px] font-semibold">FS</span>
      </div>
      <div className="flex items-center gap-4 overflow-hidden border-b border-black/5 px-4 py-2 whitespace-nowrap">
        <span className="flex items-center gap-1.5 font-semibold"><Avatar c={c} className="h-5 w-5" /> {k.name} <ChevronDown size={10} /></span>
        {tabs.map((t, i) => (
          <span key={t} className={i === 0 ? 'border-b-2 border-[#202124] pb-0.5 font-semibold' : 'text-[#909090]'}>{t}</span>
        ))}
      </div>
      <div className="grid grid-cols-[1.75fr_1fr] gap-3 p-3">
        <div>
          <Banner c={c} gross />
          <div className="mt-2 flex items-center gap-3 rounded-md border border-black/10 px-3 py-2">
            <Crown size={14} className="text-[#b08a3e]" />
            <div className="flex-1">
              <p className="font-semibold">Community-Mitgliedschaft</p>
              <p className="text-[8px] text-[#909090]">Voller Zugang zu allen Inhalten, Live-Sessions und der Community</p>
            </div>
            <p className="font-bold">{k.price} € / Monat</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-[12px] font-bold">{k.name}</p>
          <p className="text-[8px] text-[#909090]">{k.url}</p>
          <p className="text-[9px] leading-snug">{k.description}</p>
          <ul className="space-y-1">
            {k.features.map((f, i) => {
              const Icon = MERKMAL_ICONS[i % MERKMAL_ICONS.length];
              return <li key={f} className="flex items-center gap-1.5 text-[8.5px]"><Icon size={10} className="text-[#909090]" /> {f}</li>;
            })}
          </ul>
          <div className="mt-1 grid grid-cols-3 border-y border-black/5 py-1.5 text-center">
            {[[k.members, 'Mitglieder'], [k.online, 'Online'], [1, 'Admin']].map(([zahl, label]) => (
              <div key={label}><p className="text-[12px] font-bold">{zahl}</p><p className="text-[7.5px] text-[#909090]">{label}</p></div>
            ))}
          </div>
          <span className="mt-auto rounded-md bg-[#3b3f8a] py-2 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
            Mitglied werden für {k.price} € / Monat
          </span>
        </div>
      </div>
    </div>
  );
}

// Kleine Fassung fuer "Konkrete Verbesserungen"
export function SkoolMini({ c }) {
  return (
    <div className="pointer-events-none origin-top-left" style={{ zoom: 0.42 }} aria-hidden="true">
      <SkoolMockup c={c} />
    </div>
  );
}

// Startseite einer Personal-Brand-Website fuer Creator ohne eigene Seite
export function WebsiteMockup({ c }) {
  const w = c.webseite;
  const angebot = c.premium[1];
  const bild = c.bilder?.banner || c.avatar;
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-[#2b261f] text-[#efe8dc] shadow-lg">
      <img src={bild} alt="" className="absolute inset-y-0 right-0 h-full w-[55%] object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2b261f] via-[#2b261f]/85 to-transparent" />
      <div className="relative flex items-center gap-4 px-5 py-3 text-[7px] uppercase tracking-[0.18em] text-[#efe8dc]/80">
        <span className="mr-auto flex items-center gap-1.5 text-[10px] normal-case tracking-normal text-[#efe8dc]">
          <span className="text-[#b8a06a]">▲</span><span className="font-display">{c.fullName}</span>
        </span>
        {w.nav.map((n) => <span key={n}>{n}</span>)}
        <span>DE · EN</span>
      </div>
      <div className="relative w-[58%] px-5 pt-3">
        <p className="text-[7px] uppercase tracking-[0.2em] text-[#b8a06a]">{c.fullName}</p>
        <p className="mt-1 text-[7.5px] text-[#efe8dc]/70">{w.claim}</p>
        <div className="mt-4 font-display text-[25px] leading-[1.08]">
          {w.headline.map((zeile, i) => <p key={zeile} className={i === 1 ? 'italic' : ''}>{zeile}</p>)}
        </div>
        <p className="mt-3 text-[8px] leading-relaxed text-[#efe8dc]/75">{w.sub}</p>
        <div className="mt-4 flex gap-2 text-[7.5px]">
          <span className="rounded-sm bg-[#56604f] px-3 py-1.5">{w.cta}</span>
          <span className="rounded-sm border border-[#efe8dc]/40 px-3 py-1.5">Zur Community</span>
        </div>
      </div>
      <div className="absolute bottom-4 right-14 w-[34%] rounded-md bg-[#1b1814]/95 p-3 shadow-xl">
        <p className="text-[6.5px] uppercase tracking-[0.18em] text-[#b8a06a]">{angebot.title}</p>
        <p className="mt-1 font-display text-[12px] leading-tight">{w.angebotTitel}</p>
        <p className="mt-1 text-[7px] italic text-[#efe8dc]/70">{w.angebotText}</p>
        <span className="mt-2 block rounded-sm bg-[#b8a06a] py-1.5 text-center text-[7px] font-semibold uppercase tracking-wide text-[#1b1814]">Meinen Platz sichern</span>
      </div>
      <img src={c.avatar} alt="" className="absolute bottom-3 right-3 h-9 w-9 rounded-full border-2 border-[#efe8dc] object-cover" />
    </div>
  );
}

// Die drei Fulfillment-Bausteine wie die echten Skool-Seiten: in Original-
// groesse (520 x 420 px) gebaut und als Kachel verkleinert, alle gleich gross.
const SKOOL_RAND = 'border border-[#e4e4e4]';

function SkoolKachel({ children }) {
  return (
    <div className="aspect-[52/42] overflow-hidden bg-[#f8f7f5]">
      <div className="pointer-events-none h-[420px] w-[520px] origin-top-left p-4 text-[13px] text-[#202124]" style={{ zoom: 'var(--kachel-zoom)' }} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

export function CommunityFeed({ c }) {
  const k = c.community;
  const beitraege = [
    { titel: `Willkommen im ${k.name}! 👋`, text: 'Stell dich kurz vor: Wer bist du, was hat dich hergebracht und was willst du in den nächsten 90 Tagen verändern?', kat: 'Allgemein', zeit: '2 T.', likes: 48, kommentare: 112, fix: true },
    { titel: 'Live-Q&A am Donnerstag um 19 Uhr', text: `Schreib deine Fragen hier in die Kommentare, ${c.name} beantwortet sie live im Call.`, kat: 'Ankündigungen', zeit: '5 Std.', likes: 23, kommentare: 31 },
    { titel: 'Mein Durchbruch diese Woche 🏆', text: 'Ich habe die Übung aus Modul 2 jeden Morgen gemacht und kann es selbst kaum glauben …', kat: 'Erfolge', zeit: '1 Std.', likes: 17, kommentare: 9 },
  ];
  return (
    <SkoolKachel>
      <div className={`flex items-center gap-3 rounded-lg bg-white px-4 py-3 ${SKOOL_RAND}`}>
        <span className="h-8 w-8 rounded-full bg-[#d9d9d9]" />
        <span className="text-[#909090]">Schreib etwas …</span>
      </div>
      <div className="mt-3 flex gap-2 text-[12px]">
        {['Alle', 'Allgemein', 'Ankündigungen', 'Erfolge'].map((f, i) => (
          <span key={f} className={`rounded-full px-3 py-1.5 ${i === 0 ? 'bg-[#909090] text-white' : 'bg-[#e4e4e4] text-[#555]'}`}>{f}</span>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {beitraege.slice(0, 2).map((b) => (
          <div key={b.titel} className={`rounded-lg bg-white p-4 ${SKOOL_RAND}`}>
            <div className="flex items-center gap-2.5">
              <div className="relative"><Avatar c={c} className="h-9 w-9 text-[12px]" /><span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4f7df9] text-[9px] font-bold text-white">7</span></div>
              <div className="leading-tight">
                <p className="font-semibold">{c.fullName}</p>
                <p className="text-[11px] text-[#909090]">{b.zeit} · {b.kat}</p>
              </div>
              {b.fix && <span className="ml-auto text-[11px] font-semibold text-[#909090]">📌 Angepinnt</span>}
            </div>
            <p className="mt-3 text-[15px] font-bold">{b.titel}</p>
            <p className="mt-1 line-clamp-2 text-[#555]">{b.text}</p>
            <div className="mt-3 flex items-center gap-4 text-[12px] text-[#555]">
              <span>👍 {b.likes}</span><span>💬 {b.kommentare}</span>
              <span className="ml-auto text-[#4f7df9]">Neuer Kommentar vor {b.zeit}</span>
            </div>
          </div>
        ))}
      </div>
    </SkoolKachel>
  );
}

// Jeder Kurs bekommt ein eigenes Titelbild (Farbverlauf) und eine eigene
// Beschreibung, wie in einem echten Skool-Classroom
const KURS_FARBEN = [
  'from-[#2b2a4c] to-[#6b5ca5]', 'from-[#7a3b2e] to-[#d98b5f]', 'from-[#1f4e4a] to-[#5fa58f]',
  'from-[#4a2b4c] to-[#c06c9b]', 'from-[#2e3d5c] to-[#6f9bd1]', 'from-[#3a2f12] to-[#c9a24a]',
];
const kursText = (kurs, i, letzter) => {
  if (i === 0) return 'Dein Einstieg: so holst du das Meiste aus der Community';
  if (letzter) return 'Exklusiv: 1:1-Calls, Bonus-Inhalte und VIP-Austausch';
  return [`${kurs}: die Grundlagen in 5 Lektionen`, `${kurs} im Alltag: Übungen und Routinen`, `${kurs} vertiefen mit Live-Aufzeichnungen`, `${kurs}: Workbook und Meditationen`][(i - 1) % 4];
};

export function Classroom({ c }) {
  return (
    <SkoolKachel>
      <div className="grid grid-cols-3 gap-2.5">
        {c.community.kurse.map((kurs, i) => {
          const gesperrt = i === c.community.kurse.length - 1;
          const fortschritt = [100, 64, 30, 12, 0, 0][i] ?? 0;
          return (
            <div key={kurs} className={`overflow-hidden rounded-lg bg-white ${SKOOL_RAND}`}>
              <div className={`relative flex h-[70px] items-center justify-center bg-gradient-to-br px-2 ${KURS_FARBEN[i % KURS_FARBEN.length]}`}>
                <span className="text-center font-display text-[16px] leading-tight text-white">{kurs}</span>
                {gesperrt && <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">🔒 VIP</span>}
              </div>
              <div className="p-2.5">
                <p className="truncate text-[12px] font-bold">{kurs}</p>
                <p className="mt-0.5 line-clamp-2 h-[28px] text-[10px] leading-[14px] text-[#909090]">{kursText(kurs, i, gesperrt)}</p>
                <div className="mt-2 h-1.5 rounded-full bg-[#e4e4e4]"><div className="h-1.5 rounded-full bg-[#2ea043]" style={{ width: `${fortschritt}%` }} /></div>
                <p className="mt-1 text-[10px] text-[#909090]">{fortschritt} %</p>
              </div>
            </div>
          );
        })}
      </div>
    </SkoolKachel>
  );
}

export function Kalender() {
  const termine = { 4: 'Live-Q&A 19:00', 11: 'Workshop 18:30', 18: 'Live-Q&A 19:00', 25: 'Challenge-Start' };
  // November 2026 beginnt an einem Sonntag
  const leer = 6;
  return (
    <SkoolKachel>
      <div className={`rounded-lg bg-white p-4 ${SKOOL_RAND}`}>
        <div className="flex items-center justify-between">
          <span className="rounded-md border border-[#e4e4e4] px-3 py-1 text-[12px]">Heute</span>
          <p className="text-[16px] font-bold">‹ November 2026 ›</p>
          <span className="text-[12px] text-[#909090]">Monat</span>
        </div>
        <div className="mt-3 grid grid-cols-7 border-l border-t border-[#e4e4e4] text-[11px]">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((t) => <div key={t} className="border-b border-r border-[#e4e4e4] py-1.5 text-center font-semibold text-[#909090]">{t}</div>)}
          {Array.from({ length: 35 }, (_, i) => {
            const tag = i - leer + 1;
            return (
              <div key={i} className="h-[56px] border-b border-r border-[#e4e4e4] p-1">
                {tag >= 1 && tag <= 30 && <span className="text-[#555]">{tag}</span>}
                {termine[tag] && <span className="mt-1 block rounded bg-[#e8f0fe] px-1 py-0.5 text-[10px] font-semibold leading-tight text-[#1a56db]">{termine[tag]}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </SkoolKachel>
  );
}
