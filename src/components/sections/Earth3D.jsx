import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// Erdtextur per Canvas statt externer Bild-Dateien: die vorherige Version
// lud earth_atmos_2048.jpg & co. von raw.githubusercontent.com - das schlug
// in dieser Sandbox mit ERR_CERT_AUTHORITY_INVALID fehl, aber auch auf der
// echten Live-Seite kam nur eine schwarze Kugel an (der Nutzer hat das an
// der Produktion bestaetigt). Ein unversionierter Drittanbieter-Link ist
// schlicht keine verlaessliche Abhaengigkeit fuer ein Kernelement der
// Seite. Eine gezeichnete Karte funktioniert immer, unabhaengig vom Netz.
function buildEarthTexture() {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Ozean: dunkles Marineblau/Anthrazit statt hellem Blau - editorial statt
  // "starkem blauen Gluehen".
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#141b30');
  oceanGrad.addColorStop(0.5, '#1c2942');
  oceanGrad.addColorStop(1, '#141b30');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  const lonToX = (lon) => ((lon + 180) / 360) * w;
  const latToY = (lat) => ((90 - lat) / 180) * h;

  const blob = (points) => {
    ctx.beginPath();
    points.forEach(([lon, lat], i) => {
      const x = lonToX(lon), y = latToY(lat);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  };

  // Grob vereinfachte, aber erkennbare Kontinent-Umrisse - warmer, gedaempft
  // metallischer Ton statt sattem Gruen/Braun, passend zur restlichen
  // Elfenbein/Messing-Palette der Seite.
  ctx.fillStyle = '#b8926a';
  blob([[-165, 68], [-140, 70], [-95, 68], [-75, 50], [-80, 30], [-97, 18], [-105, 22], [-117, 32], [-124, 48], [-140, 60], [-165, 68]]); // Nordamerika
  blob([[-55, 83], [-20, 82], [-20, 68], [-45, 60], [-55, 70], [-55, 83]]); // Groenland
  blob([[-80, 10], [-60, 8], [-35, -5], [-40, -20], [-58, -38], [-70, -52], [-75, -40], [-80, -18], [-80, 10]]); // Suedamerika
  blob([[-9, 43], [2, 51], [15, 55], [30, 60], [38, 48], [25, 42], [15, 38], [0, 38], [-9, 43]]); // Europa
  blob([[-17, 15], [10, 35], [33, 31], [43, 12], [51, -2], [40, -26], [18, -35], [12, -18], [10, 5], [-17, 15]]); // Afrika
  blob([[27, 45], [45, 55], [70, 65], [100, 72], [140, 65], [160, 60], [150, 45], [130, 35], [110, 22], [95, 8], [80, 10], [68, 25], [50, 30], [35, 38], [27, 45]]); // Asien
  blob([[68, 25], [80, 8], [78, -2], [88, 12], [95, 15], [100, 5], [108, 10], [68, 25]]); // Indien/Suedostasien
  blob([[113, -22], [130, -12], [145, -17], [153, -28], [145, -38], [128, -35], [115, -32], [113, -22]]); // Australien

  [[138, 37], [-3, 54]].forEach(([lon, lat]) => {
    ctx.beginPath();
    ctx.ellipse(lonToX(lon), latToY(lat), w * 0.006, h * 0.02, 0.3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Sehr zurueckhaltende Breitenlinien - liest als Globus, nicht als Karte.
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.beginPath();
    ctx.moveTo(0, latToY(lat));
    ctx.lineTo(w, latToY(lat));
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Wolkenschicht ebenfalls prozedural: verstreute, unterschiedlich
// deckende Ellipsen auf transparentem Grund. deterministisch (Sinus statt
// Math.random), damit sich das Muster bei jedem Mount identisch aufbaut.
function buildCloudTexture() {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const rand = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 220; i++) {
    const x = rand(i * 3.1) * w;
    const y = rand(i * 7.7) * h;
    const r = 8 + rand(i * 2.3) * 26;
    ctx.globalAlpha = 0.08 + rand(i * 5.1) * 0.22;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.5, rand(i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Earth3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || 400,
    });
    let { w, h } = getSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'none';
    container.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const earthMap = buildEarthTexture();
    const cloudMap = buildCloudTexture();

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthGeo = new THREE.SphereGeometry(1, 96, 96);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthMap,
      specular: new THREE.Color(0x2a2a2a),
      shininess: 12,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earth);

    const cloudGeo = new THREE.SphereGeometry(1.016, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(clouds);

    const latLngToVector3 = (lat, lon, radius) => {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lon + 180) * Math.PI) / 180;
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };
    const PIN_LOCATIONS = [
      { lat: 51.5, lon: -0.1, color: 0xffd24a },
      { lat: 48.9, lon: 2.35, color: 0xffd24a },
      { lat: 40.4, lon: -3.7, color: 0xffd24a },
      { lat: 41.9, lon: 12.5, color: 0xffd24a },
      { lat: 52.4, lon: 4.9, color: 0xffd24a },
      { lat: 59.3, lon: 18.1, color: 0xffd24a },
      { lat: 48.2, lon: 16.4, color: 0xffd24a },
      { lat: 40.7, lon: -74.0, color: 0xffd24a },
      { lat: 34.0, lon: -118.2, color: 0xffd24a },
      { lat: 51.0, lon: 10.0, color: 0x8a4a3a },
    ];
    PIN_LOCATIONS.forEach((p) => {
      const pos = latLngToVector3(p.lat, p.lon, 1.018);
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        new THREE.MeshBasicMaterial({ color: p.color })
      );
      pin.position.copy(pos);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 12, 12),
        new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      halo.position.copy(pos);
      earthGroup.add(pin, halo);
    });

    const atmGeo = new THREE.SphereGeometry(1.2, 72, 72);
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
          gl_FragColor = vec4(0.75, 0.64, 0.44, 1.0) * intensity * 0.55;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    scene.add(atmosphere);

    scene.add(new THREE.AmbientLight(0x4a4438, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7);
    sun.position.set(5, 2.5, 4);
    scene.add(sun);

    earthGroup.rotation.x = -0.35;

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      renderer.domElement.style.cursor = 'grabbing';
      prevX = e.clientX;
      prevY = e.clientY;
      if (e.cancelable) e.preventDefault();
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      earthGroup.rotation.y += dx * 0.006;
      earthGroup.rotation.x += dy * 0.006;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onPointerUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isDragging) {
        earthGroup.rotation.y += 0.0014;
      }
      clouds.rotation.y += 0.0004;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const s = getSize();
      camera.aspect = s.w / s.h;
      camera.updateProjectionMatrix();
      renderer.setSize(s.w, s.h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      earthGeo.dispose();
      earthMat.dispose();
      earthMap.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      cloudMap.dispose();
      atmGeo.dispose();
      atmMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
