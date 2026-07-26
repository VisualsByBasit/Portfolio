"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import ThreeGlobe from "three-globe";
import countries from "@/data/globe.json";

declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: ThreeElements["mesh"] & { new (): ThreeGlobe };
  }
}
extend({ ThreeGlobe });

// Cyan/purple palette (not the Aceternity reference's default whites/blues).
const CYAN = "#22d3ee";
const PURPLE = "#a78bfa";
const VIOLET = "#7c3aed";

type Location = { name: string; lat: number; lng: number };

const HOME: Location = { name: "Islamabad", lat: 33.6844, lng: 73.0479 };
const REMOTE: Location[] = [
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Kyiv", lat: 50.4501, lng: 30.5234 },
];
const ARC_COLORS = [CYAN, PURPLE, VIOLET, CYAN];

const ARCS = REMOTE.map((loc, i) => ({
  order: i,
  startLat: HOME.lat,
  startLng: HOME.lng,
  endLat: loc.lat,
  endLng: loc.lng,
  color: ARC_COLORS[i % ARC_COLORS.length],
}));

const POINTS = [
  { ...HOME, color: CYAN },
  ...REMOTE.map((loc, i) => ({ ...loc, color: ARC_COLORS[i % ARC_COLORS.length] })),
];

const GLOBE_RADIUS = 100;

function GlobeMesh({ onHover }: { onHover: (loc: Location | null, screenPos: { x: number; y: number } | null) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const globeRef = useRef<ThreeGlobe | null>(null);
  const [ready, setReady] = useState(false);
  const { size } = useThree();
  const hoveredRef = useRef<Location | null>(null);

  useEffect(() => {
    if (!groupRef.current || globeRef.current) return;
    const globe = new ThreeGlobe();
    globeRef.current = globe;
    (groupRef.current as unknown as THREE.Object3D).add(globe as unknown as THREE.Object3D);

    const material = globe.globeMaterial() as unknown as {
      color: THREE.Color;
      emissive: THREE.Color;
      emissiveIntensity: number;
      shininess: number;
      transparent: boolean;
      opacity: number;
    };
    material.color = new THREE.Color("#161033");
    material.emissive = new THREE.Color(VIOLET);
    material.emissiveIntensity = 0.28;
    material.shininess = 0.8;

    globe
      .hexPolygonsData((countries as { features: object[] }).features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .hexPolygonColor(() => `rgba(190, 170, 255, ${0.65 + Math.random() * 0.3})`)
      .showAtmosphere(true)
      .atmosphereColor(CYAN)
      .atmosphereAltitude(0.22);

    globe
      .arcsData(ARCS)
      .arcStartLat((d) => (d as { startLat: number }).startLat)
      .arcStartLng((d) => (d as { startLng: number }).startLng)
      .arcEndLat((d) => (d as { endLat: number }).endLat)
      .arcEndLng((d) => (d as { endLng: number }).endLng)
      .arcColor((d: object) => (d as { color: string }).color)
      .arcAltitude(0.28)
      .arcStroke(0.4)
      .arcDashLength(0.5)
      .arcDashGap(2)
      .arcDashInitialGap((d) => (d as { order: number }).order)
      .arcDashAnimateTime(2600);

    globe
      .pointsData(POINTS)
      .pointColor((d) => (d as { color: string }).color)
      .pointAltitude(0.012)
      .pointRadius(0.45)
      .pointsMerge(false);

    globe
      .ringsData([])
      .ringColor(() => (t: number) => `rgba(34, 211, 238, ${1 - t})`)
      .ringMaxRadius(4)
      .ringPropagationSpeed(2.4)
      .ringRepeatPeriod(900);

    setReady(true);
  }, []);

  // Idle ring pulse at a random point, independent of hover.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const loc = POINTS[Math.floor(Math.random() * POINTS.length)];
      globeRef.current?.ringsData([{ lat: loc.lat, lng: loc.lng }]);
    }, 2200);
    return () => clearInterval(id);
  }, [ready]);

  const sphere = useRef(new THREE.Sphere(new THREE.Vector3(0, 0, 0), GLOBE_RADIUS));
  const hitPoint = useRef(new THREE.Vector3());
  const pointerInsideRef = useRef(false);

  const pointLocalPosition = (loc: Location) => {
    const globe = globeRef.current;
    if (!globe) return null;
    // altitude 0 - same local-space frame the ray-sphere hit point below
    // is converted into, so both sides of the nearest-point comparison
    // are apples-to-apples without needing a lat/lng inverse.
    const coords = globe.getCoords(loc.lat, loc.lng, 0) as { x: number; y: number; z: number };
    return new THREE.Vector3(coords.x, coords.y, coords.z);
  };

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.06;
    if (!ready || !pointerInsideRef.current || !groupRef.current || !globeRef.current) {
      if (hoveredRef.current) {
        hoveredRef.current = null;
        onHover(null, null);
      }
      return;
    }

    // Raycast directly against the globe's own sphere rather than
    // relying on R3F's automatic mesh-hit picking - the atmosphere shell
    // is a larger sphere around the globe and would otherwise be hit
    // first, reporting an intersection point well outside the surface
    // any point marker actually sits on.
    sphere.current.radius = globeRef.current.getGlobeRadius();
    state.raycaster.setFromCamera(state.pointer, state.camera);
    const didHit = state.raycaster.ray.intersectSphere(sphere.current, hitPoint.current);
    if (!didHit) {
      if (hoveredRef.current) {
        hoveredRef.current = null;
        onHover(null, null);
      }
      return;
    }

    // Hit point is in world space - bring it into the globe's own
    // (rotating) local space so it lines up with getCoords() output.
    const localHit = groupRef.current.worldToLocal(hitPoint.current.clone());

    let nearest: Location | null = null;
    let nearestDist = Infinity;
    for (const loc of POINTS) {
      const p = pointLocalPosition(loc);
      if (!p) continue;
      const d = p.distanceTo(localHit);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = loc;
      }
    }

    const threshold = sphere.current.radius * 0.22;
    if (nearest && nearestDist < threshold) {
      if (hoveredRef.current?.name !== nearest.name) {
        hoveredRef.current = nearest;
        globeRef.current.ringsData([{ lat: nearest.lat, lng: nearest.lng }]);
      }
      const screenPoint = pointLocalPosition(nearest)!;
      groupRef.current.localToWorld(screenPoint);
      screenPoint.project(state.camera);
      onHover(nearest, {
        x: ((screenPoint.x + 1) / 2) * size.width,
        y: ((1 - screenPoint.y) / 2) * size.height,
      });
    } else if (hoveredRef.current) {
      hoveredRef.current = null;
      onHover(null, null);
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => {
        pointerInsideRef.current = true;
      }}
      onPointerLeave={() => {
        pointerInsideRef.current = false;
        hoveredRef.current = null;
        onHover(null, null);
      }}
    />
  );
}

export default function WorldGlobe() {
  const [hovered, setHovered] = useState<{ loc: Location; pos: { x: number; y: number } } | null>(null);

  return (
    <div className="world-globe-canvas">
      <Canvas camera={{ position: [0, 0, 320], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight color="#c7b8ff" intensity={1.3} />
        <directionalLight color={CYAN} position={[-260, 120, 200]} intensity={1.4} />
        <pointLight color={PURPLE} position={[200, 200, 200]} intensity={1.1} />
        <GlobeMesh
          onHover={(loc, pos) => setHovered(loc && pos ? { loc, pos } : null)}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.4}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI - Math.PI / 3.2}
        />
      </Canvas>
      {hovered && (
        <span
          className="world-globe-label"
          style={{ left: hovered.pos.x, top: hovered.pos.y }}
        >
          {hovered.loc.name}
        </span>
      )}
    </div>
  );
}
