import React from 'react';

// "Das Beste System fuer dich": Plattformen (Basic) fuehren in Skool, Webseite
// und Newsletter (Advanced), diese in die zwei Premium-Angebote.
// Alle Kaesten quadratisch mit runden Ecken und weichem Schatten.
const FARBEN = {
  schwarz: { fill: '#1c1c1e', text: '#fff' },
  gruen: { fill: '#9ad9a0', text: '#123a1c' },
  rot: { fill: '#e8674f', text: '#fff' },
  blau: { fill: '#86b7f2', text: '#fff' },
  gelb: { fill: '#f3d36b', text: '#4a3a07' },
};

const SEITE = 70; // Kantenlaenge der Kaesten in Reihe 2 und 3
const KLEIN = 46; // Kantenlaenge der Plattform-Kaesten oben

function Kasten({ x, y, seite, farbe, zeilen, schrift = 8.5 }) {
  const f = FARBEN[farbe];
  const zeile = schrift * 1.3;
  const start = y + seite / 2 - ((zeilen.length - 1) * zeile) / 2 + schrift * 0.35;
  return (
    <g>
      <rect x={x} y={y} width={seite} height={seite} rx="8" fill={f.fill} filter="url(#schatten)" />
      <text textAnchor="middle" fontSize={schrift} fontWeight="600" fill={f.text}>
        {zeilen.map((z, i) => <tspan key={i} x={x + seite / 2} y={start + i * zeile}>{z}</tspan>)}
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
  const mitte = 190;
  const plattformen = c.systemPlatforms;
  const abstand = 16;
  const gesamt = plattformen.length * KLEIN + (plattformen.length - 1) * abstand;
  const oben = plattformen.map((p, i) => ({ p, x: mitte - gesamt / 2 + i * (KLEIN + abstand) }));
  const obenY = 10;

  // Mittlere Reihe: Skool links, Webseite Mitte, Newsletter rechts
  const reihe2 = 108;
  const skool = { x: mitte - 125 - SEITE / 2, y: reihe2 };
  const web = { x: mitte - SEITE / 2, y: reihe2 };
  const mail = { x: mitte + 125 - SEITE / 2, y: reihe2 };
  // Untere Reihe: die zwei Premium-Angebote
  const reihe3 = 218;
  const coach = { x: mitte - 62 - SEITE / 2, y: reihe3 };
  const retreat = { x: mitte + 62 - SEITE / 2, y: reihe3 };
  const ziele = [skool, web, mail].map((b) => b.x + SEITE / 2);
  const halb = SEITE / 2;

  return (
    <svg viewBox="0 0 430 300" className="w-full" role="img" aria-label="Systemübersicht vom Content bis zum Premium-Angebot">
      <defs>
        <marker id="pfeil" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill="#555" />
        </marker>
        <filter id="schatten" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" floodColor="#000" floodOpacity="0.16" />
        </filter>
      </defs>
      <g fill="none" stroke="#555" strokeWidth="0.9">
        {oben.flatMap(({ x }, i) => ziele.map((zx, j) => {
          const sx = x + KLEIN / 2;
          const sy = obenY + KLEIN;
          return <path key={`${i}-${j}`} d={`M${sx},${sy} C${sx},${sy + 30} ${zx},${reihe2 - 32} ${zx},${reihe2 - 2}`} markerEnd="url(#pfeil)" />;
        }))}
        <path d={`M${web.x},${reihe2 + halb} L${skool.x + SEITE + 2},${reihe2 + halb}`} markerEnd="url(#pfeil)" />
        <path d={`M${web.x + SEITE},${reihe2 + halb} L${mail.x - 2},${reihe2 + halb}`} markerEnd="url(#pfeil)" />
        <path d={`M${mitte},${reihe2 + SEITE} L${coach.x + halb},${reihe3 - 2}`} markerEnd="url(#pfeil)" />
        <path d={`M${mitte},${reihe2 + SEITE} L${retreat.x + halb},${reihe3 - 2}`} markerEnd="url(#pfeil)" />
        <path d={`M${skool.x + halb},${reihe2 + SEITE} L${skool.x + halb},${reihe3 + halb} L${coach.x - 2},${reihe3 + halb}`} markerEnd="url(#pfeil)" />
        <path d={`M${mail.x + halb},${reihe2 + SEITE} L${mail.x + halb},${reihe3 + halb} L${retreat.x + SEITE + 2},${reihe3 + halb}`} markerEnd="url(#pfeil)" />
      </g>
      {oben.map(({ p, x }) => <Kasten key={p} x={x} y={obenY} seite={KLEIN} farbe="schwarz" schrift={7.5} zeilen={umbrechen(p, 9)} />)}
      <Kasten {...skool} seite={SEITE} farbe="gruen" zeilen={[...umbrechen(`Skool: ${c.community.name}`, 12), `${c.community.price} € / Monat`]} />
      <Kasten {...web} seite={SEITE} farbe="rot" zeilen={[c.possessive, 'Webseite']} />
      <Kasten {...mail} seite={SEITE} farbe="blau" zeilen={umbrechen(c.emailLabel, 10)} />
      {[coach, retreat].map((box, i) => {
        const angebot = c.premium[i];
        return <Kasten key={angebot.title} {...box} seite={SEITE} farbe="gelb" zeilen={[...umbrechen(angebot.title, 10), `${angebot.price} €`, `/ ${angebot.unit}`]} />;
      })}
      <g fontSize="9.5" fontWeight="700" fill="#111">
        <text x="380" y={obenY + KLEIN / 2 + 3}>Basic</text>
        <text x="380" y={reihe2 + halb + 3}>Advanced</text>
        <text x={mitte} y={reihe3 + halb + 3} textAnchor="middle">Premium</text>
      </g>
    </svg>
  );
}
