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
      color: new THREE.Color(0x3c4658),
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
      cloudGeo.dispose();
      cloudMat.dispose();
      atmGeo.dispose();
      atmMat.dispose();
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
