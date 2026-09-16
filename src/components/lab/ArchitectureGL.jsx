import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

/**
 * Echtes 3D-Rahmengeruest (Saeulen, Dach, Sockel) per WebGL, als Ersatz fuer
 * die fruehere flache SVG-Naeherung (siehe Architecture.jsx - entfernt).
 *
 * Der Kern des Problems, das eine reine SVG/CSS-Naeherung nie loesen konnte:
 * eine flache 2D-Ellipse kann nur fuer EINE Kamera-Perspektive kalibriert
 * werden - meist die Frontflaeche. Jede andere sichtbare Facette der
 * rotierenden Trommel wird durch die echte 3D-Perspektive der Buehne (CSS
 * `perspective`) anders verkleinert/verschoben projiziert.
 *
 * ZWEI getrennte WebGL-Layer statt einem, bewusst:
 * - ArchitectureBackGL (Dach + Sockel): statisch, dreht nicht mit. Sitzt im
 *   DOM VOR der Facetten-Trommel - liegt also HINTER dem Inhalt. Jede
 *   Inhaltsflaeche (undurchsichtiger CSS-Hintergrund) deckt sie vollstaendig
 *   ab, egal was auf dieser Ebene passiert. Frueher lebten Dach/Sockel in
 *   derselben Ebene wie die Saeulen, NACH der Trommel im DOM (vor dem
 *   Inhalt) - Kuppel-Silhouette und Sockel-Flaeche reichen aber ueber die
 *   ganze Buehnenbreite, nicht nur bis zur Saeule, und konnten so (z.B. bei
 *   bestimmten Material-/Transparenz-Einstellungen) sichtbar ueber den
 *   Inhalt blenden.
 * - ArchitectureFrontGL (Saeulen + Rippen): dynamisch, dreht mit der
 *   Trommel mit (siehe setColumns). Sitzt NACH der Trommel im DOM, liegt
 *   also VOR dem Inhalt - noetig, damit eine Saeule ueberhaupt vor einer
 *   Facette gezeichnet werden KANN. Ob sie es an einer bestimmten Stelle
 *   tatsaechlich tut, entscheidet aber nicht mehr die DOM-Reihenfolge
 *   allein: unsichtbare "Schatten"-Koerper (Kuppel-/Sockelform + eine
 *   Wand-Ebene je Seite, siehe setColumns) sorgen dafuer, dass der WebGL-
 *   Tiefenpuffer Saeulen/Rippen pixelgenau ausblendet, sobald sie hinter
 *   einer Facette oder dem Dach liegen wuerden - echte Verdeckung statt
 *   pauschalem "immer vorne".
 *
 * Beide Layer teilen sich Kamera-Mathematik und Weltkoordinaten (siehe
 * unten), sind aber zwei unabhaengige WebGL-Kontexte/Canvases - fuer die
 * Achte-Geometrie hier vernachlaessigbare Mehrkosten, dafuer strukturell
 * garantiert: nichts vom Dach/Sockel kann je wieder vor den Inhalt geraten.
 *
 * Kamera-Kalibrierung: CSS `perspective: Dpx` mit `perspective-origin: 50%
 * 50%` entspricht einer Kamera im Abstand D (in denselben Pixeln) von der
 * z=0-Ebene, die geradeaus blickt. Vertikales Sichtfeld daraus:
 *   fovDeg = 2 * atan((stageHoehe / 2) / D) * 180/PI
 * Geometrie, die in "CSS-Pixel-Einheiten" platziert wird, landet damit exakt
 * da, wo das CSS-Gegenstueck (Facetten-Trommel) im selben Pixel-Massstab
 * per transform positioniert ist.
 *
 * Saeulen-Position: die Trommel rotiert nicht um den Weltursprung, sondern
 * um einen Punkt bei z = -apothem (das Element `box` traegt selbst
 * translateZ(-apothem), damit seine Frontflaeche auf z = 0 zu liegen kommt -
 * jede Facette/Saeule daran haengt an diesem verschobenen Drehpunkt, nicht
 * am Weltursprung). world_x = colRadius * sin(deg), world_z = colRadius *
 * cos(deg) + pivotZ (pivotZ = -apothem) - exakt dieselbe Rechnung, die vorher
 * die CSS-transform-Kette leistete.
 */

// Palette an das bestehende Seiten-Theme angelehnt (siehe index.css):
// Elfenbein/Creme als Koerper, gedaemptes Messing statt glaenzendem Gold,
// dasselbe Navy wie --foreground, sehr zurueckhaltende Glasfarbe. Gold ist
// hier bewusst NICHT mehr das dominante Material, sondern nur noch duenne
// Zierlinien/Kapitelle - "alt-Geld"-Zurueckhaltung statt Palast.
const IVORY = 0xf2ead9;
const STONE = 0xece1cb;
const STONE_DEEP = 0xd9caa9;
const BRASS = 0xb28f5c;
const BRASS_LIGHT = 0xceac78;
const BRASS_DEEP = 0x7a5f3c;
const NAVY = 0x0c1a32;
const GLASS = 0xf0f1ea;
// Sockel-Marmor: warmes Elfenbein/Creme statt des vorherigen blau-weissen
// Mosaiks - auf Wunsch ein "premium, old money"-Sockel ohne Musterunruhe.
// MARBLE_VEIN ist die sehr zurueckhaltende Aderung darauf, kein Muster.
const QUARTZ = '#f6f4ee';
const QUARTZ_DEEP = '#e6e1d3';
const MARBLE_VEIN = '#a89a80';

// Nur fuer die Saeulen: auf Wunsch zurueck auf den urspruenglichen,
// kraeftigeren Goldton (statt des gedaempften BRASS) - Dach/Gebaelk/Sockel
// bleiben bei der gedaempften Palette, nur die Saeule selbst (und die aus
// ihr herauswachsende Rippe/Kegel) tragen wieder den alten Ton.
const COL_GOLD = 0xc9973a;
const COL_STONE = 0xd9cbaa;

// Sockel-Oberflaeche: heller Elfenbein-Marmor aus konzentrisch angeordneten
// Einzelplatten statt einer durchgehenden Flaeche - liest wie eine echte
// Steinverkleidung aus zugeschnittenen Bloecken, nicht wie ein digitales
// Material. cols laeuft um den Umfang (U, per tex.repeat mehrfach
// wiederholt), rows liegt entlang des Sockelprofils (V, ueber alle drei
// Stufen aus baseLatheProfile hinweg). Nur sehr zurueckhaltende Aderung
// zusaetzlich, keine starken Venen. Per Canvas erzeugt, da keine externen
// Bild-Assets zur Verfuegung stehen.
function buildBaseMarbleTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;

  // Grundflaeche: warmes Elfenbein mit leichtem radialen Verlauf statt
  // reiner Flatcolor - liest als polierter Naturstein, nicht als digitale
  // Flaeche.
  const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.75);
  bgGrad.addColorStop(0, QUARTZ);
  bgGrad.addColorStop(1, QUARTZ_DEEP);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Bloecke: eigene, leicht unterschiedlich helle Platte je Zelle
  // (deterministisch gemischt wie beim fruehereren Mosaik-Raster, kein
  // echter Zufall) plus Fuge (dunkle Kontur) und Fase (helle Kante oben/
  // links, dunkle Kante unten/rechts - simuliert Licht von oben). Die Fase
  // macht jeden Block als eigenen kleinen Koerper mit eigener Schattierung
  // lesbar, nicht nur als gemalte Trennlinie.
  const cols = 6, rows = 6;
  const cw = size / cols, ch = size / rows;
  const palette = [QUARTZ, '#efe6d2', '#e8ddc4', '#f2ead6', '#e3d7bd', '#f6efdf'];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const x0 = gx * cw, y0 = gy * ch;
      const idx = (gx * 3 + gy * 5 + ((gx ^ gy) % 3)) % palette.length;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x0, y0, cw, ch);
    }
  }
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const x0 = gx * cw, y0 = gy * ch;
      ctx.lineWidth = size * 0.006;
      ctx.strokeStyle = 'rgba(110,98,76,0.5)';
      ctx.strokeRect(x0 + ctx.lineWidth / 2, y0 + ctx.lineWidth / 2, cw - ctx.lineWidth, ch - ctx.lineWidth);
      ctx.lineWidth = size * 0.004;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(x0, y0 + ch);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x0 + cw, y0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(80,70,52,0.45)';
      ctx.beginPath();
      ctx.moveTo(x0 + cw, y0);
      ctx.lineTo(x0 + cw, y0 + ch);
      ctx.lineTo(x0, y0 + ch);
      ctx.stroke();
    }
  }

  // Eine Handvoll weicher, unregelmaessiger Adern ueber das gesamte
  // Block-Raster hinweg statt eines Musters -
  // deterministisch (feste Kontrollpunkte, kein echter Zufall), aber in
  // Richtung/Kruemmung variiert genug, um als natuerlicher Stein statt als
  // wiederholtes Motiv zu wirken. ctx.filter (Weichzeichner) macht sie
  // diffus statt hart gezeichnet - echte Marmoradern haben keine scharfe
  // Kante.
  ctx.filter = `blur(${size * 0.01}px)`;
  ctx.strokeStyle = MARBLE_VEIN;
  ctx.lineCap = 'round';
  const veins = [
    [[-40, 120], [260, 60], [520, 260], [860, 140], [1100, 300]],
    [[-60, 640], [220, 720], [480, 560], [780, 700], [1080, 600]],
    [[120, -40], [200, 320], [80, 680], [260, 1000], [180, 1080]],
    [[900, -60], [820, 300], [980, 620], [860, 900], [940, 1100]],
    [[-40, 900], [320, 860], [640, 960], [960, 880], [1100, 940]],
  ];
  veins.forEach((pts, vi) => {
    ctx.globalAlpha = 0.14 - vi * 0.012;
    ctx.lineWidth = size * (0.006 - vi * 0.0006);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    ctx.stroke();
  });
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Acht Landesflaggen, eine je Saeule - auf jedem Kegel oben eine eigene
// (siehe buildDomeRibs/buildFlagMesh). Reihenfolge entspricht der
// Saeulen-Indexreihenfolge (Index 0..7 im Uhrzeigersinn um die Trommel).
// Vereinfachte, aber erkennbare Zeichnungen statt Bild-Assets - per Canvas
// erzeugt wie die Sockel-Textur, da keine externen Bilder zur Verfuegung
// stehen.
const FLAG_CODES = ['DE', 'US', 'CN', 'RU', 'FR', 'JP', 'GB', 'BR'];

function buildFlagTexture(code) {
  const w = 120, h = 80;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const stripesH = (colors) => {
    const bandH = h / colors.length;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, i * bandH, w, bandH + 1);
    });
  };
  const stripesV = (colors) => {
    const bandW = w / colors.length;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * bandW, 0, bandW + 1, h);
    });
  };
  const star = (cx, cy, r) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 4) / 5;
      const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  switch (code) {
    case 'DE':
      stripesH(['#1a1a1a', '#d0132a', '#f2c14e']);
      break;
    case 'US':
      stripesH(Array.from({ length: 13 }, (_, i) => (i % 2 === 0 ? '#b31942' : '#ffffff')));
      ctx.fillStyle = '#0a3161';
      ctx.fillRect(0, 0, w * 0.44, h * 0.54);
      ctx.fillStyle = '#ffffff';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          star(w * 0.06 + c * w * 0.11, h * 0.09 + r * h * 0.17, 2.1);
        }
      }
      break;
    case 'CN':
      ctx.fillStyle = '#de2910';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffde00';
      star(w * 0.16, h * 0.24, 8);
      star(w * 0.32, h * 0.12, 3);
      star(w * 0.38, h * 0.22, 3);
      star(w * 0.38, h * 0.34, 3);
      star(w * 0.32, h * 0.42, 3);
      break;
    case 'RU':
      stripesH(['#ffffff', '#0039a6', '#d52b1e']);
      break;
    case 'FR':
      stripesV(['#0055a4', '#ffffff', '#ef4135']);
      break;
    case 'JP':
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#bc002d';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, h * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'GB': {
      ctx.fillStyle = '#00247d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = h * 0.16;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
      ctx.strokeStyle = '#cf142b';
      ctx.lineWidth = h * 0.07;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = h * 0.26;
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      ctx.strokeStyle = '#cf142b';
      ctx.lineWidth = h * 0.12;
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      break;
    }
    case 'BR':
      ctx.fillStyle = '#009c3b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffdf00';
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.12); ctx.lineTo(w * 0.9, h / 2); ctx.lineTo(w / 2, h * 0.88); ctx.lineTo(w * 0.1, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#002776';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, h * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'UN': {
      // Dunkles Marineblau mit einer "Blue Marble"-Erdkugel in der Mitte
      // (Wolkenwirbel, Kontinent-Flecken) statt des vorherigen schlichten
      // weissen Rings - naeher an der tatsaechlichen UN-Flagge als das
      // reine Emblem-Icon.
      ctx.fillStyle = '#242a5c';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, r = h * 0.32;
      const globeGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      globeGrad.addColorStop(0, '#7fb0e8');
      globeGrad.addColorStop(0.55, '#3d6fa8');
      globeGrad.addColorStop(1, '#1f3f6b');
      ctx.fillStyle = globeGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a26a';
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.15, cy - r * 0.1, r * 0.38, r * 0.26, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.3, cy + r * 0.18, r * 0.2, r * 0.15, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = r * 0.07;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx - r * 0.1, cy + r * 0.25, r * 0.55, 0.2, 1.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + r * 0.25, cy - r * 0.2, r * 0.42, 2.6, 4.1);
      ctx.stroke();
      break;
    }
    default:
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(0, 0, w, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Fahnenmast + Flagge auf der Kegelspitze: die Flagge haengt am Mast in
// tangentialer Richtung (quer zur Fassade, wie an einer echten Gebaeudefront)
// statt radial nach aussen - so bleibt sie aus der ueberwiegend frontalen
// Kamera-Perspektive lesbar, statt sich selbst zu verdecken.
//
// Alles in LOKALEN Koordinaten aufgebaut (Mastfuss = Ursprung), NICHT mehr
// mit tipPt in jeden Vertex eingerechnet - der Aufrufer setzt stattdessen
// `group.position` auf tipPt. Grund: fuer die Wind-Animation (siehe
// setColumns) muss die Flagge um die MAST-Achse rotieren koennen, nicht um
// die weit entfernte Trommel-Achse - das geht nur, wenn der Mastfuss auch
// der tatsaechliche Rotationsursprung (Objektursprung) ist.
function buildFlagMesh(code, tangentDir, scale) {
  const group = new THREE.Group();
  // Deutlich kuerzer als der erste Versuch (1.7 -> 0.6): scale haengt an
  // der Saeulen-/Kapitellbreite, NICHT am vertikalen Hoehenbudget der
  // Buehne - auf einem breiten, kurzen Screen (viel Breite, wenig Hoehe)
  // wurde der Mast dadurch hoeher als die Kuppel selbst und stach oben aus
  // dem Bild heraus. Ein kurzer Stummel auf dem Kegel liest optisch genauso
  // als Fahne, bleibt aber unabhaengig vom Bildschirm-Seitenverhaeltnis im
  // sichtbaren Bereich.
  const poleH = scale * 0.6;
  const poleMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.55, roughness: 0.3 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.045, scale * 0.045, poleH, 8), poleMat);
  pole.position.set(0, poleH / 2, 0);
  group.add(pole);

  // Die Flagge selbst sitzt in einer eigenen Untergruppe, die um die
  // Mastachse (lokales Y bei der Anschlagshoehe) rotiert - der Mast selbst
  // bleibt starr, nur das Tuch weht.
  const flagPivot = new THREE.Group();
  flagPivot.position.set(0, poleH * 0.97, 0);
  group.add(flagPivot);

  // An poleH gebunden (nicht mehr ein von scale unabhaengiger Multiplikator):
  // die Fahne muss innerhalb der kurzen Mast-Hoehe bleiben, sonst haengt ihr
  // unteres Ende unter die Anschlagshoehe hinunter - genau bis in den Kegel
  // hinein, auf dem der Mast steht ("Flagge ist innerhalb des Kegels").
  // 0.8 statt voller poleH*0.97 laesst etwas Luft ueber der Kegelspitze.
  const flagH = poleH * 0.8;
  const flagW = flagH * 1.55;
  const topAttach = new THREE.Vector3(0, 0, 0);
  const topOuter = topAttach.clone().addScaledVector(tangentDir, flagW);
  const botAttach = new THREE.Vector3(0, -flagH, 0);
  const botOuter = topOuter.clone().addScaledVector(new THREE.Vector3(0, 1, 0), -flagH);

  const positions = [
    topAttach.x, topAttach.y, topAttach.z,
    topOuter.x, topOuter.y, topOuter.z,
    botAttach.x, botAttach.y, botAttach.z,
    botOuter.x, botOuter.y, botOuter.z,
  ];
  const uvs = [0, 1, 1, 1, 0, 0, 1, 0];
  const indices = [0, 1, 2, 1, 3, 2];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  // Unlit (MeshBasicMaterial) statt MeshStandardMaterial: eine duenne
  // flache Fahne haengt am Dach weit oben, meist im Schatten des direkten
  // Lichts - mit PBR-Beleuchtung wirkte sie dadurch fast schwarz/unsichtbar.
  // Eine Flagge soll ohnehin flach-farbig wirken, kein Materiallook noetig.
  const flagMat = new THREE.MeshBasicMaterial({
    map: buildFlagTexture(code), side: THREE.DoubleSide,
  });
  const flag = new THREE.Mesh(geo, flagMat);
  flagPivot.add(flag);

  group.userData.mats = [poleMat, flagMat];
  group.userData.flagPivot = flagPivot;
  return group;
}

// Einfache Gradient-Himmel-Umgebung als Reflection-Map - ohne sie hat die
// Kuppel nichts zum Spiegeln und wirkt trotz Glasmaterial nur wie eine
// matte, dunkle Flaeche (besonders die Unterseite, die kaum Direktlicht
// abbekommt). `scene.environment` (nicht `scene.background`!) speist nur
// die Reflexionen der PBR-Materialien, laesst den transparenten Canvas-
// Hintergrund aber unangetastet.
function buildEnvTexture() {
  const w = 64;
  const h = 32;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Warmes, neutrales Tageslicht statt Himmelblau - passt zur restlichen
  // Elfenbein/Stein-Palette und faerbt Kuppel/Marmor nicht kuehl an.
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#f3ecdd');
  grad.addColorStop(0.42, '#f7f2e6');
  grad.addColorStop(0.5, '#fffaf0');
  grad.addColorStop(0.58, '#f1e6cf');
  grad.addColorStop(1, '#cbb98f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addLights(scene, circumRadius, perspectivePx) {
  scene.environment = buildEnvTexture();
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.9));
  const sun = new THREE.DirectionalLight(0xfff8ec, 1.0);
  sun.position.set(circumRadius * 0.6, circumRadius * 1.4, perspectivePx * 0.5);
  scene.add(sun);
  // Warmes Neutralgrau statt Himmelblau: ein kuehler Fill-Ton faerbte
  // Elfenbein/Messing sichtbar kalt an - "warmes, neutrales Tageslicht"
  // statt buntes Studiolicht.
  const fill = new THREE.DirectionalLight(0xe8e0d0, 0.3);
  fill.position.set(-circumRadius, circumRadius * 0.3, perspectivePx * 0.2);
  scene.add(fill);
  // Von unten aufhellend: die Kuppel-Unterseite (die dem Betrachter
  // meist zugewandte Flaeche) zeigt nach unten und bekommt von sun/fill
  // (beide oberhalb) kaum Licht ab - wirkte dadurch dunkel/schmutzig statt
  // wie helles Glas.
  const upfill = new THREE.DirectionalLight(0xf3ead4, 0.45);
  upfill.position.set(circumRadius * 0.3, -circumRadius * 0.8, perspectivePx * 0.4);
  scene.add(upfill);
}

// Kuppelprofil (t = Radiusanteil ab Spitze, yf = Hoehenanteil) - von
// buildDome() (fuer die LatheGeometry-Profilkurve) UND buildDomeRibs()
// (fuer den Kamm-Verlauf) gemeinsam genutzt, damit beide exakt dieselbe
// Kurve zeichnen. Frueher eine stueckweise lineare Kurve durch fuenf feste
// Kontrollpunkte, mit einem ausgepraegt FLACHEN Bereich nahe der Spitze
// (yf aenderte sich von 0.93 auf 1.0 ueber fast ein Drittel des Radius) -
// die Kuppel wirkte dadurch oben abgeflacht/gedeckelt statt kontinuierlich
// bis zur Spitze (und damit bis zur UN-Flagge) anzusteigen. Jetzt eine
// durchgehende Potenzkurve ohne Plateau - der Exponent knapp ueber 1 haelt
// sie nah an einer Geraden (durchgehender Anstieg), mit nur einer sehr
// leichten Rundung am Scheitel selbst.
function domeProfileYFraction(t) {
  return 1 - Math.pow(t, 1.25);
}

// Kuppelhoehe als Anteil des vertikalen Hoehenbudgets - von buildDome,
// buildDomeRibs UND dem unsichtbaren Verdeckungskoerper in
// ArchitectureFrontGL (siehe dort) gemeinsam genutzt, damit alle drei exakt
// dieselbe Kuppel beschreiben.
const DOME_HEIGHT_FRACTION = 0.58;

// Profilkurve fuer buildDome's LatheGeometry UND (mit denselben Argumenten)
// fuer den unsichtbaren Kuppel-Verdeckungskoerper - ein einzelner
// Kontrollpunkt-Satz, damit beide garantiert exakt dieselbe Form haben.
function domeLatheProfile(circumRadius, domeH, steps = 10) {
  const profile = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = i === 0 ? 0.001 : circumRadius * t;
    profile.push(new THREE.Vector2(r, domeH * domeProfileYFraction(t)));
  }
  return profile;
}

// Profilkurve fuer buildBase's LatheGeometry UND fuer den unsichtbaren
// Sockel-Verdeckungskoerper - aus buildBase() herausgezogen, damit beide
// exakt uebereinstimmen.
//
// Echte rechtwinklige Stufen (senkrechter Setzstufen-Abschnitt, dann
// waagerechter Trittstufen-Abschnitt) statt der vorherigen durchgehenden
// Schraeg-Rampe - wie bei einer klassischen Tempel-Krepis (Stylobat). Der
// Unterschied ist kein Stil-Detail: eine schraege Flaeche hat ueberall
// dieselbe, gleichmaessig geneigte Normale und schattiert deshalb auch
// gleichmaessig - liest als eine einzige geneigte Rampe, nicht als
// gestufter Steinsockel. Eine waagerechte Trittstufe (Normale zeigt nach
// oben, faengt Licht von oben) neben einer senkrechten Setzstufe (Normale
// zeigt seitlich, liegt oft im Schlagschatten der Stufe darueber) erzeugt
// den Hell/Dunkel-Kontrast einer echten Treppe automatisch ueber die
// vorhandene Beleuchtung (siehe addLights) - keine gemalte Schattierung
// noetig, nur die richtige Geometrie.
function baseLatheProfile(circumRadius, heightBudget) {
  const topR = circumRadius;
  const botR = circumRadius * 1.65;
  const stepR = (botR - topR) / 3;
  const r1 = topR + stepR;
  const r2 = topR + stepR * 2;
  // Gleiche Gesamthoehe wie die vorherige Rampe (0.13+0.155+0.18 von
  // heightBudget), nur auf drei gleich hohe Setzstufen aufgeteilt - echte
  // Treppenstufen sind gleich hoch, eine aufsteigende Folge wie zuvor
  // (als Rampen-Neigungswinkel gedacht) ergibt hier keinen Sinn mehr.
  const stepY = (heightBudget * (0.13 + 0.155 + 0.18)) / 3;
  const y1 = -stepY;
  const y2 = -stepY * 2;
  const y3 = -stepY * 3;
  return [
    new THREE.Vector2(topR, 0),
    new THREE.Vector2(topR, y1),
    new THREE.Vector2(r1, y1),
    new THREE.Vector2(r1, y2),
    new THREE.Vector2(r2, y2),
    new THREE.Vector2(r2, y3),
    new THREE.Vector2(botR, y3),
    new THREE.Vector2(topR * 0.001, y3),
  ];
}

function buildDome(circumRadius, heightBudget, sides) {
  const group = new THREE.Group();
  // domeH/fasciaH haengen an heightBudget (drumHalfHeight - der
  // tatsaechlichen Wandhoehe), NICHT an circumRadius (der Breite). Vorher
  // haengte die Traufband-Lippe (die bewusst unter den Dachrand ragt) am
  // Radius - auf einem breiten, aber niedrigen Bildschirm (breite Fassade,
  // wenig Hoehe) wurde sie riesig und fraess sich sichtbar in die
  // Anzeigetafel darunter, obwohl die Kuppel selbst gar nicht zu breit war.
  // Noch einmal steiler auf Wunsch (0.46 -> 0.58) - jetzt bewusst ueber der
  // urspruenglichen Zirkuszelt-Hoehe (0.55). Die fruehere "Zirkuszelt"-Kritik
  // galt der Farbe/dem Material, nicht der reinen Hoehe - mit der gedaempften
  // Palette und dem glaesernen Material (siehe domeMat unten) traegt eine
  // steilere Kuppel jetzt eher, wirkt eher wie ein Kuppelbau als wie eine
  // flache Scheibe.
  const domeH = heightBudget * DOME_HEIGHT_FRACTION;
  // Gebaelk/Entablature statt duenner Lippe: haengt bewusst unter den
  // Dachrand (y = 0, die Wandkante) hinein, ist also der einzige Teil der
  // Kuppel, der ueberhaupt in den Bereich der Anzeigetafel hineinragt. Bei
  // zu grossem Wert frisst sie sich auf kurzen/breiten Screens (wenig
  // heightBudget) in die Ueberschrift hinein - 5.5% ist der obere Rand, der
  // dort noch unauffaellig bleibt.
  const fasciaH = heightBudget * 0.055;

  // Ueber domeProfileYFraction abgetastet (10 Stuetzstellen statt der
  // frueheren 5 festen Punkte) - glattere Kurve, und garantiert exakt
  // dieselbe Kruemmung wie der Kamm in buildDomeRibs, der dieselbe Funktion
  // nutzt.
  const domeGeo = new THREE.LatheGeometry(domeLatheProfile(circumRadius, domeH, 10), 64);
  // Kein `transmission`: ohne Environment-Map sampelt MeshPhysicalMaterial
  // dafuer den (leeren) Canvas-Hintergrund und faerbt die Kuppel unkontrolliert.
  // Undurchsichtig: `transparent:true` legte einen hellblauen Schleier ueber
  // alles unter der Kuppel-Silhouette. Der Glas-Eindruck kommt jetzt allein
  // aus Reflexion (envMap, hoher Clearcoat) - reales Glas unter Kunstlicht
  // wirkt ohnehin oft eher spiegelnd-opak. `FrontSide` blendet die von der
  // Kamera abgewandte Rueckseite komplett aus.
  // Wieder deutlich mehr Glanz als die zwischenzeitlich sehr matte Fassung -
  // soll wieder klar nach edlem, poliertem Glas aussehen statt gefrostet.
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: GLASS,
    metalness: 0.08,
    roughness: 0.07,
    transparent: false,
    opacity: 1,
    side: THREE.FrontSide,
    clearcoat: 0.85,
    clearcoatRoughness: 0.06,
    reflectivity: 0.78,
    envMapIntensity: 1.15,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  group.add(dome);

  // Durchgehendes Gebaelk statt duenner Messinglippe: ein klassisches,
  // dreiteiliges Traufband (Messing-Zierlinie / Steinkoerper / Messing-
  // Zierlinie) - traegt das Dach sichtbar auf der Wand ab, ohne dass
  // Messing zur Hauptflaeche wird. Die Steinmasse in der Mitte macht das
  // Ganze strukturell lesbar ("cleaner continuous entablature/ring").
  const trimMat = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.5, roughness: 0.32, side: THREE.DoubleSide });
  const trimTopProfile = [
    new THREE.Vector2(circumRadius * 0.996, 0),
    new THREE.Vector2(circumRadius * 1.02, -fasciaH * 0.09),
    new THREE.Vector2(circumRadius * 1.02, -fasciaH * 0.17),
    new THREE.Vector2(circumRadius * 0.998, -fasciaH * 0.21),
  ];
  const trimTop = new THREE.Mesh(new THREE.LatheGeometry(trimTopProfile, 64), trimMat);
  group.add(trimTop);

  const bandMat = new THREE.MeshStandardMaterial({ color: STONE_DEEP, metalness: 0.04, roughness: 0.78, side: THREE.DoubleSide });
  const bandProfile = [
    new THREE.Vector2(circumRadius * 1.001, -fasciaH * 0.21),
    new THREE.Vector2(circumRadius * 1.032, -fasciaH * 0.56),
    new THREE.Vector2(circumRadius * 1.014, -fasciaH * 0.87),
  ];
  const band = new THREE.Mesh(new THREE.LatheGeometry(bandProfile, 64), bandMat);
  group.add(band);

  const trimBotProfile = [
    new THREE.Vector2(circumRadius * 1.014, -fasciaH * 0.87),
    new THREE.Vector2(circumRadius * 1.014, -fasciaH * 0.93),
    new THREE.Vector2(circumRadius * 0.99, -fasciaH),
  ];
  const trimBot = new THREE.Mesh(new THREE.LatheGeometry(trimBotProfile, 64), trimMat);
  group.add(trimBot);

  // Die fruehere Bekroenung (Stab/Ring/Kugel) hier ersatzlos entfernt: die
  // UN-Flagge (siehe buildDomeRibs, FRONT-Layer, position.y = domeH) sitzt
  // an derselben Stelle und uebernimmt jetzt deren Rolle als Kuppelspitzen-
  // Ornament. Beide gleichzeitig ergaben zwei uebereinanderliegende
  // Stangen - der laengere, statische Stab dieser Bekroenung ragte dabei
  // sichtbar ueber die (viel kuerzere) Flagge hinaus bis zum Buehnenrand.

  return group;
}

// Kegel + zweiseitiger Kamm: auf der Saeulenspitze sitzt jetzt ein
// plastischer Kegel (echtes 3D-Relief statt nur Materialfarbe), aus dem ein
// First mit zwei geneigten Flanken (wie ein schmaler Giebel) zur
// Kuppelspitze hochlaeuft - vorher war das nur ein flaches, taillierendes
// Band ohne eigene Hoehe ("der braune Strich"). Der Kamm folgt der
// Kuppel-Profilkurve EXAKT (dieselben r/y-Werte wie in buildDome) und wird
// nur in der Mitte angehoben, seine beiden Raender bleiben auf der
// Kuppelflaeche - so liegt er ohne Spalt/Durchdringung auf, wirkt aber
// dreidimensional statt flach aufgemalt. Lebt im FRONT-Layer (mit den
// Saeulen), weil er mit ihnen mitdrehen muss - siehe setColumns().
function buildDomeRibs(circumRadius, heightBudget, sides, columnCapWidth) {
  const group = new THREE.Group();
  // Muss exakt mit domeH aus buildDome() uebereinstimmen (siehe Kommentar
  // dort) - sonst driften Kamm und Kuppelflaeche auseinander.
  const domeH = heightBudget * DOME_HEIGHT_FRACTION;
  const capW = columnCapWidth || circumRadius * 0.09;
  const halfAngle = Math.max(0.012, capW / 2 / circumRadius);
  const steps = 14;
  const raise = 1.006; // minimal ueber die Kuppelflaeche angehoben, gegen Z-Fighting
  const pitch = 0.62; // First-Hoehe relativ zur halben Kammbreite - Giebel-Neigung

  // Kegelmasse einmal vorab (gleich fuer jede Saeule): Basis auf dem
  // Kapitell, Spitze coneHeight darueber - der Kamm setzt dort an, nicht an
  // der Traufe.
  const coneRadius = capW * 0.62;
  const coneHeight = capW * 0.95;
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < sides; i++) {
    const beta = (i / sides) * Math.PI * 2;
    const positions = [];
    const indices = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps; // 0 = Kuppelspitze, 1 = Traufe/Saeulenkopf
      const r = t * circumRadius * raise;
      // Laeuft exakt auf der Kuppel-Profilkurve (ueber domeProfileYFraction,
      // DIESELBEN Kontrollpunkte wie buildDome's LatheGeometry-Profil) - von
      // der Traufe (y=0) bis zur Kuppelspitze (y=domeH). Vorher naeherte
      // eine eigene Potenzfunktion (1-t^1.5) die Kurve nur grob an und wich
      // sichtbar von der tatsaechlichen, mehrfach geknickten Kuppelform ab -
      // der Kamm liegt jetzt garantiert exakt auf der Kuppelflaeche.
      const y = domeH * domeProfileYFraction(t);
      const wa = halfAngle * t; // an der Spitze auf einen Punkt zulaufend
      const halfWidthLinear = r * wa;
      const peakY = y + halfWidthLinear * pitch;
      const bL = beta - wa;
      const bR = beta + wa;
      // Drei Punkte je Schritt: linke Flanke, First (angehoben), rechte
      // Flanke - ergibt den "zweiseitigen Kamm" statt eines flachen Bands.
      positions.push(r * Math.sin(bL), y, r * Math.cos(bL));
      positions.push(r * Math.sin(beta), peakY, r * Math.cos(beta));
      positions.push(r * Math.sin(bR), y, r * Math.cos(bR));
      if (s > 0) {
        const pL = (s - 1) * 3, pC = pL + 1, pR = pL + 2;
        const cL = s * 3, cC = cL + 1, cR = cL + 2;
        // linke Flanke
        indices.push(pL, pC, cL, pC, cC, cL);
        // rechte Flanke
        indices.push(pC, pR, cC, pR, cR, cC);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const ridgeMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.6, roughness: 0.28, side: THREE.DoubleSide });
    const ridge = new THREE.Mesh(geo, ridgeMat);

    // Kegel auf der Saeulenspitze: Basis sitzt exakt auf der Saeulenachse
    // (circumRadius OHNE den raise-Faktor, der nur fuer den Kamm auf der
    // Kuppelflaeche gegen Z-Fighting gebraucht wird) - sonst sitzt der
    // Kegel sichtbar neben statt mittig auf der Saeule. Spitze zeigt gerade
    // nach oben, an die Saeulenachse gebunden, nicht an die Kammrichtung.
    const basePt = new THREE.Vector3(
      circumRadius * Math.sin(beta), 0, circumRadius * Math.cos(beta)
    );
    const coneMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.62, roughness: 0.26 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(coneRadius, coneHeight, 20), coneMat);
    cone.position.copy(basePt).addScaledVector(up, coneHeight / 2);

    // Flagge auf der Kegelspitze - tangential zur Fassade ausgerichtet.
    const tipPt = basePt.clone().addScaledVector(up, coneHeight);
    const tangentDir = new THREE.Vector3(Math.cos(beta), 0, -Math.sin(beta));
    const flagCode = FLAG_CODES[i % FLAG_CODES.length];
    const flagGroup = buildFlagMesh(flagCode, tangentDir, capW * 0.9);
    flagGroup.position.copy(tipPt);

    const sideGroup = new THREE.Group();
    sideGroup.add(ridge, cone, flagGroup);
    sideGroup.userData.mats = [ridgeMat, coneMat, ...flagGroup.userData.mats];
    // Fuer die Wind-Animation in setColumns() direkt erreichbar, ohne den
    // Kindpfad (sideGroup -> flagGroup -> flagPivot) jedes Mal abzulaufen.
    sideGroup.userData.flagPivot = flagGroup.userData.flagPivot;
    group.add(sideGroup);
  }

  // UN-Flagge auf der Kuppelspitze, zusaetzlich zu den acht Landesflaggen
  // auf den Saeulen - markiert die Mitte, wo bisher nur die schlichte
  // Bekroenung (Stab/Ring/Kugel aus buildDome) sass. Kein Bezug zu einer
  // Saeule, dreht also nicht mit - nur der eigene Wind-Schwung in
  // setColumns() bewegt sie.
  const unFlag = buildFlagMesh('UN', new THREE.Vector3(1, 0, 0), circumRadius * 0.06);
  unFlag.position.set(0, domeH, 0);
  group.add(unFlag);
  group.userData.unFlagPivot = unFlag.userData.flagPivot;

  return group;
}

// Marmor-Umrandung: deckt genau das Band zwischen der Sockel-Kante
// (circumRadius, dort steht die Saeule mit ihrem Zentrum) und dem
// aeussersten Saeulenrand (Kapitellbreite) ab - liegt flach auf der
// Sockel-Oberflaeche (y = 0 in diesem Koordinatensystem).
function buildBaseRing(circumRadius, columnCapWidth) {
  const group = new THREE.Group();
  // Wieder der grosszuegige Wert (3.5x) - der deckt die vordere/kamera-
  // nahe Saeule sicher komplett ab. Dass das an den seitlichen Raendern zu
  // grosszuegig wirkte, wird jetzt NICHT mehr ueber einen kleineren
  // (kreisrunden) Radius geloest, sondern die Platte am Ende dieser
  // Funktion gezielt links/rechts gestaucht (echte Ellipse) - siehe
  // group.scale.x weiter unten.
  const band = Math.max(columnCapWidth * 3.5, circumRadius * 0.18);
  // Volle Scheibe statt schmalem Ring: `inner` haengt NICHT mehr an band -
  // eine breitere band (fuer eine breitere Aussenkante) hätte sonst auch
  // die Innenkante weiter nach innen gezogen und dort ein Loch aufgerissen,
  // durch das die Mosaik-Fliese direkt am Saeulenfuss sichtbar wurde -
  // genau das Gegenteil von "Saeule komplett auf Weiss".
  const inner = circumRadius * 0.2;
  const outer = circumRadius + band;
  // Echte Stufe statt nur eines Z-Fighting-Lifts: die Marmor-Umrandung lag
  // vorher nur 0.1% ueber der Fliese (rein numerisch gegen Z-Fighting
  // gedacht) - optisch ein nahtloser Sprung ohne erkennbare Stufe. Jetzt
  // sichtbar angehoben, mit einer kurzen Zylinderwand (Riser) an beiden
  // Kanten, die die Platte mit dem Fliesenboden darunter verbindet.
  const stepH = circumRadius * 0.012;
  const geo = new THREE.RingGeometry(inner, outer, 64, 1);
  // Deutlich heller/reiner Weiss als der cremefarbene Fliesengrund, mit
  // Glanz statt Kachelmuster - sonst verschwimmt die "Umrandung" optisch
  // mit dem Fliesenfeld statt sich abzuheben.
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xfbfaf6,
    metalness: 0.02,
    roughness: 0.12,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = stepH;
  group.add(ring);

  // Riser: kurze, blickdichte Zylinderwand an Innen- und Aussenkante -
  // macht den Hoehenversatz als echte Stufe sichtbar statt als Sprung.
  [inner, outer].forEach((r) => {
    const riserGeo = new THREE.CylinderGeometry(r, r, stepH, 64, 1, true);
    const riserMat = new THREE.MeshStandardMaterial({ color: 0xefece2, metalness: 0.03, roughness: 0.4, side: THREE.DoubleSide });
    const riser = new THREE.Mesh(riserGeo, riserMat);
    riser.position.y = stepH / 2;
    group.add(riser);
  });

  // Duenne Goldkanten an beiden Raendern der Marmor-Umrandung, jetzt an
  // der Stufenoberkante - grenzt sie klar vom Fliesenfeld ab.
  [inner, outer].forEach((r) => {
    const edgeGeo = new THREE.TorusGeometry(r, circumRadius * 0.0025, 8, 64);
    const edgeMat = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.55, roughness: 0.3 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = stepH;
    group.add(edge);
  });

  // Rundes Massband, aber bewusst zur echten Ellipse gestaucht: links/
  // rechts (Weltachse X, dort stehen die seitlichen Saeulen) enger als
  // vorne/hinten (Z, dort steht die kameranahe Saeule und braucht die
  // volle Breite von band). Ein einzelner Kreisradius konnte wegen der
  // Perspektive nie beides gleichzeitig treffen - die Stauchung loest das,
  // ohne den grosszuegigen band-Wert fuer die Front aufzugeben. 0.78 war zu
  // aggressiv - liess Saeulen bei mittleren Winkeln (nicht ganz vorne, nicht
  // ganz seitlich) wieder ueber den Rand hinausragen. 0.9 ist zurueckhaltender.
  group.scale.x = 0.9;

  return group;
}

function buildBase(circumRadius, heightBudget, columnCapWidth) {
  const group = new THREE.Group();
  // topR = circumRadius (hier: der Ring-Radius, exakt derselbe wie bei den
  // Saeulen) statt vorher *0.93 - die Plattformkante muss exakt dort
  // sitzen, wo die Saeulenfuesse ankommen, nicht knapp daneben.
  const topR = circumRadius;
  // Weiter nach aussen gerueckt (1.18/1.38 -> 1.65 als aeusserste Kante), um
  // Platz fuer eine deutlich breitere weisse Marmorflaeche zu schaffen
  // (siehe buildBaseRing) - eine Saeule nahe der Kamera wirkt durch die
  // Perspektive groesser projiziert als eine seitliche, brauchte also mehr
  // radialen Puffer, als die vorherigen, engeren Stufen hergaben. Dieselben
  // Werte wie in baseLatheProfile() - siehe dort fuer die eigentliche
  // Stufen-Geometrie (echte Setz-/Trittstufen statt Rampe).
  const botR = circumRadius * 1.65;
  const stepR = (botR - topR) / 3;
  const r1 = topR + stepR;
  const r2 = topR + stepR * 2;
  const stepY = (heightBudget * (0.13 + 0.155 + 0.18)) / 3;
  const y1 = -stepY;
  const y2 = -stepY * 2;
  const y3 = -stepY * 3;

  const geo = new THREE.LatheGeometry(baseLatheProfile(circumRadius, heightBudget), 64);
  // Glatter Elfenbein-Marmor statt des vorherigen blau-weissen Mosaiks -
  // siehe buildBaseMarbleTexture().
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: buildBaseMarbleTexture(),
    metalness: 0.05,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  group.add(new THREE.Mesh(geo, mat));

  // Goldkante am Plattformrand.
  const rimGeo = new THREE.TorusGeometry(topR, circumRadius * 0.006, 10, 64);
  const rimMat = new THREE.MeshStandardMaterial({ color: BRASS_LIGHT, metalness: 0.6, roughness: 0.25 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // Marmor-Umrandung um die Saeulenfuesse, edler als das nackte Fliesenfeld.
  group.add(buildBaseRing(topR, columnCapWidth || circumRadius * 0.1));

  // Dezente Messinglinie an der Vorderkante jeder Trittstufe (wo Tritt- auf
  // Setzstufe trifft) - markiert die beiden inneren Stufenkanten klar, ohne
  // dass Messing die Flaeche dominiert. Bei drei echten Stufen (siehe
  // baseLatheProfile) liest eine einzelne Kante nicht mehr als "die
  // Sockelstufe", sondern es braucht eine je Absatz.
  const stepEdgeMat = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.7 });
  [[r1, y1], [r2, y2]].forEach(([r, y]) => {
    const edge = new THREE.Mesh(new THREE.TorusGeometry(r, circumRadius * 0.003, 8, 64), stepEdgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = y;
    group.add(edge);
  });

  // Aeusserste Plattformkante: duenner Navy-Ring statt Messing - fasst die
  // gesamte Sockel-Silhouette klar ein, ohne dass noch mehr Messing die
  // Flaeche dominiert ("very thin navy... ring can define the outer edge").
  const botEdge = new THREE.Mesh(
    new THREE.TorusGeometry(botR, circumRadius * 0.0022, 8, 64),
    new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.15, roughness: 0.4 })
  );
  botEdge.rotation.x = Math.PI / 2;
  botEdge.position.y = y3;
  group.add(botEdge);

  return group;
}

// Eine Saeule: Kapitell (oben), Schaft, Basis (unten) - rotationssymmetrisch,
// daher genuegt ein Cylinder statt der frueheren CSS-Gradient-Attrappe fuer
// den Rundungs-Eindruck. Echtes Licht (siehe addLights) uebernimmt die
// Schattierung, die vorher per Hand als Farbverlauf nachgestellt wurde.
// totalHeight ist die volle Spanne, die die Saeule (Schaft + beide Kappen
// zusammen) einnehmen darf - exakt drumHalfHeight*2, damit ihr Fuss genau
// auf der Sockel-Oberkante (y = -drumHalfHeight) beginnt und ihre Spitze
// genau dort endet, wo die Kuppel ansetzt (y = +drumHalfHeight). Schaft und
// Kappen frueher addiert statt aufgeteilt liessen die Saeule oben in die
// Kuppel hinein- und unten durch den Sockel hindurchragen.
function buildColumn(colWidth, colCapWidth, colCapHeight, totalHeight) {
  const group = new THREE.Group();
  const shaftHeight = Math.max(1, totalHeight - colCapHeight * 2);
  const shaftMat = new THREE.MeshStandardMaterial({ color: COL_STONE, metalness: 0.05, roughness: 0.5 });
  const capMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.5, roughness: 0.3 });

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(colWidth / 2, colWidth / 2, shaftHeight, 24), shaftMat);
  group.add(shaft);

  const capTop = new THREE.Mesh(
    new THREE.CylinderGeometry(colCapWidth / 2, colWidth / 2, colCapHeight, 24),
    capMat
  );
  capTop.position.y = shaftHeight / 2 + colCapHeight / 2;
  group.add(capTop);

  const capBottom = new THREE.Mesh(
    new THREE.CylinderGeometry(colWidth / 2, colCapWidth / 2, colCapHeight, 24),
    capMat
  );
  capBottom.position.y = -shaftHeight / 2 - colCapHeight / 2;
  group.add(capBottom);

  group.userData.mats = [shaftMat, capMat];
  return group;
}

function makeCamera(stageW, stageH, perspectivePx) {
  const fovRad = 2 * Math.atan(stageH / 2 / perspectivePx);
  const camera = new THREE.PerspectiveCamera((fovRad * 180) / Math.PI, stageW / stageH, 1, perspectivePx * 3);
  camera.position.set(0, 0, perspectivePx);
  camera.lookAt(0, 0, 0);
  return camera;
}

function makeRenderer(stageW, stageH, container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(stageW, stageH);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  container.appendChild(renderer.domElement);
  return renderer;
}

function disposeScene(scene, renderer, container) {
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
  if (renderer.domElement.parentNode === container) {
    container.removeChild(renderer.domElement);
  }
  renderer.dispose();
}

// Dach + Sockel: statisch, dreht nicht mit. Muss im DOM VOR der
// Facetten-Trommel stehen (siehe RotaryStage) - liegt damit HINTER dem
// Inhalt, der ihn so immer vollstaendig verdeckt, egal was auf dieser
// Ebene passiert.
export const ArchitectureBackGL = React.memo(function ArchitectureBackGL({
  stageW, stageH, perspectivePx, ringRadius, drumHalfHeight, centerOffsetZ = 0, sides = 8, colCapWidth,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !stageW || !stageH || !ringRadius) return;

    const scene = new THREE.Scene();
    const camera = makeCamera(stageW, stageH, perspectivePx);
    const renderer = makeRenderer(stageW, stageH, container);
    addLights(scene, ringRadius, perspectivePx);

    const dome = buildDome(ringRadius, drumHalfHeight, sides);
    dome.position.set(0, drumHalfHeight, centerOffsetZ);
    scene.add(dome);

    const base = buildBase(ringRadius, drumHalfHeight, colCapWidth);
    base.position.set(0, -drumHalfHeight, centerOffsetZ);
    scene.add(base);

    renderer.render(scene, camera);

    return () => disposeScene(scene, renderer, container);
  }, [stageW, stageH, perspectivePx, ringRadius, drumHalfHeight, centerOffsetZ, sides, colCapWidth]);

  return (
    <div
      ref={containerRef}
      data-architecture-gl="back"
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
});

// Saeulen + Rippen: dreht mit der Trommel mit. Muss im DOM NACH der
// Facetten-Trommel stehen - liegt damit VOR dem Inhalt, das ist hier
// beabsichtigt: Saeulen markieren die Nahtstelle zwischen zwei Facetten und
// muessen dort sichtbar bleiben, auch wenn die Facette direkt dahinter liegt.
const ArchitectureFrontGL = forwardRef(function ArchitectureFrontGL(
  { stageW, stageH, perspectivePx, ringRadius, drumHalfHeight, centerOffsetZ = 0, sides = 8, colWidth, colCapWidth, colCapHeight },
  ref
) {
  const containerRef = useRef(null);
  const stateRef = useRef({});

  useImperativeHandle(ref, () => ({
    // Von RotaryStage bei jedem Tick aufgerufen (gsap-Ticker, ~60fps) - mit
    // denselben live berechneten Werten, die vorher direkt auf die CSS-
    // Saeulen-transforms geschrieben wurden. degs: Grad je Saeule (gleiche
    // Formel wie zuvor: kuerzesterWeg(p - s + 0.5) * step). apothem/faceDegs:
    // dieselbe Rechnung wie fuer die Huelle (shellRefs) in RotaryStage - ein
    // Winkel je Seite, an derselben Stelle wie die Inhaltsflaeche/Huelle.
    //
    // Sichtbarkeit ueber ECHTE Tiefenpruefung statt Winkel-Cutoff oder
    // manuellem Ein-/Ausblenden: Saeulen und Rippen bleiben immer `visible`
    // und werden einfach jeden Frame an ihre Weltposition gesetzt - der
    // WebGL-Tiefenpuffer entscheidet pixelgenau, was sichtbar bleibt, GENAU
    // wie bei jedem anderen 3D-Koerper. Zwei Gruppen unsichtbarer
    // "Schatten"-Koerper sorgen dafuer, dass das nicht nur zwischen Saeulen
    // untereinander funktioniert, sondern auch gegen die Waende (Inhalt) und
    // das Dach: eine Kopie der Kuppel-/Sockelform (siehe Mount-Effekt, baut
    // nur Tiefe, keine Farbe) und pro Seite eine Wand-Ebene an derselben
    // Position wie die jeweilige Inhaltsflaeche/Huelle. Eine Saeule oder
    // Rippe, die hinter einer dieser unsichtbaren Formen liegt, faellt beim
    // Tiefentest durch und wird dort einfach nicht gezeichnet - der
    // durchsichtige Canvas-Hintergrund gibt an genau dieser Stelle die
    // dahinterliegende (in Wahrheit naehere) Flaeche/Kuppel frei. Kein
    // Despawn, kein Verblassen, kein Neigungs-Grenzwert - nur echte
    // Verdeckung, pixelgenau statt objektweise.
    setColumns(degs, colRadius, pivotZ, apothem, faceDegs) {
      const { columns, ribs, walls, renderer, scene, camera } = stateRef.current;
      if (!columns || !renderer) return;
      const step = 360 / sides;
      const t = performance.now() / 1000;

      columns.forEach((col, s) => {
        const deg = degs[s] ?? 0;
        const rad = (deg * Math.PI) / 180;
        col.position.set(-colRadius * Math.sin(rad), 0, colRadius * Math.cos(rad) + pivotZ);

        // Zugehoerige Rippe (gleicher Index s, siehe buildDomeRibs) im
        // selben Takt mitdrehen.
        const rib = ribs?.children[s];
        if (rib) {
          // Rippen-Basiswinkel: Rippe k wurde in buildDomeRibs bei
          // beta = k*step (in Grad) aufgebaut, mit x=+r*sin(beta). Die
          // Saeule dagegen nutzt x=-colRadius*sin(deg) - ENTGEGENGESETZTES
          // Vorzeichen. Die noetige Zielausrichtung fuer die Rippe ist
          // deshalb beta=-deg (numerisch verifiziert).
          rib.rotation.y = ((-deg - s * step) * Math.PI) / 180;
          const flagPivot = rib.userData.flagPivot;
          if (flagPivot) {
            // Wind-Animation: Grund-Schwingung plus kleinere, schnellere
            // Flatterbewegung, je Saeule phasenverschoben (sonst wehen alle
            // acht Flaggen synchron).
            const phase = s * 1.3;
            flagPivot.rotation.y = Math.sin(t * 1.6 + phase) * 0.18 + Math.sin(t * 4.1 + phase * 1.7) * 0.06;
          }
        }
      });

      // Unsichtbare Wand-Ebenen: eine je Seite, exakt an der Position/
      // Ausrichtung der jeweiligen Inhaltsflaeche/Huelle (dieselbe Formel
      // wie fuer Saeulen oben, nur mit apothem statt colRadius und ohne den
      // 0.5-Schritt-Versatz). edgeLen ist die tatsaechliche Kantenlaenge des
      // Vielecks bei diesem Apothem (Umkehrung von bodyRadius in
      // RotaryStage).
      if (walls) {
        const edgeLen = 2 * apothem * Math.tan(Math.PI / sides);
        walls.forEach((wall, s) => {
          const deg = faceDegs?.[s] ?? 0;
          const rad = (deg * Math.PI) / 180;
          wall.position.set(-apothem * Math.sin(rad), 0, apothem * Math.cos(rad) + pivotZ);
          wall.rotation.y = -rad;
          wall.scale.set(edgeLen, drumHalfHeight * 2, 1);
        });
      }

      // UN-Flagge auf der Kuppelspitze: eigener Wind-Schwung, unabhaengig
      // von den Saeulen-Phasen (kein s-Index vorhanden).
      const unFlagPivot = ribs?.userData.unFlagPivot;
      if (unFlagPivot) {
        unFlagPivot.rotation.y = Math.sin(t * 1.6 + 4.2) * 0.18 + Math.sin(t * 4.1 + 7.1) * 0.06;
      }
      renderer.render(scene, camera);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !stageW || !stageH || !ringRadius) return;

    const scene = new THREE.Scene();
    const camera = makeCamera(stageW, stageH, perspectivePx);
    const renderer = makeRenderer(stageW, stageH, container);
    addLights(scene, ringRadius, perspectivePx);

    // Rippen sitzen an derselben Stelle, an der (im Back-Layer) der Dach-
    // Ansatz waere - selbe Position wie dort `dome.position` gesetzt wird,
    // nur hier ohne die Kuppel selbst.
    const ribs = buildDomeRibs(ringRadius, drumHalfHeight, sides, colCapWidth);
    ribs.position.set(0, drumHalfHeight, centerOffsetZ);
    scene.add(ribs);

    const columns = [];
    if (colWidth) {
      for (let s = 0; s < sides; s++) {
        const col = buildColumn(colWidth, colCapWidth, colCapHeight, drumHalfHeight * 2);
        scene.add(col);
        columns.push(col);
      }
    }

    // Unsichtbare "Schatten"-Koerper: schreiben nur in den Tiefenpuffer
    // (colorWrite: false), zeichnen also selbst nie Farbe - sorgen aber
    // dafuer, dass Saeulen/Rippen, die dahinter liegen, beim Tiefentest
    // durchfallen (siehe setColumns). DoubleSide, damit die Tiefe
    // unabhaengig von der Blickrichtung auf die Flaeche entsteht.
    //
    // WICHTIG: renderOrder auf diesen Meshes (siehe unten, -1) ist kein
    // Detail, sondern die Voraussetzung dafuer, dass das ueberhaupt
    // funktioniert. colorWrite:false schreibt NUR Tiefe - es kann keine
    // bereits gezeichnete Saeulen-Farbe im Nachhinein wieder loeschen. Faellt
    // eine Saeule VOR ihrem Verdeckungskoerper in der Zeichenreihenfolge,
    // steht ihre Farbe schon im Puffer, wenn der (dann zu spaete)
    // Tiefen-Test des Verdeckungskoerpers laeuft - der aktualisiert dann nur
    // noch die Tiefe, die Saeule bleibt sichtbar stehen. Alle Meshes hier
    // sind opak (kein transparent:true mehr, seit auch Saeulen/Rippen
    // wieder undurchsichtig sind) und landen damit in DERSELBEN Three.js-
    // Renderqueue wie Saeulen/Rippen - die Queue sortiert dort NICHT
    // verlaesslich nach Tiefe (anders als die fruehere TRANSPARENT-Queue),
    // sondern u.a. nach Material/Programm. Nur ein expliziter, niedrigerer
    // renderOrder erzwingt "Verdeckungskoerper zuerst".
    const occMat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });

    // Kuppel- und Sockelform als Verdeckungskoerper: dieselbe Profilkurve
    // wie im Back-Layer (buildDome/buildBase, siehe domeLatheProfile/
    // baseLatheProfile), nur ohne Material/Rippen-Details - eine Saeule/
    // Rippe auf der Gebaeuderueckseite, die hinter der eigentlichen (im
    // Back-Layer sichtbaren) Kuppel-/Sockelflaeche liegt, wird dadurch
    // korrekt verdeckt statt ueber sie hinweg gezeichnet.
    const domeOcc = new THREE.Mesh(
      new THREE.LatheGeometry(domeLatheProfile(ringRadius, drumHalfHeight * DOME_HEIGHT_FRACTION, 10), 48),
      occMat
    );
    domeOcc.position.set(0, drumHalfHeight, centerOffsetZ);
    domeOcc.renderOrder = -1;
    scene.add(domeOcc);

    const baseOcc = new THREE.Mesh(
      new THREE.LatheGeometry(baseLatheProfile(ringRadius, drumHalfHeight), 48),
      occMat
    );
    baseOcc.position.set(0, -drumHalfHeight, centerOffsetZ);
    baseOcc.renderOrder = -1;
    scene.add(baseOcc);

    // Eine Wand-Ebene je Seite, an derselben Stelle wie die jeweilige
    // Inhaltsflaeche/Huelle (siehe RotaryStage: shellRefs/faceRefs) - deckt
    // eine Saeule/Rippe ab, sobald eine Facette naeher an der Kamera steht.
    // Position/Skalierung werden jeden Frame in setColumns() gesetzt (dort
    // stehen die aktuellen Drehwinkel zur Verfuegung); hier nur einmalig
    // angelegt.
    const wallGeo = new THREE.PlaneGeometry(1, 1);
    const walls = Array.from({ length: sides }, () => {
      const wall = new THREE.Mesh(wallGeo, occMat);
      wall.renderOrder = -1;
      scene.add(wall);
      return wall;
    });

    renderer.render(scene, camera);
    stateRef.current = { renderer, scene, camera, columns, ribs, walls };

    return () => {
      disposeScene(scene, renderer, container);
      stateRef.current = {};
    };
  }, [stageW, stageH, perspectivePx, ringRadius, drumHalfHeight, centerOffsetZ, sides, colWidth, colCapWidth, colCapHeight]);

  return (
    <div
      ref={containerRef}
      data-architecture-gl="front"
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
});

export default ArchitectureFrontGL;
