import React, { useState } from 'react';
import { Search, Bell, MessageCircle, ChevronDown, Crown, Sparkles, Wrench, Users, CalendarDays, Lock, Heart, MessageSquare } from 'lucide-react';
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
          <div className="mt-1.5 flex gap-2 whitespace-nowrap text-[7.5px]">
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

// Die drei Fulfillment-Bausteine: Community, Classroom, Kalender
export function CommunityFeed({ c }) {
  return (
    <div className="space-y-1.5 bg-white p-2">
      {['Willkommen! Stell dich kurz vor 👋', 'Live-Q&A am Donnerstag', 'Deine Challenge diese Woche'].map((titel, i) => (
        <div key={titel} className="rounded border border-black/5 p-1.5">
          <div className="flex items-center gap-1"><Avatar c={c} className="h-3.5 w-3.5 text-[6px]" /><span className="text-[7px] font-semibold">{c.name}</span><span className="text-[6px] text-[#909090]">· {i + 1} T</span></div>
          <p className="mt-0.5 text-[7.5px] font-semibold">{titel}</p>
          <div className="mt-1 h-1 w-4/5 rounded bg-black/5" />
          <div className="mt-1 flex gap-2 text-[6px] text-[#909090]"><span className="flex items-center gap-0.5"><Heart size={6} /> {24 - i * 7}</span><span className="flex items-center gap-0.5"><MessageSquare size={6} /> {12 - i * 3}</span></div>
        </div>
      ))}
    </div>
  );
}

export function Classroom({ c }) {
  const kurse = c.community.kurse;
  return (
    <div className="grid grid-cols-3 gap-1.5 bg-white p-2">
      {kurse.map((k, i) => (
        <div key={k} className="overflow-hidden rounded border border-black/5">
          <div className="flex h-8 items-center justify-center bg-gradient-to-br from-[#5b3fd1] to-[#9a6bff] px-1 text-center text-[6.5px] font-bold text-white">
            {i === kurse.length - 1 && <Lock size={7} className="mr-0.5" />}{k}
          </div>
          <div className="p-1"><div className="h-1 rounded bg-black/10"><div className="h-1 rounded bg-[#5b3fd1]" style={{ width: `${90 - i * 15}%` }} /></div></div>
        </div>
      ))}
    </div>
  );
}

export function Kalender() {
  const termine = { 3: 'Q&A', 10: 'Live', 17: 'Q&A', 24: 'Challenge' };
  return (
    <div className="bg-white p-2">
      <div className="grid grid-cols-7 gap-px bg-black/5 text-[6px]">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((t) => <div key={t} className="bg-white py-0.5 text-center font-semibold">{t}</div>)}
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className="h-5 bg-white p-0.5">
            <span className="text-[#909090]">{i + 1}</span>
            {termine[i] && <span className="block truncate rounded-sm bg-[#3b3f8a] px-0.5 text-[5.5px] text-white">{termine[i]}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
