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
 * Saeulen waren zunaechst noch eigene CSS-3D-Elemente (rotierten mit der
 * Trommel mit, wie die Facetten selbst) - technisch exakt, aber als
 * eigenstaendige DOM-Ebene neben dieser WebGL-Ebene fuer Dach/Sockel: zwei
 * getrennte Rendering-Schichten, die der Browser nur uebereinanderlegt
 * (Compositing), nicht in einem gemeinsamen Tiefenpuffer gegenseitig
 * verdecken kann. Jede Kalibrierung von Radius/Hoehe blieb Annaeherung.
 *
 * Jetzt leben Saeulen, Dach UND Sockel im selben WebGL-Scene-Graph - der
 * Browser/Three.js sortiert sie automatisch korrekt gegeneinander (echter
 * Tiefenpuffer). Nur die Inhaltsflaechen (Text, Bilder, Buttons) bleiben
 * CSS-3D-DOM - die muessen lesbar, scharf und interaktiv bleiben (Formulare,
 * Akkordeons, Calendly-Widget), das leistet WebGL nicht sinnvoll. Die
 * Saeulen sitzen an der Nahtstelle zwischen zwei Facetten und muessen daher
 * praktisch immer VOR dem Inhalt liegen, nie dahinter - das ist die einzige
 * Tiefenbeziehung, die zwischen der WebGL- und der DOM-Ebene ueberhaupt
 * vorkommt, und die feste Zeichenreihenfolge (dieser Layer nach der Buehne
 * im DOM) bildet sie korrekt ab.
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
const IVORY_DARK = 0xc9b898;
const GOLD = 0xc9973a;
const GOLD_LIGHT = 0xe8c97a;
const GOLD_DEEP = 0x8a6423;
const NAVY = 0x142a4d;
const STONE = 0xd9cbaa;

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
  // dafuer den (leeren) Canvas-Hintergrund und faerbt die Kuppel kalt-blau
  // statt warm-ivory. Undurchsichtig + clearcoat wirkt als festes Dach mit
  // Glanz statt als Glas: `transparent`/DoubleSide liess vorher die
  // Rueckseite der Kuppel durch die Vorderseite hindurchscheinen (zwei
  // ueberlagerte, halbtransparente Flaechen statt einer festen Kappe) - wirkt
  // dadurch schwebend statt aufliegend. `FrontSide` blendet ausserdem die von
  // der Kamera abgewandte Rueckseite komplett aus, es ist wirklich nur die
  // kameraseitige Haelfte zu sehen.
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: IVORY,
    metalness: 0.04,
    roughness: 0.22,
    transparent: false,
    opacity: 1,
    side: THREE.FrontSide,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
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

  // Rippen: rein dekorativ, feste Winkel (das Dach dreht nicht mit der
  // Trommel mit - eine Synchronisierung mit den Saeulen ergibt keinen Sinn,
  // die Trommel dreht sich kontinuierlich weiter).
  const ribMat = new THREE.LineBasicMaterial({ color: GOLD_DEEP, transparent: true, opacity: 0.55 });
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const pts = [];
    const steps = 12;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const r = t * circumRadius;
      const y = domeH * (1 - Math.pow(t, 1.5));
      pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    group.add(new THREE.Line(geo, ribMat));
  }

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

function buildBase(circumRadius, heightBudget) {
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
  const mat = new THREE.MeshStandardMaterial({ color: IVORY, metalness: 0.08, roughness: 0.55, side: THREE.DoubleSide });
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
// den Rundungs-Eindruck. Echtes Licht (siehe Scene-Lights) uebernimmt die
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
  const shaftMat = new THREE.MeshStandardMaterial({ color: STONE, metalness: 0.05, roughness: 0.5 });
  const capMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.5, roughness: 0.3 });

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

  return group;
}

const ArchitectureGL = forwardRef(function ArchitectureGL(
  { stageW, stageH, perspectivePx, circumRadius, ringRadius, drumHalfHeight, centerOffsetZ = 0, sides = 8, colWidth, colCapWidth, colCapHeight, cullDeg = 92 },
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
      const { columns, renderer, scene, camera } = stateRef.current;
      if (!columns || !renderer) return;
      columns.forEach((col, s) => {
        const deg = degs[s] ?? 0;
        const hidden = Math.abs(deg) > cullDeg;
        col.visible = !hidden;
        if (!hidden) {
          const rad = (deg * Math.PI) / 180;
          // CSS `rotateY(-deg) translateZ(colRadius)`: nach der CSS-
          // Rotationsmatrix (rechtshaendig, aber Y zeigt in CSS nach unten)
          // ergibt das x = -colRadius*sin(deg), z = colRadius*cos(deg) -
          // NICHT +sin(deg), das hatte Saeulen mittig auf die Facetten statt
          // auf die Nahtstellen gesetzt.
          col.position.set(-colRadius * Math.sin(rad), 0, colRadius * Math.cos(rad) + pivotZ);
        }
      });
      renderer.render(scene, camera);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !stageW || !stageH || !circumRadius || !ringRadius) return;

    const scene = new THREE.Scene();
    const fovRad = 2 * Math.atan(stageH / 2 / perspectivePx);
    const camera = new THREE.PerspectiveCamera((fovRad * 180) / Math.PI, stageW / stageH, 1, perspectivePx * 3);
    camera.position.set(0, 0, perspectivePx);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(stageW, stageH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff4e0, 0.65));
    const sun = new THREE.DirectionalLight(0xfff8ec, 1.15);
    sun.position.set(circumRadius * 0.6, circumRadius * 1.4, perspectivePx * 0.5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xaad4ff, 0.35);
    fill.position.set(-circumRadius, circumRadius * 0.3, perspectivePx * 0.2);
    scene.add(fill);

    // Dach/Sockel sitzen auf derselben Drehachse (centerOffsetZ) und mit
    // demselben Radius (ringRadius) wie die Saeulen - keine unabhaengig
    // "passend" geschaetzte Groesse mehr, sondern exakt derselbe Kreis, auf
    // dem auch die Saeulenkoepfe/-fuesse liegen. Zwei identische 3D-Punkte
    // fallen unter jeder Kamera/Projektion zusammen - das haelt auch bei
    // Rotation und aus jedem Blickwinkel, nicht nur zufaellig von vorne.
    const dome = buildDome(ringRadius, drumHalfHeight, sides);
    dome.position.set(0, drumHalfHeight, centerOffsetZ);
    scene.add(dome);

    const base = buildBase(ringRadius, drumHalfHeight);
    base.position.set(0, -drumHalfHeight, centerOffsetZ);
    scene.add(base);

    const columns = [];
    if (colWidth) {
      for (let s = 0; s < sides; s++) {
        const col = buildColumn(colWidth, colCapWidth, colCapHeight, drumHalfHeight * 2);
        scene.add(col);
        columns.push(col);
      }
    }

    renderer.render(scene, camera);
    stateRef.current = { renderer, scene, camera, columns };

    return () => {
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
      stateRef.current = {};
    };
  }, [stageW, stageH, perspectivePx, circumRadius, ringRadius, drumHalfHeight, centerOffsetZ, sides, colWidth, colCapWidth, colCapHeight]);

  return (
    <div
      ref={containerRef}
      data-architecture-gl=""
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
});

export default ArchitectureGL;
