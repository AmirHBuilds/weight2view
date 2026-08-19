import * as THREE from "three";

export interface SceneObjectBounds {
  id: string;
  /** Bounding box size in scene units (already mm * SCALE). */
  size: [number, number, number]; // l, h, w
  /** Base position - object sits on the ground plane, base center at this X/Z, Y is always 0 (ground). */
  x: number;
  z: number;
}

/** Box3 for a single grounded object (base at y=0, extends up to size[1]). */
export function boundsToBox3({ size, x, z }: SceneObjectBounds): THREE.Box3 {
  const [l, h, w] = size;
  return new THREE.Box3(
    new THREE.Vector3(x - l / 2, 0, z - w / 2),
    new THREE.Vector3(x + l / 2, h, z + w / 2)
  );
}

export function unionBox3(objects: SceneObjectBounds[]): THREE.Box3 | null {
  if (objects.length === 0) return null;
  const box = boundsToBox3(objects[0]);
  for (let i = 1; i < objects.length; i++) {
    box.union(boundsToBox3(objects[i]));
  }
  return box;
}

/**
 * Lay out a row of objects along the X axis, centered around x=0, with a
 * gap between each pair proportional to their own sizes (so spacing stays
 * sensible whether objects are millimeter-scale or car-scale). Overlap is
 * avoided at any scale; scale itself is never altered - only position.
 */
export function layoutRow(sizes: { id: string; size: [number, number, number] }[]): SceneObjectBounds[] {
  if (sizes.length === 0) return [];
  const gaps: number[] = [];
  for (let i = 0; i < sizes.length - 1; i++) {
    gaps.push(Math.max(sizes[i].size[0], sizes[i + 1].size[0]) * 0.5);
  }
  const totalWidth =
    sizes.reduce((sum, s) => sum + s.size[0], 0) + gaps.reduce((sum, g) => sum + g, 0);

  let cursor = -totalWidth / 2;
  const result: SceneObjectBounds[] = [];
  sizes.forEach((s, i) => {
    const half = s.size[0] / 2;
    cursor += half;
    result.push({ id: s.id, size: s.size, x: cursor, z: 0 });
    cursor += half + (gaps[i] ?? 0);
  });
  return result;
}

export interface CameraFit {
  position: [number, number, number];
  target: [number, number, number];
  near: number;
  far: number;
  minDistance: number;
  maxDistance: number;
}

const VIEW_DIR = new THREE.Vector3(1, 0.62, 1.1).normalize();

/**
 * Compute a scale-aware camera placement that frames the given box with
 * comfortable padding, for any box size from millimeter-scale to
 * building-scale. This is what makes "Fit to View" (and the initial
 * framing) work correctly regardless of the calculated volume's magnitude.
 */
export function fitCameraToBox(box: THREE.Box3, fovDegrees: number, padding = 1.45): CameraFit {
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const radius = Math.max(size.length() / 2, 1e-6);
  const fov = (fovDegrees * Math.PI) / 180;
  const distance = (radius / Math.sin(fov / 2)) * padding;

  const position = center.clone().add(VIEW_DIR.clone().multiplyScalar(distance));

  return {
    position: [position.x, position.y, position.z],
    target: [center.x, center.y, center.z],
    near: Math.max(distance / 1000, radius / 5000),
    far: Math.max(distance * 20, radius * 50),
    minDistance: Math.max(radius * 0.08, distance * 0.02),
    maxDistance: distance * 12,
  };
}
