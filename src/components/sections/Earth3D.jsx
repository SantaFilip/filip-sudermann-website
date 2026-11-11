import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const TEXTURE_BASE =
  'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets';

export default function Earth3D() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

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

    const manager = new THREE.LoadingManager();
    manager.onLoad = () => setLoading(false);
    const textureLoader = new THREE.TextureLoader(manager);
    textureLoader.setCrossOrigin('anonymous');

    const earthMap = textureLoader.load(`${TEXTURE_BASE}/earth_atmos_2048.jpg`);
    const bumpMap = textureLoader.load(`${TEXTURE_BASE}/earth_normal_2048.jpg`);
    const specMap = textureLoader.load(`${TEXTURE_BASE}/earth_specular_2048.jpg`);
    const cloudMap = textureLoader.load(`${TEXTURE_BASE}/earth_clouds_1024.png`);

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthGeo = new THREE.SphereGeometry(1, 96, 96);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthMap,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specularMap: specMap,
      specular: new THREE.Color(0x2a2a2a),
      shininess: 18,
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
      // Eigener Standort (rot): Vermont, USA.
      { lat: 44.1, lon: -72.6, color: 0xff3b30 },
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

    // Lufthuelle - und zwar NACH INNEN. Vorher sass sie als Kugel mit
    // Radius 1.2 (spaeter 1.075) auf der Rueckseite um die Erde herum: jeder
    // Pixel dieses Scheins lag AUSSERHALB der Erdscheibe und faerbte den
    // cremefarbenen Grund blau ein. Genau das sollte weg - der Bereich um
    // das Modell muss exakt die Hintergrundfarbe behalten.
    //
    // Stattdessen Vorderseite auf Radius 1.004, also knapp innerhalb der
    // Silhouette, und die Helligkeit steigt zum Rand hin (Randaufhellung,
    // wie sie eine echte Atmosphaere zeigt, weil der Blick dort durch mehr
    // Luft geht). Die Kugel bekommt dadurch ihren Saum, ohne dass neben ihr
    // irgendetwas leuchtet.
    const atmGeo = new THREE.SphereGeometry(1.004, 72, 72);
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vBlick;
        void main() {
          vec4 sicht = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vBlick = normalize(-sicht.xyz);
          gl_Position = projectionMatrix * sicht;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vBlick;
        void main() {
          float rand = 1.0 - max(dot(vNormal, vBlick), 0.0);
          float intensity = pow(rand, 4.0) * 0.85;
          gl_FragColor = vec4(0.36, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    earthGroup.add(atmosphere);

    // Und der Saum AUSSEN: die sichtbare Lufthuelle, ein schmaler blauer
    // Ring ueber dem Rand der Kugel.
    //
    // Zwei Anlaeufe davor sind gescheitert, beide lehrreich:
    //   1. Additives Blenden. Auf dem cremefarbenen Grund kann das nur
    //      aufhellen - der Saum wurde weiss statt blau. Deshalb hier
    //      normales Alpha, die Farbe traegt selbst.
    //   2. Das Leuchten am Abstand zur Blickachse gemessen
    //      (length(viewPos.xy)). Durch die Perspektive liegt die SCHEINBARE
    //      Kante der Kugel weiter aussen als ihr Radius: bei Blickweite 4
    //      und Radius 1 erscheint sie unter asin(1/4) = 14.48 Grad, ein
    //      Punkt bei xy = 1 auf der Rueckseite dagegen nur unter 13.0 Grad.
    //      Der helle Teil des Saums lag damit INNERHALB der Erdscheibe und
    //      wurde von ihr verdeckt; sichtbar blieb nur sein schwaches Ende.
    //
    // Jetzt wird im Bild selbst gemessen: Abstand des Bildpunkts von der
    // Bildmitte (die Kugel steht auf der Blickachse, ihre Mitte ist also
    // die Bildmitte). uKante ist der scheinbare Radius der Erde in
    // Bildpunkten, uAussen das Ende des Saums. Dazwischen faellt die
    // Deckkraft ab, ausserhalb wird verworfen - der Ring sitzt damit exakt
    // auf der Kante, egal wie gross die Kugel gerade dargestellt wird.
    const SAUM_FAKTOR = 1.115;
    // tan(scheinbarer Radius) / tan(halber Blickwinkel), in Bildhoehen-Halben.
    const kanteRelativ =
      (1 / Math.sqrt(camera.position.z ** 2 - 1)) /
      Math.tan(((camera.fov / 2) * Math.PI) / 180);
    const saumGeo = new THREE.SphereGeometry(1.4, 64, 64);
    const saumMat = new THREE.ShaderMaterial({
      uniforms: {
        uMitte: { value: new THREE.Vector2(0, 0) },
        uKante: { value: 0 },
        uAussen: { value: 0 },
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 uMitte;
        uniform float uKante;
        uniform float uAussen;
        void main() {
          float r = length(gl_FragCoord.xy - uMitte);
          if (r < uKante || r > uAussen) discard;
          float t = (r - uKante) / (uAussen - uKante);
          float alpha = pow(1.0 - t, 1.9) * 0.8;
          gl_FragColor = vec4(0.17, 0.42, 0.88, alpha);
        }
      `,
      // Kein Tiefentest noetig und auch nicht erwuenscht: welcher Bildpunkt
      // zum Saum gehoert, entscheidet allein der Abstand oben. Die
      // Rueckseite sorgt dafuer, dass jeder Bildpunkt nur einmal gefuellt
      // wird (sonst laege der Ring doppelt uebereinander).
      side: THREE.BackSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const saum = new THREE.Mesh(saumGeo, saumMat);
    // renderOrder: zuletzt zeichnen, damit der Ring ueber Wolken und Nadeln
    // liegt und nicht von ihnen ueberschrieben wird.
    saum.renderOrder = 10;
    scene.add(saum);

    const saumMessen = () => {
      const puffer = renderer.getDrawingBufferSize(new THREE.Vector2());
      saumMat.uniforms.uMitte.value.set(puffer.x / 2, puffer.y / 2);
      saumMat.uniforms.uKante.value = (kanteRelativ * puffer.y) / 2;
      saumMat.uniforms.uAussen.value = saumMat.uniforms.uKante.value * SAUM_FAKTOR;
    };
    saumMessen();

    scene.add(new THREE.AmbientLight(0x3a3a4a, 0.7));
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
      saumMessen();
    };
    window.addEventListener('resize', handleResize);
    // Die Box aendert ihre Groesse auch ohne Fenster-Resize (Rolle skaliert
    // die Facette, CSS ueberschreibt max-width) - sonst behaelt der Canvas
    // das erste Mass und der Globus sitzt aus der Mitte verschoben.
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      earthGeo.dispose();
      earthMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmGeo.dispose();
      atmMat.dispose();
      saumGeo.dispose();
      saumMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
