import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { DimensionIndicators } from "./DimensionIndicators";
import { ReferenceVisual } from "./models/ReferenceVisual";
import { layoutRow, unionBox3, type SceneObjectBounds } from "./sceneBounds";
import { formatMultiple } from "./ReferencePicker";
import type { LengthUnit } from "../../lib/units";

export interface SceneReference {
  id: string;
  name: string;
  shape: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  multiple: number; // target_volume / reference_volume
  /** GLB asset URL for this reference, if one exists (see ReferenceVisual for the GLB-vs-procedural decision). */
  modelUrl?: string | null;
}

interface Props {
  targetDims: { length_mm: number; width_mm: number; height_mm: number };
  references: SceneReference[];
  dimensionUnit: LengthUnit;
}

// Scale factor: mm -> scene units.
const SCALE = 1 / 300;
const TARGET_ID = "__target__";
const TARGET_COLOR = "#8fd8c7";
const REFERENCE_COLOR = "#c97b5d";

function toSceneSize(dims: { length_mm: number; width_mm: number; height_mm: number }): [number, number, number] {
  return [dims.length_mm * SCALE, dims.height_mm * SCALE, dims.width_mm * SCALE];
}

/**
 * The target cuboid AND its dimension indicators are rendered as one unit,
 * both positioned by the same `position` prop derived from this object's
 * own layout entry. This is what Phase 2's dimension-indicator bug fix
 * hinges on: indicators used to be rendered separately at the scene
 * origin, so when the reference set changed and the row layout re-centered
 * (shifting the target's X position), the target mesh moved but its
 * indicators didn't - they'd drift away from the object they describe.
 * Keeping them in the same positioned group makes that class of bug
 * impossible: there is exactly one source of truth for "where is the
 * target", and everything describing the target reads from it.
 */
function TargetShape({
  size,
  position,
  dimsMm,
  unit,
}: {
  size: [number, number, number];
  position: [number, number, number];
  dimsMm: { length_mm: number; width_mm: number; height_mm: number };
  unit: LengthUnit;
}) {
  const [l, h, w] = size;
  const edges = useMemo(() => new THREE.BoxGeometry(l, h, w), [l, w, h]);
  return (
    <group position={position}>
      <group position={[0, h / 2, 0]}>
        <RoundedBox args={[l, h, w]} radius={Math.min(l, w, h) * 0.06} smoothness={4}>
          <meshStandardMaterial color={TARGET_COLOR} roughness={0.35} metalness={0.05} transparent opacity={0.88} />
        </RoundedBox>
        <lineSegments>
          <edgesGeometry args={[edges]} />
          <lineBasicMaterial color="#5fa696" />
        </lineSegments>
      </group>
      <DimensionIndicators l={l} h={h} w={w} dimsMm={dimsMm} unit={unit} />
    </group>
  );
}

function ReferenceModel({
  reference,
  size,
  position,
}: {
  reference: SceneReference;
  size: [number, number, number];
  position: [number, number, number];
}) {
  const [l, h, w] = size;
  return (
    <group position={position}>
      <ReferenceVisual modelUrl={reference.modelUrl} shape={reference.shape} l={l} h={h} w={w} color={REFERENCE_COLOR} />
      <Html position={[0, h + Math.max(...size) * 0.12, 0]} center occlude={false}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-line bg-ink-soft/90 px-2 py-1 font-mono text-[10px] text-clay/90">
          {reference.name} · {formatMultiple(reference.multiple)}
        </div>
      </Html>
    </group>
  );
}

export function VolumeScene({ targetDims, references, dimensionUnit }: Props) {
  const [fitToken, setFitToken] = useState(0);

  const targetSize = toSceneSize(targetDims);
  const refSizes = references.map((r) => ({
    id: r.id,
    size: toSceneSize(r),
  }));

  const layout = useMemo(
    () => layoutRow([{ id: TARGET_ID, size: targetSize }, ...refSizes]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetDims.length_mm, targetDims.width_mm, targetDims.height_mm, references.map((r) => r.id).join(",")]
  );

  // Object identity is looked up by id, every render - never by array
  // index and never cached across composition changes, so a reference
  // being added/removed can't cause another object to silently inherit
  // stale bounds.
  const layoutById = new Map<string, SceneObjectBounds>(layout.map((o) => [o.id, o]));
  const targetLayout = layoutById.get(TARGET_ID)!;

  // Recompute fit whenever the object set changes (new calculation, or references added/removed).
  const sceneSignature = `${targetDims.length_mm}|${references.map((r) => r.id).join(",")}`;
  const lastSignature = useRef<string | null>(null);
  useEffect(() => {
    if (lastSignature.current !== sceneSignature) {
      lastSignature.current = sceneSignature;
      setFitToken((t) => t + 1);
    }
  }, [sceneSignature]);

  const fitBox = useMemo(() => unionBox3(layout), [layout]);

  function handleManualFit() {
    setFitToken((t) => t + 1);
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-line bg-ink-soft">
      <div className="relative h-[420px] w-full sm:h-[500px]">
        <Canvas dpr={[1, 2]}>
          <color attach="background" args={["#12141a"]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 3]} intensity={1.1} />
          <directionalLight position={[-4, 3, -3]} intensity={0.3} />

          <CameraRig box={fitBox} fitToken={fitToken} />

          <Suspense fallback={null}>
            <TargetShape
              size={targetSize}
              position={[targetLayout.x, 0, targetLayout.z]}
              dimsMm={targetDims}
              unit={dimensionUnit}
            />
            {references.map((r) => {
              const obj = layoutById.get(r.id);
              if (!obj) return null;
              return <ReferenceModel key={r.id} reference={r} size={obj.size} position={[obj.x, 0, obj.z]} />;
            })}
          </Suspense>

          <Grid
            args={[40, 40]}
            cellSize={0.2}
            cellThickness={0.5}
            cellColor="#2b2e37"
            sectionSize={1}
            sectionThickness={1}
            sectionColor="#3a3e4a"
            fadeDistance={30}
            fadeStrength={1}
            infiniteGrid
          />
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
          <div className="pointer-events-auto flex gap-2">
            <button
              type="button"
              onClick={handleManualFit}
              className="rounded-full border border-line bg-ink-soft/95 px-3 py-1.5 font-mono text-xs text-paper-dim transition-colors hover:border-teal-dim hover:text-teal"
            >
              ⤢ Fit to view
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
