import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Users, Rocket, Mail, Clapperboard, Bot, TrendingUp, Package } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const iconMap = { Globe, Users, Rocket, Mail, Clapperboard, Bot, TrendingUp, Package };

const NAVY = '#0B1930';
const GOLD = '#C8A13A';
const CREAM = '#FBF8F2';
const BORDER = '#E8DCB8';

function ServiceCard({ item, i }) {
  const Icon = iconMap[item.icon] || Globe;
  return (
    <Link
      to={`/inspiration-hub#topic-${i}`}
      className="group block h-full"
      style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 20, boxShadow: '0 18px 44px -30px rgba(11,25,48,0.22)' }}
    >
      <div className="p-6 lg:p-7 h-full flex flex-col">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 transition-colors"
          style={{ border: `1px solid ${GOLD}55`, background: `${GOLD}0F` }}
        >
          <Icon size={20} strokeWidth={1.6} className="text-foreground group-hover:text-accent transition-colors" />
        </div>
        <h3 className="font-heading font-bold text-2xl mb-2 text-foreground">{item.title}</h3>
        <p className="text-base leading-relaxed" style={{ color: '#46536A' }}>{item.desc}</p>
      </div>
    </Link>
  );
}

function CentralCard({ item }) {
  const Icon = iconMap[item.icon] || Globe;
  return (
    <div
      className="relative h-full"
      style={{ border: `1px solid ${GOLD}`, borderRadius: 22, boxShadow: '0 30px 70px -34px rgba(11,25,48,0.5)' }}
    >
      <div
        className="h-full flex flex-col"
        style={{ background: NAVY, borderRadius: 18, margin: 4, border: `1px solid ${GOLD}` }}
      >
        <div className="p-7 lg:p-8 h-full flex flex-col justify-center">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
            style={{ border: `1px solid ${GOLD}`, background: `${GOLD}1A` }}
          >
            <Icon size={22} strokeWidth={1.6} style={{ color: GOLD }} />
          </div>
          <h3 className="font-heading font-bold text-4xl mb-3" style={{ color: '#FFFFFF' }}>{item.title}</h3>
          <p className="text-base leading-relaxed" style={{ color: '#C9D2E0' }}>{item.desc}</p>
        </div>
      </div>
    </div>
  );
}

function Architecture({ items }) {
  return (
    <div className="relative">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[
          [16, 30], [84, 20], [84, 44],
          [12, 82], [37, 82], [62, 82], [87, 82],
        ].map(([x, y], k) => (
          <g key={k}>
            <line x1="50" y1="32" x2={x} y2={y} stroke={GOLD} strokeWidth="0.22" opacity="0.4" />
            <circle cx={x} cy={y} r="0.6" fill={GOLD} opacity="0.6" />
          </g>
        ))}
        <circle cx="50" cy="32" r="1" fill={GOLD} opacity="0.7" />
      </svg>

      <div className="relative grid grid-cols-12 gap-6 items-stretch z-10" style={{ minHeight: 400 }}>
        <div className="col-span-4">
          <ServiceCard item={items[0]} i={0} />
        </div>
        <div className="col-span-4">
          <CentralCard item={items[2]} />
        </div>
        <div className="col-span-4 flex flex-col gap-6">
          <div className="flex-1 min-h-0"><ServiceCard item={items[1]} i={1} /></div>
          <div className="flex-1 min-h-0"><ServiceCard item={items[3]} i={3} /></div>
        </div>
      </div>

      <div className="relative grid grid-cols-12 gap-6 mt-6 items-stretch z-10" style={{ minHeight: 200 }}>
        <div className="col-span-3"><ServiceCard item={items[4]} i={4} /></div>
        <div className="col-span-3"><ServiceCard item={items[5]} i={5} /></div>
        <div className="col-span-3"><ServiceCard item={items[6]} i={6} /></div>
        <div className="col-span-3"><ServiceCard item={items[7]} i={7} /></div>
      </div>
    </div>
  );
}

export default function ServicesContent() {
  const { t } = useLanguage();
  const items = t.folders.services.items;

  return (
    <>
      <div className="hidden lg:block">
        <Architecture items={items} />
      </div>

      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <Link key={i} to={`/inspiration-hub#topic-${i}`} className="bg-card border border-foreground rounded-xl p-6 lg:p-8 hover:border-accent transition-colors group block">
            <div className="w-11 h-11 border border-border rounded-lg flex items-center justify-center mb-5 group-hover:border-accent group-hover:bg-accent/5 transition-colors">
              {(() => { const Icon = iconMap[item.icon] || Globe; return <Icon size={20} className="text-foreground group-hover:text-accent transition-colors" />; })()}
            </div>
            <h3 className="font-heading font-semibold text-2xl mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
