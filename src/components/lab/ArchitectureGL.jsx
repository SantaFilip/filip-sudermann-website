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

const IVORY = 0xf7f0e0;
const GOLD = 0xc9973a;
const GOLD_LIGHT = 0xe8c97a;
const GOLD_DEEP = 0x8a6423;
const NAVY = 0x142a4d;
const STONE = 0xd9cbaa;
const GLASS_BLUE = 0xcfe6f2;
const TILE_BLUE = '#2e5c96';
const TILE_BLUE_PALE = '#8fb3da';
const TILE_CREAM = '#f4ecd8';

// Helles, blau-weisses Fliesenmuster fuer den Sockel: griechisches
// Maeanderband (antik) auf cremefarbenem Grund, im Rhythmus blauer
// Kachelfelder wie chinesisches Blauweiss-Porzellan - per Canvas erzeugt,
// da keine externen Bild-Assets zur Verfuegung stehen.
function buildTileTexture() {
  // 1024 statt vorher 512 plus Anisotropie: bei 512 und dichter Wiederholung
  // (10x) kippte das Muster bei flachem Blickwinkel auf dem Sockel in
  // grobe, blockige Pixel-Kanten - las sich wie Retro-Konsolen-Grafik statt
  // hochwertiger Textur.
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = TILE_CREAM;
  ctx.fillRect(0, 0, size, size);

  const cell = size / 6;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const x = col * cell;
      const y = row * cell;
      if ((row + col) % 2 === 0) {
        ctx.fillStyle = TILE_BLUE_PALE + '22';
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }

  // Griechischer Maeander (Greek key), laufend um jede Kachelreihe -
  // duenner und mit abgerundeten Verbindungen statt harter Miter-Kanten,
  // wirkt weniger wie ein grob gepixeltes Icon.
  ctx.strokeStyle = TILE_BLUE;
  ctx.lineWidth = cell * 0.09;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const x = col * cell;
      const y = row * cell;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(cell * 0.18, cell * 0.82);
      ctx.lineTo(cell * 0.18, cell * 0.18);
      ctx.lineTo(cell * 0.82, cell * 0.18);
      ctx.lineTo(cell * 0.82, cell * 0.48);
      ctx.lineTo(cell * 0.48, cell * 0.48);
      ctx.lineTo(cell * 0.48, cell * 0.82);
      ctx.stroke();
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 1.3);
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#bfe0f5');
  grad.addColorStop(0.42, '#eaf4fb');
  grad.addColorStop(0.5, '#fff8ea');
  grad.addColorStop(0.58, '#f1e6cf');
  grad.addColorStop(1, '#cdbd98');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addLights(scene, circumRadius, perspectivePx) {
  scene.environment = buildEnvTexture();
  scene.add(new THREE.AmbientLight(0xfff4e0, 0.85));
  const sun = new THREE.DirectionalLight(0xfff8ec, 1.15);
  sun.position.set(circumRadius * 0.6, circumRadius * 1.4, perspectivePx * 0.5);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xaad4ff, 0.35);
  fill.position.set(-circumRadius, circumRadius * 0.3, perspectivePx * 0.2);
  scene.add(fill);
  // Von unten aufhellend: die Kuppel-Unterseite (die dem Betrachter
  // meist zugewandte Flaeche) zeigt nach unten und bekommt von sun/fill
  // (beide oberhalb) kaum Licht ab - wirkte dadurch dunkel/schmutzig statt
  // wie helles Glas.
  const upfill = new THREE.DirectionalLight(0xdcebf7, 0.5);
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
  const domeH = heightBudget * 0.55;
  // Sehr duenn halten: die Lippe haengt bewusst unter den Dachrand (y = 0,
  // die Wandkante) hinein, ist also der einzige Teil der Kuppel, der
  // ueberhaupt in den Bereich der Anzeigetafel hineinragt. Bei 9% kam es
  // auf kurzen/breiten Screens (wenig heightBudget, wenig Innenabstand im
  // Panel) schon vor, dass sie in die Ueberschrift hineinragte.
  const fasciaH = heightBudget * 0.02;

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
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: GLASS_BLUE,
    metalness: 0.1,
    roughness: 0.05,
    transparent: false,
    opacity: 1,
    side: THREE.FrontSide,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    reflectivity: 0.9,
    envMapIntensity: 1.4,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  group.add(dome);

  const fasciaProfile = [
    new THREE.Vector2(circumRadius, 0),
    new THREE.Vector2(circumRadius * 1.015, -fasciaH * 0.4),
    new THREE.Vector2(circumRadius * 1.01, -fasciaH),
    new THREE.Vector2(circumRadius * 0.98, -fasciaH),
  ];
  const fasciaGeo = new THREE.LatheGeometry(fasciaProfile, 64);
  const fasciaMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.55, roughness: 0.35, side: THREE.DoubleSide });
  const fascia = new THREE.Mesh(fasciaGeo, fasciaMat);
  group.add(fascia);

  // Bekroenung: schlanke Laterne mit Ring, sehr kompakt.
  const finialGroup = new THREE.Group();
  const poleH = domeH * 0.55;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(circumRadius * 0.006, circumRadius * 0.006, poleH, 12),
    new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.6, roughness: 0.3 })
  );
  pole.position.y = domeH + poleH / 2;
  finialGroup.add(pole);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(circumRadius * 0.028, circumRadius * 0.006, 12, 24),
    new THREE.MeshStandardMaterial({ color: GOLD_LIGHT, metalness: 0.6, roughness: 0.25 })
  );
  ring.position.y = domeH + poleH + circumRadius * 0.028;
  ring.rotation.x = Math.PI / 2;
  finialGroup.add(ring);
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(circumRadius * 0.012, 16, 16),
    new THREE.MeshStandardMaterial({ color: GOLD_DEEP, metalness: 0.5, roughness: 0.4 })
  );
  orb.position.y = ring.position.y;
  finialGroup.add(orb);
  group.add(finialGroup);

  return group;
}

// Goldene Rippen: kein duenner Strich mehr, sondern ein massiver, sich
// verjuengender Steg (der "Kegel mit Giebel zur Kuppelspitze"), der der
// Kuppel-Profilkurve EXAKT folgt (dieselben r/y-Werte wie oben) - die
// Rippe liegt dadurch garantiert genau auf der Kuppelflaeche, ohne Spalt
// oder Durchdringung. Lebt im FRONT-Layer (mit den Saeulen), weil sie mit
// ihnen mitdrehen muss - siehe deren dynamische Rotation in setColumns().
// Breite an der Traufe an der Kapitellbreite orientiert (columnCapWidth),
// damit sie optisch aus dem Saeulenkopf herauswaechst statt beliebig duenn/
// dick anzusetzen.
function buildDomeRibs(circumRadius, heightBudget, sides, columnCapWidth) {
  const group = new THREE.Group();
  const domeH = heightBudget * 0.55;
  const halfAngle = Math.max(0.012, (columnCapWidth || circumRadius * 0.09) / 2 / circumRadius);
  const steps = 14;
  const raise = 1.006; // minimal ueber die Kuppelflaeche angehoben, gegen Z-Fighting

  for (let i = 0; i < sides; i++) {
    const beta = (i / sides) * Math.PI * 2;
    const positions = [];
    const indices = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps; // 0 = Kuppelspitze, 1 = Traufe/Saeulenkopf
      const r = t * circumRadius * raise;
      const y = domeH * (1 - Math.pow(t, 1.5));
      const wa = halfAngle * t; // an der Spitze auf einen Punkt zulaufend
      const bL = beta - wa;
      const bR = beta + wa;
      positions.push(r * Math.sin(bL), y, r * Math.cos(bL));
      positions.push(r * Math.sin(bR), y, r * Math.cos(bR));
      if (s > 0) {
        const a = (s - 1) * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, b, c, b, d, c);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    // Eigenes Material je Rippe (nicht geteilt): jede Rippe muss unabhaengig
    // ein-/ausgeblendet werden koennen, synchron mit ihrer Saeule (siehe
    // setColumns) - sonst wuerde eine Rippe ohne zugehoerige, laengst
    // ausgeblendete Saeule weiter voll sichtbar in der Luft haengen.
    const ribMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.6, roughness: 0.28, side: THREE.DoubleSide, transparent: true });
    group.add(new THREE.Mesh(geo, ribMat));
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
    const edgeMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.55, roughness: 0.3 });
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
  const rimMat = new THREE.MeshStandardMaterial({ color: GOLD_LIGHT, metalness: 0.6, roughness: 0.25 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // Marmor-Umrandung um die Saeulenfuesse, edler als das nackte Fliesenfeld.
  group.add(buildBaseRing(topR, columnCapWidth || circumRadius * 0.1));

  // Stufenkanten in Gold, dezent.
  [midR, botR].forEach((r) => {
    const edgeGeo = new THREE.TorusGeometry(r, circumRadius * 0.003, 8, 64);
    const edgeMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.7 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = r === midR ? -tier1 - tier2 : -tier1 - tier2 - tier3;
    group.add(edge);
  });

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
  const shaftMat = new THREE.MeshStandardMaterial({ color: STONE, metalness: 0.05, roughness: 0.5, transparent: true });
  const capMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.5, roughness: 0.3, transparent: true });

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
      // Statt eines harten visible=false-Umschaltens (ein sichtbares
      // "Despawnen" der Saeule mitten im Bild) blendet ein Opacity-Fade
      // ueber ein paar Grad vor der eigentlichen Kantenabschneidung aus -
      // die Saeule loest sich unauffaellig auf, statt schlagartig zu
      // verschwinden.
      const fadeSpan = 16;
      const fadeStart = cullDeg - fadeSpan;
      columns.forEach((col, s) => {
        const deg = degs[s] ?? 0;
        const absDeg = Math.abs(deg);
        const fade = absDeg <= fadeStart ? 1 : absDeg >= cullDeg ? 0 : 1 - (absDeg - fadeStart) / fadeSpan;
        const hidden = fade <= 0;
        col.visible = !hidden;
        // Zugehoerige Rippe (gleicher Index s, siehe buildDomeRibs) im
        // selben Takt ein-/ausblenden - sonst haengt eine goldene Rippe
        // sichtbar in der Luft, obwohl ihre Saeule schon ausgeblendet ist.
        const rib = ribs?.children[s];
        if (rib) {
          rib.visible = !hidden;
          if (!hidden) rib.material.opacity = fade;
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
      // Rippen (Kegel-Giebel Saeule->Kuppelspitze) drehen als starre Gruppe
      // mit - alle Saeulen liegen jederzeit exakt `step` Grad auseinander,
      // nur ihre gemeinsame Phase verschiebt sich mit der Rotation. Rippe k
      // steht bei festem Basiswinkel k*step (gleiche sin/cos-Konvention wie
      // die Saeulen); rotiert man die ganze Gruppe um -degs[0], fallen alle
      // Rippen exakt auf die aktuellen Saeulenpositionen (hergeleitet:
      // fuer degK = (p-k+0.5)*step und Basiswinkel k*step kuerzt sich der
      // Index k komplett heraus, uebrig bleibt -degs[0] fuer jede Rippe
      // gleichermassen).
      if (ribs) ribs.rotation.y = (-(degs[0] ?? 0) * Math.PI) / 180;
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
