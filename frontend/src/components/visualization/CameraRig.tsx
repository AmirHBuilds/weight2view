import { useEffect, useRef } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { fitCameraToBox, type CameraFit } from "./sceneBounds";

const FOV = 42;

interface Props {
  /** Box to fit around. Null when there's nothing to show yet. */
  box: THREE.Box3 | null;
  /** Bump this number to trigger a programmatic re-fit (e.g. "Fit to View" click, or a new box after adding/removing a reference). */
  fitToken: number;
}

export function CameraRig({ box, fitToken }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  // A direct ref to our own camera, rather than useThree().camera: the
  // drei <PerspectiveCamera makeDefault> registers itself as the default
  // camera slightly asynchronously relative to component mount order, so
  // reading useThree().camera in the same render/commit can momentarily
  // point at Fiber's internal placeholder camera instead of this one -
  // which silently no-ops the very first fit (black canvas until the user
  // manually triggers another fit). A direct ref sidesteps that entirely.
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const lastFit = useRef<CameraFit | null>(null);

  useEffect(() => {
    if (!box) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera) return;

    const fit = fitCameraToBox(box, FOV);
    lastFit.current = fit;

    camera.position.set(...fit.position);
    camera.near = fit.near;
    camera.far = fit.far;
    camera.fov = FOV;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.set(...fit.target);
      controls.minDistance = fit.minDistance;
      controls.maxDistance = fit.maxDistance;
      controls.update();
    }
    // fitToken is the intentional trigger - box identity changes too often
    // (new object each render) to use directly as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToken]);

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault fov={FOV} near={0.01} far={1000} />
      <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2 - 0.02} />
    </>
  );
}
