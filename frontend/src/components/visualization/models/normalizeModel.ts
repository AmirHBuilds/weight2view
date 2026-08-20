import * as THREE from "three";

/**
 * Normalizes an arbitrary loaded GLTF scene graph to a target physical
 * bounding box (scene units, already mm * SCALE - see VolumeScene).
 *
 * Contract: the DATABASE's length/width/height is always the physical
 * source of truth (see reference_objects.length_mm/width_mm/height_mm).
 * The GLB's native scale, units, and pivot are treated as completely
 * unknown/untrusted - this function measures the model's actual rendered
 * geometry (full hierarchy, every mesh/child) and transforms it to match,
 * rather than trusting anything about how the asset was authored.
 *
 * Scaling is UNIFORM (a single scale factor across X/Y/Z), not independent
 * per axis. Independent-axis scaling would force-fit the model into the
 * target box but distort its proportions (an oval wheel, a squashed
 * bottle) - which defeats the entire purpose of switching to real assets
 * for recognizability. We use a "contain" fit: the largest uniform scale
 * that keeps every axis at or under the target size. This means a model
 * whose native proportions don't exactly match the database's L/W/H will
 * end up slightly smaller than the target box on 1-2 axes rather than
 * distorted - conservative in the direction that protects Weight2View's
 * "never render something bigger than its real relative size" guarantee.
 */
export interface NormalizedModel {
  object: THREE.Object3D;
  /** The model's ACTUAL rendered size after normalization (scene units) - may be
   * smaller than the target on 1-2 axes if the source asset's proportions
   * don't exactly match the database dimensions (contain-fit). Dimension
   * indicators and any bounds-dependent UI should prefer this over the
   * nominal target size when precision matters. */
  actualSize: [number, number, number];
  scale: number;
}

const MIN_DIMENSION = 1e-6;

export function normalizeModelToTarget(
  source: THREE.Object3D,
  target: [number, number, number]
): NormalizedModel {
  // Clone the hierarchy so we never mutate the shared, cached instance
  // that drei's useGLTF returns (the same cached object could be reused
  // by another reference at a different target size, or re-rendered
  // after Suspense/StrictMode remounts).
  const cloned = source.clone(true);

  const box = new THREE.Box3().setFromObject(cloned);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const safeSizeX = Math.max(size.x, MIN_DIMENSION);
  const safeSizeY = Math.max(size.y, MIN_DIMENSION);
  const safeSizeZ = Math.max(size.z, MIN_DIMENSION);

  const [targetL, targetH, targetW] = target;
  const scale = Math.min(targetL / safeSizeX, targetH / safeSizeY, targetW / safeSizeZ);

  // Recenter in the clone's own local space (computed box is already in
  // this space since the clone currently has no parent transform): shift
  // so X/Z are centered on 0 and the bottom (min Y) sits on the ground
  // plane at Y=0 - matching the convention every procedural model already
  // follows, so downstream code (layout, camera fit) doesn't need to know
  // or care whether an object is a GLB or procedural.
  cloned.position.x -= center.x;
  cloned.position.z -= center.z;
  cloned.position.y -= box.min.y;

  const wrapper = new THREE.Group();
  wrapper.scale.setScalar(scale);
  wrapper.add(cloned);

  return {
    object: wrapper,
    actualSize: [safeSizeX * scale, safeSizeY * scale, safeSizeZ * scale],
    scale,
  };
}
