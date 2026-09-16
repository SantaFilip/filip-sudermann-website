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
 *   also VOR dem Inhalt - das ist beabsichtigt: Saeulen markieren die
 *   Nahtstelle zwischen zwei Facetten und muessen dort immer sichtbar
 *   bleiben, auch wenn die Facette direkt dahinter liegt.
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
const TILE_LINE = '#c9b78e';
const TILE_ACCENT = '#a9895a';
const TILE_BASE = '#efe6d2';

// Nur fuer die Saeulen: auf Wunsch zurueck auf den urspruenglichen,
// kraeftigeren Goldton (statt des gedaempften BRASS) - Dach/Gebaelk/Sockel
// bleiben bei der gedaempften Palette, nur die Saeule selbst (und die aus
// ihr herauswachsende Rippe/Kegel) tragen wieder den alten Ton.
const COL_GOLD = 0xc9973a;
const COL_STONE = 0xd9cbaa;

// Sockel-Textur: grossformatige Kalkstein-Platten mit feinen Fugenlinien
// und einer sehr zurueckhaltenden Messing-Raute an jeder Kreuzung - wie ein
// Empfangshallen-Boden, nicht wie ein Fliesenmuster. Alles in engen,
// hellen Steintoenen (kein Blau, kein starker Kontrast) - das Muster soll
// sich erst bei genauerem Hinsehen zeigen, nicht dominieren. Per Canvas
// erzeugt, da keine externen Bild-Assets zur Verfuegung stehen.
function buildTileTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;

  // Grundflaeche mit sehr leichtem radialen Verlauf statt reiner Flatcolor -
  // liest als natuerlicher Kalkstein, nicht als digitale Flaeche.
  const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.75);
  bgGrad.addColorStop(0, TILE_BASE);
  bgGrad.addColorStop(1, '#e6dabd');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Grossformatige Plattenfugen: ein einfaches Raster, duenne Linie, kaum
  // sichtbar - deutet grosse Steinplatten an statt kleiner Kacheln.
  const grid = size / 4;
  ctx.strokeStyle = TILE_LINE;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = size * 0.0028;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * grid, 0);
    ctx.lineTo(i * grid, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * grid);
    ctx.lineTo(size, i * grid);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Feine Messing-Raute an jeder Fugenkreuzung - die einzige Zierde, sehr
  // klein und zart, wie eine Intarsie in echtem Naturstein.
  ctx.fillStyle = TILE_ACCENT;
  ctx.globalAlpha = 0.55;
  const r = size * 0.01;
  for (let gy = 0; gy <= 4; gy++) {
    for (let gx = 0; gx <= 4; gx++) {
      const cx = gx * grid;
      const cy = gy * grid;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 1.1);
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
function buildFlagMesh(code, tipPt, tangentDir, scale) {
  const group = new THREE.Group();
  const poleH = scale * 1.7;
  const poleMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.55, roughness: 0.3, transparent: true });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.045, scale * 0.045, poleH, 8), poleMat);
  pole.position.copy(tipPt).addScaledVector(new THREE.Vector3(0, 1, 0), poleH / 2);
  group.add(pole);

  const flagW = scale * 1.35 * 1.8;
  const flagH = scale * 0.9 * 1.8;
  const topAttach = tipPt.clone().addScaledVector(new THREE.Vector3(0, 1, 0), poleH * 0.97);
  const topOuter = topAttach.clone().addScaledVector(tangentDir, flagW);
  const botAttach = topAttach.clone().addScaledVector(new THREE.Vector3(0, 1, 0), -flagH);
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
  group.add(flag);

  group.userData.mats = [poleMat, flagMat];
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

function buildDome(circumRadius, heightBudget, sides) {
  const group = new THREE.Group();
  // domeH/fasciaH haengen an heightBudget (drumHalfHeight - der
  // tatsaechlichen Wandhoehe), NICHT an circumRadius (der Breite). Vorher
  // haengte die Traufband-Lippe (die bewusst unter den Dachrand ragt) am
  // Radius - auf einem breiten, aber niedrigen Bildschirm (breite Fassade,
  // wenig Hoehe) wurde sie riesig und fraess sich sichtbar in die
  // Anzeigetafel darunter, obwohl die Kuppel selbst gar nicht zu breit war.
  // Etwas steiler als die vorherige, sehr flache Fassung (0.36), aber
  // immer noch deutlich unter der urspruenglichen Zirkuszelt-Hoehe (0.55) -
  // "premium atrium dome" mit spuerbarer Woelbung statt platter Scheibe.
  const domeH = heightBudget * 0.46;
  // Gebaelk/Entablature statt duenner Lippe: haengt bewusst unter den
  // Dachrand (y = 0, die Wandkante) hinein, ist also der einzige Teil der
  // Kuppel, der ueberhaupt in den Bereich der Anzeigetafel hineinragt. Bei
  // zu grossem Wert frisst sie sich auf kurzen/breiten Screens (wenig
  // heightBudget) in die Ueberschrift hinein - 5.5% ist der obere Rand, der
  // dort noch unauffaellig bleibt.
  const fasciaH = heightBudget * 0.055;

  const profile = [
    new THREE.Vector2(0.001, domeH),
    new THREE.Vector2(circumRadius * 0.32, domeH * 0.93),
    new THREE.Vector2(circumRadius * 0.62, domeH * 0.72),
    new THREE.Vector2(circumRadius * 0.86, domeH * 0.38),
    new THREE.Vector2(circumRadius, 0),
  ];
  const domeGeo = new THREE.LatheGeometry(profile, 64);
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

  // Bekroenung: schlanke Laterne mit Ring, sehr kompakt.
  const finialGroup = new THREE.Group();
  const poleH = domeH * 0.55;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(circumRadius * 0.006, circumRadius * 0.006, poleH, 12),
    new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.6, roughness: 0.3 })
  );
  pole.position.y = domeH + poleH / 2;
  finialGroup.add(pole);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(circumRadius * 0.028, circumRadius * 0.006, 12, 24),
    new THREE.MeshStandardMaterial({ color: BRASS_LIGHT, metalness: 0.6, roughness: 0.25 })
  );
  ring.position.y = domeH + poleH + circumRadius * 0.028;
  ring.rotation.x = Math.PI / 2;
  finialGroup.add(ring);
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(circumRadius * 0.012, 16, 16),
    new THREE.MeshStandardMaterial({ color: BRASS_DEEP, metalness: 0.5, roughness: 0.4 })
  );
  orb.position.y = ring.position.y;
  finialGroup.add(orb);
  group.add(finialGroup);

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
  const domeH = heightBudget * 0.46;
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
      const t = s / steps; // 0 = Kuppelspitze, 1 = Kegelspitze (Traufe-Ende)
      const r = t * circumRadius * raise;
      // Hoehe laeuft nicht mehr von 0 (Traufe) bis domeH, sondern von
      // coneHeight (Kegelspitze) bis domeH (Kuppelspitze) - "von der
      // Kegelspitze aus soll der Rahmen des Dachs beginnen". Bei t=1 landet
      // das exakt auf der Kegelspitze (r=circumRadius, y=coneHeight), bei
      // t=0 weiterhin exakt auf dem Kuppelscheitel.
      const y = coneHeight + (domeH - coneHeight) * (1 - Math.pow(t, 1.5));
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
    // Eigenes Material je Kamm (nicht geteilt): jeder Kamm muss unabhaengig
    // ein-/ausgeblendet werden koennen, synchron mit seiner Saeule (siehe
    // setColumns) - sonst wuerde ein Kamm ohne zugehoerige, laengst
    // ausgeblendete Saeule weiter voll sichtbar in der Luft haengen.
    const ridgeMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.6, roughness: 0.28, side: THREE.DoubleSide, transparent: true });
    const ridge = new THREE.Mesh(geo, ridgeMat);

    // Kegel auf der Saeulenspitze: Basis sitzt exakt auf der Saeulenachse
    // (circumRadius OHNE den raise-Faktor, der nur fuer den Kamm auf der
    // Kuppelflaeche gegen Z-Fighting gebraucht wird) - sonst sitzt der
    // Kegel sichtbar neben statt mittig auf der Saeule. Spitze zeigt gerade
    // nach oben, an die Saeulenachse gebunden, nicht an die Kammrichtung.
    const basePt = new THREE.Vector3(
      circumRadius * Math.sin(beta), 0, circumRadius * Math.cos(beta)
    );
    const coneMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.62, roughness: 0.26, transparent: true });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(coneRadius, coneHeight, 20), coneMat);
    cone.position.copy(basePt).addScaledVector(up, coneHeight / 2);

    // Flagge auf der Kegelspitze - tangential zur Fassade ausgerichtet.
    const tipPt = basePt.clone().addScaledVector(up, coneHeight);
    const tangentDir = new THREE.Vector3(Math.cos(beta), 0, -Math.sin(beta));
    const flagCode = FLAG_CODES[i % FLAG_CODES.length];
    const flagGroup = buildFlagMesh(flagCode, tipPt, tangentDir, capW * 0.9);

    const sideGroup = new THREE.Group();
    sideGroup.add(ridge, cone, flagGroup);
    sideGroup.userData.mats = [ridgeMat, coneMat, ...flagGroup.userData.mats];
    group.add(sideGroup);
  }

  return group;
}

// Marmor-Umrandung: deckt genau das Band zwischen der Sockel-Kante
// (circumRadius, dort steht die Saeule mit ihrem Zentrum) und dem
// aeussersten Saeulenrand (Kapitellbreite) ab - liegt flach auf der
// Sockel-Oberflaeche (y = 0 in diesem Koordinatensystem).
function buildBaseRing(circumRadius, columnCapWidth) {
  const group = new THREE.Group();
  const band = Math.max(columnCapWidth * 1.2, circumRadius * 0.065);
  const inner = Math.max(0.01, circumRadius - band);
  const outer = circumRadius + band;
  const lift = circumRadius * 0.001; // sichtbar ueber der Fliese, gegen Z-Fighting
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
  ring.position.y = lift;
  group.add(ring);

  // Duenne Goldkanten an beiden Raendern der Marmor-Umrandung - grenzt sie
  // klar vom Fliesenfeld ab, statt nur uebers Material zu wirken.
  [inner, outer].forEach((r) => {
    const edgeGeo = new THREE.TorusGeometry(r, circumRadius * 0.0025, 8, 64);
    const edgeMat = new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.55, roughness: 0.3 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = lift;
    group.add(edge);
  });

  return group;
}

function buildBase(circumRadius, heightBudget, columnCapWidth) {
  const group = new THREE.Group();
  // topR = circumRadius (hier: der Ring-Radius, exakt derselbe wie bei den
  // Saeulen) statt vorher *0.93 - die Plattformkante muss exakt dort
  // sitzen, wo die Saeulenfuesse ankommen, nicht knapp daneben.
  const topR = circumRadius;
  const midR = circumRadius * 1.18;
  const botR = circumRadius * 1.38;
  // Stufenhoehen an heightBudget (drumHalfHeight) gebunden, nicht an
  // circumRadius - siehe Kommentar in buildDome zur selben Falle bei der
  // Traufband-Lippe.
  const tier1 = heightBudget * 0.13;
  const tier2 = heightBudget * 0.155;
  const tier3 = heightBudget * 0.18;

  const profile = [
    new THREE.Vector2(topR, 0),
    new THREE.Vector2(topR, -tier1 * 0.7),
    new THREE.Vector2(midR, -tier1),
    new THREE.Vector2(midR, -tier1 - tier2 * 0.7),
    new THREE.Vector2(botR, -tier1 - tier2),
    new THREE.Vector2(botR, -tier1 - tier2 - tier3),
    new THREE.Vector2(topR * 0.001, -tier1 - tier2 - tier3),
  ];
  const geo = new THREE.LatheGeometry(profile, 64);
  // Antikes griechisch-chinesisches Fliesenmuster (Maeander auf Creme,
  // blaue Kachelfelder) statt reinem Ivory-Ton - siehe buildTileTexture().
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: buildTileTexture(),
    metalness: 0.05,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  group.add(new THREE.Mesh(geo, mat));

  // Navy-Kragen an der obersten Stufe, wo die Saeulen stehen.
  const collarGeo = new THREE.CylinderGeometry(topR * 1.002, topR * 1.002, tier1 * 0.5, 64, 1, true);
  const collarMat = new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.1, roughness: 0.6, side: THREE.DoubleSide });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.y = -tier1 * 0.25;
  group.add(collar);

  // Goldkante am Plattformrand.
  const rimGeo = new THREE.TorusGeometry(topR, circumRadius * 0.006, 10, 64);
  const rimMat = new THREE.MeshStandardMaterial({ color: BRASS_LIGHT, metalness: 0.6, roughness: 0.25 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // Marmor-Umrandung um die Saeulenfuesse, edler als das nackte Fliesenfeld.
  group.add(buildBaseRing(topR, columnCapWidth || circumRadius * 0.1));

  // Mittlere Stufenkante: dezente Messinglinie.
  const midEdge = new THREE.Mesh(
    new THREE.TorusGeometry(midR, circumRadius * 0.003, 8, 64),
    new THREE.MeshStandardMaterial({ color: BRASS, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.7 })
  );
  midEdge.rotation.x = Math.PI / 2;
  midEdge.position.y = -tier1 - tier2;
  group.add(midEdge);

  // Aeusserste Plattformkante: duenner Navy-Ring statt Messing - fasst die
  // gesamte Sockel-Silhouette klar ein, ohne dass noch mehr Messing die
  // Flaeche dominiert ("very thin navy... ring can define the outer edge").
  const botEdge = new THREE.Mesh(
    new THREE.TorusGeometry(botR, circumRadius * 0.0022, 8, 64),
    new THREE.MeshStandardMaterial({ color: NAVY, metalness: 0.15, roughness: 0.4 })
  );
  botEdge.rotation.x = Math.PI / 2;
  botEdge.position.y = -tier1 - tier2 - tier3;
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
  // transparent von Anfang an: setColumns() blendet Saeulen nahe der
  // Kantenabschneidung sanft aus (Opacity-Fade) statt sie hart zu
  // verstecken - ein ploetzliches Verschwinden war als "Despawn" sichtbar.
  const shaftMat = new THREE.MeshStandardMaterial({ color: COL_STONE, metalness: 0.05, roughness: 0.5, transparent: true });
  const capMat = new THREE.MeshStandardMaterial({ color: COL_GOLD, metalness: 0.5, roughness: 0.3, transparent: true });

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
  { stageW, stageH, perspectivePx, ringRadius, drumHalfHeight, centerOffsetZ = 0, sides = 8, colWidth, colCapWidth, colCapHeight, cullDeg = 92 },
  ref
) {
  const containerRef = useRef(null);
  const stateRef = useRef({});

  useImperativeHandle(ref, () => ({
    // Von RotaryStage bei jedem Tick aufgerufen (gsap-Ticker, ~60fps) - mit
    // denselben live berechneten Werten, die vorher direkt auf die CSS-
    // Saeulen-transforms geschrieben wurden. degs: Grad je Saeule (gleiche
    // Formel wie zuvor: kuerzesterWeg(p - s + 0.5) * step).
    setColumns(degs, colRadius, pivotZ) {
      const { columns, ribs, renderer, scene, camera } = stateRef.current;
      if (!columns || !renderer) return;
      // Kein Opacity-Fade mehr: der war selbst als sichtbares "Verblassen"
      // beim Ein-/Austritt an der Kantenabschneidung wahrnehmbar, so schmal
      // das Fenster auch war. Die Inhaltsflaechen schneiden an genau
      // derselben Schwelle (CULL_DEG, siehe faceRefs-Schleife oben) schon
      // seit jeher hart per visibility um - ohne dass das je als Problem
      // auffiel. Saeule und Rippe jetzt exakt genauso: harter Schnitt bei
      // cullDeg, synchron mit ihrer Flaeche, keine Zwischenstufe.
      const fade = 1;
      // Rippen-Basiswinkel: Rippe k wurde in buildDomeRibs bei beta = k*step
      // (in Grad) aufgebaut - siehe dortige Schleife, mit x=+r*sin(beta).
      // Die Saeule dagegen nutzt x=-colRadius*sin(deg) (siehe unten, aus der
      // CSS-Rotationsmatrix) - ENTGEGENGESETZTES Vorzeichen. Die noetige
      // Zielausrichtung fuer die Rippe ist deshalb NICHT beta=deg, sondern
      // beta=-deg (numerisch verifiziert gegen die alte, gemeinsame
      // Gruppenrotation -degs[0], die genau das fuer k=0 ergab). Frueher
      // wurde EINE gemeinsame Rotation (-degs[0]) auf die ganze Gruppe
      // angewandt, aus der Annahme, dass k*step-degs[0] fuer alle k gleich
      // -degs[k] ist - das gilt aber nur, solange kuerzesterWeg() fuer keine
      // der Saeulen auf den "anderen" Zweig des Kreises wechselt. Genau an
      // der Kantenabschneidung (nahe cullDeg) kann das fuer eine einzelne
      // Saeule zuerst passieren, wodurch NUR ihre Rippe kurzzeitig an der
      // falschen Position sass. Jede Rippe bekommt jetzt ihre EIGENE exakte
      // Rotation statt der Annahme.
      const step = 360 / sides;
      columns.forEach((col, s) => {
        const deg = degs[s] ?? 0;
        const absDeg = Math.abs(deg);
        const hidden = absDeg >= cullDeg;
        col.visible = !hidden;
        // Zugehoerige Rippe (gleicher Index s, siehe buildDomeRibs) im
        // selben Takt ein-/ausblenden - sonst haengt eine goldene Rippe
        // sichtbar in der Luft, obwohl ihre Saeule schon ausgeblendet ist.
        const rib = ribs?.children[s];
        if (rib) {
          rib.visible = !hidden;
          if (!hidden) {
            rib.rotation.y = ((-deg - s * step) * Math.PI) / 180;
            const ribMats = rib.userData.mats;
            if (ribMats) ribMats.forEach((m) => { m.opacity = fade; });
          }
        }
        if (!hidden) {
          const rad = (deg * Math.PI) / 180;
          // CSS `rotateY(-deg) translateZ(colRadius)`: nach der CSS-
          // Rotationsmatrix (rechtshaendig, aber Y zeigt in CSS nach unten)
          // ergibt das x = -colRadius*sin(deg), z = colRadius*cos(deg) -
          // NICHT +sin(deg), das hatte Saeulen mittig auf die Facetten statt
          // auf die Nahtstellen gesetzt.
          col.position.set(-colRadius * Math.sin(rad), 0, colRadius * Math.cos(rad) + pivotZ);
          const mats = col.userData.mats;
          if (mats) mats.forEach((m) => { m.opacity = fade; });
        }
      });
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

    renderer.render(scene, camera);
    stateRef.current = { renderer, scene, camera, columns, ribs };

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
