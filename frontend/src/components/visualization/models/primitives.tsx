import * as THREE from "three";

/**
 * Shared geometry cache. Stylized models reuse a small set of primitive
 * geometries (box, cylinder, rounded box) scaled via the mesh's `scale`
 * prop rather than each constructing new BufferGeometry instances - keeps
 * polygon counts and allocations low even with several reference objects
 * on screen at once (Phase 2 performance requirement).
 */
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 12);
const torusGeometry = new THREE.TorusGeometry(0.5, 0.09, 12, 32);

export function sharedBoxGeometry() {
  return boxGeometry;
}
export function sharedCylinderGeometry() {
  return cylinderGeometry;
}
export function sharedSphereGeometry() {
  return sphereGeometry;
}
export function sharedTorusGeometry() {
  return torusGeometry;
}

/** A box mesh sized via scale (l/w/h in scene units), reusing the shared unit-box geometry. */
export function Box({
  size,
  position = [0, 0, 0],
  color,
  opacity = 1,
  roughness = 0.5,
  metalness = 0,
  rotation,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  rotation?: [number, number, number];
}) {
  return (
    <mesh geometry={boxGeometry} position={position} scale={size} rotation={rotation}>
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

/** A cylinder mesh sized via scale (diameterX, height, diameterZ). */
export function Cyl({
  size,
  position = [0, 0, 0],
  color,
  opacity = 1,
  roughness = 0.5,
  metalness = 0,
  rotation,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  rotation?: [number, number, number];
}) {
  return (
    <mesh geometry={cylinderGeometry} position={position} scale={size} rotation={rotation}>
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

/**
 * A truncated cone (or true cylinder when radiusTop === radiusBottom),
 * built with its own geometry since a tapered profile can't be produced by
 * non-uniformly scaling the shared unit cylinder. Used for shapes with a
 * genuine taper - a bottle's shoulder, a mug's slight flare, a shoe's
 * tapered toe - where a plain cylinder or box would read as generic.
 */
export function Cone({
  radiusTop,
  radiusBottom,
  height,
  position = [0, 0, 0],
  rotation,
  color,
  opacity = 1,
  roughness = 0.5,
  metalness = 0,
  segments = 24,
}: {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  segments?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, segments]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}

/** A thin flat disc - camera lenses, dials, decals sitting flush on a surface. */
export function Disc({
  radius,
  thickness = 0.004,
  position = [0, 0, 0],
  rotation,
  color,
  roughness = 0.3,
  metalness = 0.2,
}: {
  radius: number;
  thickness?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={position} rotation={rotation ?? [Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, thickness, 20]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

/** A torus ring - wheels, handles - sized via non-uniform scale on the shared unit torus. */
export function Ring({
  size,
  position = [0, 0, 0],
  rotation,
  color,
  roughness = 0.5,
  metalness = 0,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh geometry={torusGeometry} position={position} rotation={rotation} scale={size}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}
