import { useMemo } from "react";
import { loadGLTFSuspendable } from "./glbLoader";
import { normalizeModelToTarget } from "./normalizeModel";

interface Props {
  url: string;
  /** Target bounding box in scene units: [length, height, width]. */
  target: [number, number, number];
}

/**
 * Loads a GLB (via the hand-rolled loader in glbLoader.ts - see that file
 * for why it's not drei's useGLTF) and normalizes it to the target
 * physical bounding box. This component throws on load failure by design;
 * it does not catch errors itself - the parent is responsible for wrapping
 * it in <Suspense> and an error boundary (see ReferenceVisual.tsx).
 */
export function GLBModel({ url, target }: Props) {
  const gltf = loadGLTFSuspendable(url);

  // Re-normalize only when the source scene or target box actually
  // changes - this is a real (if cheap) computation (Box3 traversal +
  // hierarchy clone), not something to redo every render.
  const normalized = useMemo(
    () => normalizeModelToTarget(gltf.scene, target),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gltf.scene, target[0], target[1], target[2]]
  );

  // dispose={null}: our clone's meshes reference the SAME geometry/material
  // objects as the cached original (Object3D.clone() is a shallow clone of
  // geometry/materials, deep only for the node hierarchy/transforms).
  // Letting R3F auto-dispose on unmount would destroy geometry that the
  // cached original - and any other instance of this model - still needs.
  return <primitive object={normalized.object} dispose={null} />;
}
