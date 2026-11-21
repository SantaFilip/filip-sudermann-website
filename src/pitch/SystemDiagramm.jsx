import React from 'react';

// "Das Beste System fuer dich": Plattformen (Basic) fuehren in Skool, Webseite
// und Newsletter (Advanced), diese in Coaching und Retreats (Premium).
const FARBEN = {
  schwarz: { fill: '#111', text: '#fff' },
  gruen: { fill: '#86d88a', text: '#11351a' },
  rot: { fill: '#e8573f', text: '#fff' },
  blau: { fill: '#7fb5f7', text: '#fff' },
  gelb: { fill: '#f6cf55', text: '#4a3a07' },
};

function Kasten({ x, y, w, h, farbe, zeilen }) {
  const f = FARBEN[farbe];
  const zeile = 10;
  const start = y + h / 2 - ((zeilen.length - 1) * zeile) / 2 + 3;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={f.fill} stroke="#1a1a1a" strokeOpacity={farbe === 'schwarz' ? 0 : 0.25} />
      <text textAnchor="middle" fontSize="7.5" fontWeight="600" fill={f.text}>
        {zeilen.map((z, i) => <tspan key={i} x={x + w / 2} y={start + i * zeile}>{z}</tspan>)}
      </text>
    </g>
  );
}

const umbrechen = (text, max) => {
  const zeilen = [];
  let aktuell = '';
  for (const wort of text.split(' ')) {
    if ((aktuell + ' ' + wort).trim().length > max && aktuell) { zeilen.push(aktuell); aktuell = wort; }
    else aktuell = (aktuell + ' ' + wort).trim();
  }
  if (aktuell) zeilen.push(aktuell);
  return zeilen;
};

export default function SystemDiagramm({ c }) {
  const plattformen = c.systemPlatforms;
  const breite = 46;
  const abstand = 18;
  const gesamt = plattformen.length * breite + (plattformen.length - 1) * abstand;
  const startX = 165 - gesamt / 2;
  const oben = plattformen.map((p, i) => ({ p, x: startX + i * (breite + abstand) }));

  // Mittlere Reihe: Skool links, Webseite Mitte, Newsletter rechts
  const skool = { x: 20, y: 110, w: 70, h: 62 };
  const web = { x: 130, y: 110, w: 70, h: 50 };
  const mail = { x: 240, y: 110, w: 62, h: 50 };
  const coach = { x: 75, y: 215, w: 62, h: 52 };
  const retreat = { x: 195, y: 215, w: 62, h: 52 };
  const ziele = [skool, web, mail].map((b) => b.x + b.w / 2);

  return (
    <svg viewBox="0 0 380 285" className="w-full" role="img" aria-label="Systemübersicht vom Content bis zum Premium-Angebot">
      <defs>
        <marker id="pfeil" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="#333" />
        </marker>
      </defs>
      <g fill="none" stroke="#333" strokeWidth="0.9">
        {oben.flatMap(({ x }, i) => ziele.map((zx, j) => {
          const sx = x + breite / 2;
          return <path key={`${i}-${j}`} d={`M${sx},48 C${sx},80 ${zx},78 ${zx},${skool.y - 1}`} markerEnd="url(#pfeil)" />;
        }))}
        <path d={`M${web.x},${web.y + 25} L${skool.x + skool.w + 2},${web.y + 25}`} markerEnd="url(#pfeil)" />
        <path d={`M${web.x + web.w},${web.y + 25} L${mail.x - 2},${web.y + 25}`} markerEnd="url(#pfeil)" />
        <path d={`M${web.x + web.w / 2},${web.y + web.h} L${coach.x + coach.w / 2},${coach.y - 2}`} markerEnd="url(#pfeil)" />
        <path d={`M${web.x + web.w / 2},${web.y + web.h} L${retreat.x + retreat.w / 2},${retreat.y - 2}`} markerEnd="url(#pfeil)" />
        <path d={`M${skool.x + 8},${skool.y + skool.h} L${skool.x + 8},${coach.y + 26} L${coach.x - 2},${coach.y + 26}`} markerEnd="url(#pfeil)" />
        <path d={`M${mail.x + mail.w - 8},${mail.y + mail.h} L${mail.x + mail.w - 8},${retreat.y + 26} L${retreat.x + retreat.w + 2},${retreat.y + 26}`} markerEnd="url(#pfeil)" />
      </g>
      {oben.map(({ p, x }) => <Kasten key={p} x={x} y={12} w={breite} h={36} farbe="schwarz" zeilen={umbrechen(p, 9)} />)}
      <Kasten {...skool} farbe="gruen" zeilen={[...umbrechen(`Skool: ${c.community.name}`, 15), `(${c.community.price}€/ Monat)`]} />
      <Kasten {...web} farbe="rot" zeilen={[c.possessive, 'Webseite']} />
      <Kasten {...mail} farbe="blau" zeilen={umbrechen(c.emailLabel, 11)} />
      <Kasten {...coach} farbe="gelb" zeilen={['Coaching', `(${c.coaching.price}€/`, `${c.coaching.unit})`]} />
      <Kasten {...retreat} farbe="gelb" zeilen={['Group', 'Retreats', `(${c.retreat.price}€/`, `${c.retreat.unit})`]} />
      <g fontSize="9" fontWeight="700" fill="#111">
        <text x="330" y="34">Basic</text>
        <text x="318" y="140">Advanced</text>
        <text x="145" y="246">Premium</text>
      </g>
    </svg>
  );
}
