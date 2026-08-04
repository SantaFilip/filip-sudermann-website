import React from 'react';
import { User, Leaf } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const OLIVE = '#6b7e52';
const GRAY = '#d1d3cf';
const GOLD_BORDER = '#C5A566';
const HEADER_OLIVE = '#858966';
const ICON_GRAY = '#5e5e5e';
const CHARCOAL = '#1a1a1a';

function Donut2D({ segments, centerValue, centerLabel }) {
  const rawId = React.useId();
  const rid = rawId.replace(/:/g, '');
  const size = 210;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 90;
  const rInner = 58;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const gapDeg = 3;

  const gradFor = (color) => (color === OLIVE ? `${rid}-olive` : color === GRAY ? `${rid}-gray` : null);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`${rid}-olive`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9bab7b" />
            <stop offset="45%" stopColor="#6b7e52" />
            <stop offset="100%" stopColor="#566340" />
          </linearGradient>
          <linearGradient id={`${rid}-gray`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f1f1ef" />
            <stop offset="45%" stopColor="#d1d3cf" />
            <stop offset="100%" stopColor="#b6b8b3" />
          </linearGradient>
          <linearGradient id={`${rid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6D2A0" />
            <stop offset="50%" stopColor="#C5A566" />
            <stop offset="100%" stopColor="#9b7f44" />
          </linearGradient>
          <radialGradient id={`${rid}-gloss`} cx="0.5" cy="0.28" r="0.6">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id={`${rid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1a1a1a" floodOpacity="0.18" />
          </filter>
          <pattern id={`${rid}-hatch`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#d8dcc8" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#7a8568" strokeWidth="2.2" />
          </pattern>
        </defs>

        <circle cx={cx} cy={cy} r={rOuter + 6} fill="none" stroke={`url(#${rid}-gold)`} strokeWidth={2.4} />
        <circle cx={cx} cy={cy} r={rOuter + 6} fill="none" stroke="#ffffff" strokeWidth={0.6} opacity={0.45} />
        <circle cx={cx} cy={cy} r={rOuter + 2.5} fill="none" stroke={`url(#${rid}-gold)`} strokeWidth={0.5} opacity={0.6} strokeDasharray="2 4" />

        <g filter={`url(#${rid}-shadow)`}>
          {segments.map((seg, i) => {
            const startAngle = -90 + (acc / total) * 360 + gapDeg / 2;
            acc += seg.value;
            const endAngle = -90 + (acc / total) * 360 - gapDeg / 2;
            const a1 = (startAngle * Math.PI) / 180;
            const a2 = (endAngle * Math.PI) / 180;
            const large = endAngle - startAngle > 180 ? 1 : 0;
            const x1 = cx + rOuter * Math.cos(a1);
            const y1 = cy + rOuter * Math.sin(a1);
            const x2 = cx + rOuter * Math.cos(a2);
            const y2 = cy + rOuter * Math.sin(a2);
            const x3 = cx + rInner * Math.cos(a2);
            const y3 = cy + rInner * Math.sin(a2);
            const x4 = cx + rInner * Math.cos(a1);
            const y4 = cy + rInner * Math.sin(a1);
            const d = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
            const gid = gradFor(seg.color);
            const fill = seg.hatch ? `url(#${rid}-hatch)` : gid ? `url(#${gid})` : seg.color;
            return <path key={i} d={d} fill={fill} />;
          })}
        </g>

        <circle cx={cx} cy={cy} r={rOuter + 1} fill={`url(#${rid}-gloss)`} opacity={0.75} />

        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke={`url(#${rid}-gold)`} strokeWidth={1.2} />
        <circle cx={cx} cy={cy} r={rInner - 2} fill="#FCFCF9" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl lg:text-5xl font-heading font-bold leading-none" style={{ color: CHARCOAL }}>{centerValue}</span>
        <span className="text-[12px] mt-2 text-center px-3 font-medium" style={{ color: ICON_GRAY }}>{centerLabel}</span>
      </div>
    </div>
  );
}

function LegendDot({ color, text, hatch }) {
  return (
    <div className="flex items-center gap-2">
      {hatch ? (
        <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ background: 'repeating-linear-gradient(45deg, #7a8568 0 2px, #d8dcc8 2px 4px)' }} />
      ) : (
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      <span className="text-sm font-medium" style={{ color: '#3f4856' }}>{text}</span>
    </div>
  );
}

function DonutColumn({ label, segments, centerValue, centerLabel, legend }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-bold tracking-[0.3em] uppercase mb-5" style={{ color: '#A38C5E' }}>{label}</span>
      <Donut2D segments={segments} centerValue={centerValue} centerLabel={centerLabel} />
      <div className="mt-6 flex flex-col gap-2.5">
        {legend.map((l, i) => (
          <LegendDot key={i} color={l.color} text={l.text} hatch={l.hatch} />
        ))}
      </div>
    </div>
  );
}

export function ProfitShareCharts() {
  const { t } = useLanguage();
  const p = t.profitShare;

  const workloadSegments = [
    { value: 20, color: OLIVE },
    { value: 10, color: GRAY, hatch: true },
    { value: 70, color: GRAY },
  ];
  const shareSegments = [
    { value: 20, color: GRAY },
    { value:20, color: GRAY, hatch: true },
    { value: 60, color: OLIVE },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className="h-px w-12" style={{ background: `${GOLD_BORDER}66` }} />
        <span className="w-2 h-2 rotate-45" style={{ background: HEADER_OLIVE }} />
        <span className="h-px w-12" style={{ background: `${GOLD_BORDER}66` }} />
      </div>

      <div
        className="w-full max-w-3xl rounded-2xl px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14"
        style={{ background: '#FCFCF9', border: `4px solid ${GOLD_BORDER}`, boxShadow: '0 24px 60px -40px rgba(11,25,48,0.25)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-8 sm:gap-4">
          <DonutColumn
            label={p.workloadLabel}
            segments={workloadSegments}
            centerValue={`${p.workload.you}%`}
            centerLabel={p.centerWorkload}
            legend={[
              { color: OLIVE, text: `${p.legendWorkloadYou}: 20–30%` },
              { color: GRAY, text: `${p.legendWorkloadMe}: 70–80%` },
            ]}
          />

          <div className="hidden sm:flex items-center justify-center self-center">
            <div className="h-px w-8" style={{ background: `${GOLD_BORDER}88` }} />
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ border: `1px solid ${GOLD_BORDER}`, background: '#FCFCF9' }}
            >
              <User size={17} style={{ color: ICON_GRAY }} />
            </div>
            <div className="h-px w-8" style={{ background: `${GOLD_BORDER}88` }} />
          </div>

          <DonutColumn
            label={p.shareLabel}
            segments={shareSegments}
            centerValue={`${p.share.you}%`}
            centerLabel={p.centerShare}
            legend={[
              { color: GRAY, text: `${p.legendShareMe}: 20–40%` },
              { color: OLIVE, text: `${p.legendShareYou}: 60–80%` },
            ]}
          />
        </div>
      </div>

      <div className="mt-10">
        <div
          className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full"
          style={{ background: '#fcfcf9', border: `1px solid ${GOLD_BORDER}55`, boxShadow: '0 14px 34px -20px rgba(11,25,48,0.18)' }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: OLIVE }}>
            <Leaf size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold" style={{ color: CHARCOAL }}>{p.footerPre}</span>
          <span className="text-sm font-medium" style={{ color: HEADER_OLIVE }}>{p.footerAccent}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProfitShare() {
  const { t } = useLanguage();
  const p = t.profitShare;

  return (
    <section className="py-20 lg:py-28" style={{ background: '#f7f4ed' }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-[2.8rem] lg:text-[4.5rem] font-heading font-bold tracking-tight text-balance" style={{ color: CHARCOAL }}>
            {p.titlePre}
            <span style={{ color: HEADER_OLIVE }}>{p.titleAccent}</span>
            {p.titleSuffix}
          </h2>
        </div>
        <ProfitShareCharts />
      </div>
    </section>
  );
}
