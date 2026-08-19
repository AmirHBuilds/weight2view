import * as THREE from "three";

/**
 * Shared geometry cache. Stylized models reuse a small set of primitive
 * geometries (box, cylinder, rounded box) scaled via the mesh's `scale`
 * prop rather than each constructing new BufferGeometry instances - keeps
 * polygon counts and allocations low even with several reference objects
 * on screen at once (Phase 2 performance requirement).
 */
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 12);
const torusGeometry = new THREE.TorusGeometry(0.5, 0.12, 8, 20);

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
