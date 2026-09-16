import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Echtes 3D-Dach und -Sockel per WebGL, als Ersatz fuer die fruehere flache
 * SVG-Naeherung (siehe Architecture.jsx - bleibt als toter Code vorerst
 * nicht stehen, wird durch diese Datei ersetzt).
 *
 * Der Kern des Problems, das die SVG-Version nie loesen konnte: eine flache
 * 2D-Ellipse kann nur fuer EINE Kamera-Perspektive kalibriert werden - meist
 * die Frontflaeche. Jede andere sichtbare Facette der rotierenden Trommel
 * wird durch die echte 3D-Perspektive der Buehne (CSS `perspective`)
 * anders verkleinert/verschoben projiziert, und die flache Naeherung macht
 * diese Verzerrung nicht mit. Ergebnis: an der Frontflaeche sitzt Dach/
 * Sockel buendig, an den Seiten klafft eine Luecke.
 *
 * Die Loesung ist keine bessere 2D-Naeherung, sondern ECHTE 3D-Geometrie,
 * gerendert mit einer Kamera, die exakt dieselbe Projektion nutzt wie die
 * CSS-3D-Buehne (gleicher Blickwinkel, gleiche "Brennweite"). Ein echter
 * Kreis (der Dachrand/die Sockel-Plattform) ist rotationssymmetrisch - er
 * passt sich der drehenden Trommel bei JEDEM Winkel automatisch an, weil
 * beide von derselben Kamera unter denselben Gesetzen projiziert werden.
 *
 * CSS `perspective: Dpx` mit `perspective-origin: 50% 50%` entspricht einer
 * Kamera im Abstand D (in denselben Pixeln) von der z=0-Ebene, die genau
 * geradeaus blickt. Das vertikale Sichtfeld daraus:
 *   fovDeg = 2 * atan((stageHoehe / 2) / D) * 180/PI
 * Damit Geometrie, die bei y = +/- (cube.h/2) in "CSS-Pixel-Einheiten"
 * platziert wird, exakt an der Kante der Facetten-Trommel ankommt, die im
 * selben Pixel-Massstab per CSS transform positioniert ist.
 */

const IVORY = 0xf7f0e0;
const IVORY_DARK = 0xc9b898;
const GOLD = 0xc9973a;
const GOLD_LIGHT = 0xe8c97a;
const GOLD_DEEP = 0x8a6423;
const NAVY = 0x142a4d;
const GLASS = 0xdcebf5;

function buildDome(circumRadius, sides) {
  const group = new THREE.Group();
  const domeH = circumRadius * 0.24;
  const fasciaH = circumRadius * 0.035;

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
  // statt warm-ivory. Einfache Transparenz + clearcoat wirkt hier als
  // helles Glasdach und bleibt farblich kontrollierbar.
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: IVORY,
    metalness: 0.04,
    roughness: 0.22,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
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

function buildBase(circumRadius) {
  const group = new THREE.Group();
  const topR = circumRadius * 0.93;
  const midR = circumRadius * 1.1;
  const botR = circumRadius * 1.28;
  const tier1 = circumRadius * 0.05;
  const tier2 = circumRadius * 0.06;
  const tier3 = circumRadius * 0.07;

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

export default function ArchitectureGL({ stageW, stageH, perspectivePx, circumRadius, drumHalfHeight, centerOffsetZ = 0, sides = 8 }) {
  const containerRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !stageW || !stageH || !circumRadius) return;

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

    // Dach/Sockel sitzen bei z = centerOffsetZ (idR. 0, die Tiefe der
    // gerade aktiven, unverzerrten Frontflaeche) - der volle Saeulen-
    // Umkreisradius waere an dieser Tiefe zu breit (sein naechster Punkt
    // zur Kamera liegt sonst deutlich VOR der Wand und wirkt dadurch
    // ueberproportional vergroessert). Empirisch eingedaemmt, bis der
    // sichtbare Baukoerper mit der Fassade zusammenpasst statt sie zu
    // verschlucken.
    const domeBaseRadius = circumRadius * 0.62;

    const dome = buildDome(domeBaseRadius, sides);
    dome.position.set(0, drumHalfHeight, centerOffsetZ);
    scene.add(dome);

    const base = buildBase(domeBaseRadius);
    base.position.set(0, -drumHalfHeight, centerOffsetZ);
    scene.add(base);

    renderer.render(scene, camera);
    stateRef.current = { renderer, scene, camera };

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
    };
  }, [stageW, stageH, perspectivePx, circumRadius, drumHalfHeight, centerOffsetZ, sides]);

  return (
    <div
      ref={containerRef}
      data-architecture-gl=""
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}
