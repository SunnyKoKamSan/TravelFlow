import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ItineraryItem } from '@/types';

interface GlobeProps {
  width?: number;
  height?: number;
  items?: ItineraryItem[];
  destination?: { lat: number; lon: number; name: string } | null;
  isMini?: boolean;
}

export default function Globe({ width = 250, height = 250, items = [], destination, isMini = false }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = isMini ? 12 : 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const earthBump = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');
    const earthSpec = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png');

    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      map: earthMap,
      bumpMap: earthBump,
      bumpScale: 0.05,
      specularMap: earthSpec,
      specular: new THREE.Color('grey'),
      shininess: 10,
    });
    const earth = new THREE.Mesh(geometry, material);
    group.add(earth);

    const atmosGeo = new THREE.SphereGeometry(5.1, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Mesh(atmosGeo, atmosMat));

    scene.add(new THREE.AmbientLight(0x333333));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(10, 5, 10);
    scene.add(sunLight);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    globeGroupRef.current = group;

    const animate = () => {
      if (group) {
        group.rotation.y += 0.005;
        renderer.render(scene, camera);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      earthMap.dispose();
      earthBump.dispose();
      earthSpec.dispose();
    };
  }, [width, height, isMini]);

  useEffect(() => {
    if (!globeGroupRef.current) return;

    globeGroupRef.current.children = globeGroupRef.current.children.filter((c) => !(c.userData as any).isMarker);

    const uniqueLocs: Array<{ name: string; lat: number; lon: number }> = [];
    const seen = new Set<string>();

    if (destination) {
      uniqueLocs.push({ name: destination.name, lat: destination.lat, lon: destination.lon });
    } else if (items.length > 0) {
      items.forEach((item) => {
        if (item.lat && item.lon && !seen.has(item.location)) {
          uniqueLocs.push({ name: item.location, lat: item.lat, lon: item.lon });
          seen.add(item.location);
        }
      });
    } else {
      uniqueLocs.push({ name: 'Taipei', lat: 25.033, lon: 121.5654 });
    }

    uniqueLocs.forEach((city) => {
      const pos = latLonToVector3(city.lat, city.lon, 5);
      const mGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const mMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
      const marker = new THREE.Mesh(mGeo, mMat);
      marker.position.copy(pos);
      marker.userData = { isMarker: true };
      globeGroupRef.current!.add(marker);
    });
  }, [items, destination]);

  return <div ref={containerRef} style={{ width, height }} />;
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
